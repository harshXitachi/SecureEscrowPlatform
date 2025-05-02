import OpenAI from "openai";
import { z } from "zod";
import { db } from "@db";
import { messages, users, transactions, disputes } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Message validation schema
const chatMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  userId: z.number(),
  language: z.enum(["english", "hindi", "hinglish"]).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Language detection function
function detectLanguage(text: string): "english" | "hindi" | "hinglish" {
  // Simple language detection based on character sets and patterns
  // For a production app, use a more sophisticated library like 'langdetect'
  const hindiPattern = /[\u0900-\u097F]/; // Hindi Unicode range
  const englishPattern = /[a-zA-Z]/;
  
  const hasHindi = hindiPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  
  if (hasHindi && hasEnglish) {
    return "hinglish";
  } else if (hasHindi) {
    return "hindi";
  } else {
    return "english";
  }
}

// Function to get transaction info for a user
async function getUserTransactionInfo(userId: number) {
  const userTransactions = await db.query.transactions.findMany({
    where: (transactions, { or, eq }) => or(
      eq(transactions.buyerId, userId),
      eq(transactions.sellerId, userId)
    ),
    with: {
      buyer: {
        columns: {
          id: true,
          username: true,
        },
      },
      seller: {
        columns: {
          id: true,
          username: true,
        },
      },
      milestones: true,
    },
    orderBy: [desc(transactions.createdAt)],
    limit: 5,
  });
  
  return userTransactions;
}

// Function to get user dispute information
async function getUserDisputeInfo(userId: number) {
  const userDisputes = await db.query.disputes.findMany({
    where: (disputes, { or, eq }) => or(
      eq(disputes.raisedById, userId),
      eq(disputes.assignedToId, userId) // The schema has assignedToId not defendantId
    ),
    with: {
      transaction: true,
      raisedBy: {
        columns: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: [desc(disputes.createdAt)],
    limit: 3,
  });
  
  return userDisputes;
}

// Get conversation history for a user
async function getConversationHistory(userId: number, limit = 10) {
  const conversationHistory = await db.query.messages.findMany({
    where: eq(messages.senderId, userId),
    orderBy: [desc(messages.createdAt)],
    limit,
  });
  
  return conversationHistory.reverse();
}

// Store a message in the database
async function storeMessage(message: ChatMessage, isBot: boolean) {
  const [newMessage] = await db.insert(messages).values({
    content: message.content,
    senderId: message.userId,
    isRead: isBot ? false : true,
  }).returning();
  
  return newMessage;
}

// System prompts for different languages
const systemPrompts = {
  english: `You are an AI assistant for Middlesman, an escrow platform. 
            You help users with transaction creation, escrow processes, dispute resolution, and account management.
            Be friendly, concise, and helpful. Explain complex processes in simple terms.
            Only provide information related to the Middlesman escrow platform.
            Avoid making up information if you don't know the answer.
            For transaction-specific questions, ask for transaction IDs or other identifying information.`,
  
  hindi: `आप Middlesman के लिए एक AI सहायक हैं, जो एक एस्क्रो प्लेटफॉर्म है।
          आप उपयोगकर्ताओं को लेनदेन बनाने, एस्क्रो प्रक्रियाओं, विवाद समाधान और खाता प्रबंधन में मदद करते हैं।
          मित्रवत, संक्षिप्त और सहायक रहें। जटिल प्रक्रियाओं को सरल शब्दों में समझाएं।
          केवल Middlesman एस्क्रो प्लेटफॉर्म से संबंधित जानकारी प्रदान करें।
          यदि आप उत्तर नहीं जानते हैं तो जानकारी बनाने से बचें।
          लेनदेन-विशिष्ट प्रश्नों के लिए, लेनदेन आईडी या अन्य पहचान जानकारी के लिए पूछें।`,
  
  hinglish: `Aap Middlesman ke liye ek AI assistant hain, jo ek escrow platform hai.
            Aap users ko transaction creation, escrow processes, dispute resolution, aur account management mein help karte hain.
            Friendly, concise, aur helpful rahein. Complex processes ko simple terms mein explain karein.
            Sirf Middlesman escrow platform se related information provide karein.
            Agar aap answer nahi jaante hain to information create karne se bachein.
            Transaction-specific questions ke liye, transaction IDs ya other identifying information ke liye puchein.`
}

// Function to generate a response from OpenAI
export async function generateChatbotResponse(message: ChatMessage): Promise<string> {
  try {
    // Validate the message
    chatMessageSchema.parse(message);
    
    // Detect language if not provided
    const language = message.language || detectLanguage(message.content);
    
    // Store user message
    await storeMessage({...message, language}, false);
    
    // Get conversation history
    const conversationHistory = await getConversationHistory(message.userId, 10);
    
    // Get user context information
    const userTransactions = await getUserTransactionInfo(message.userId);
    const userDisputes = await getUserDisputeInfo(message.userId);
    
    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, message.userId),
      columns: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
    
    // Create prompt context
    const systemPrompt = systemPrompts[language] || systemPrompts.english;
    
    // Create messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      // Add context about the user
      { 
        role: "system", 
        content: `User Information: ${JSON.stringify({
          username: user?.username,
          joinedDate: user?.createdAt,
          recentTransactions: userTransactions.length,
          activeDisputes: userDisputes.length,
        })}` 
      },
    ];
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      // In our schema we don't have a 'isBot' field, so let's determine based on the message
      // If the message's senderId is the same as userId, it's from the user, otherwise from the bot
      const isUserMessage = msg.senderId === message.userId;
      openaiMessages.push({
        role: isUserMessage ? "user" : "assistant",
        content: msg.content,
      });
    });
    
    // Add current message
    openaiMessages.push({ role: "user", content: message.content });
    
    // Generate response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: openaiMessages as any,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const botResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
    
    // Store bot response
    await storeMessage({
      content: botResponse,
      userId: message.userId,
      language,
    }, true);
    
    return botResponse;
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return "I'm having trouble understanding. Please try again later.";
  }
}

// Function to get a list of FAQs based on the user's language preference
export function getFAQs(language: "english" | "hindi" | "hinglish" = "english") {
  const faqs = {
    english: [
      {
        question: "How does escrow work?",
        answer: "Escrow is a secure payment method where Middlesman acts as a trusted third party: 1) The buyer deposits funds with us, 2) The seller is notified that funds are secure, 3) The seller delivers the goods/service, 4) The buyer confirms everything is satisfactory, 5) We release the funds to the seller. This ensures security for both parties."
      },
      {
        question: "What are your fees?",
        answer: "For standard escrow transactions, Middlesman charges: 2.5% for transactions under ₹10,000, 2% for transactions between ₹10,000-₹50,000, and 1.5% for transactions above ₹50,000. Additional fees may apply for premium services."
      },
      {
        question: "How do I create a transaction?",
        answer: "To create a transaction: 1) Log into your account, 2) Click 'New Transaction' on your dashboard, 3) Enter the seller's details and amount, 4) Specify any terms or conditions, 5) Review and confirm the details."
      },
      {
        question: "What payment methods are supported?",
        answer: "We support multiple payment methods including UPI (PhonePe, Google Pay, Paytm), Credit/Debit cards, Net Banking, Digital Wallets, International options (PayPal), and Cryptocurrencies."
      },
      {
        question: "How do I raise a dispute?",
        answer: "To raise a dispute: 1) Go to the transaction page, 2) Click the 'Raise Dispute' button, 3) Select the reason for dispute, 4) Provide details about your issue, 5) Submit any evidence or documentation. Our team will review the case within 24 hours."
      }
    ],
    hindi: [
      {
        question: "एस्क्रो कैसे काम करता है?",
        answer: "एस्क्रो एक सुरक्षित भुगतान पद्धति है जहां Middlesman विश्वसनीय तीसरे पक्ष के रूप में कार्य करता है: 1) खरीदार हमारे पास धनराशि जमा करता है, 2) विक्रेता को सूचित किया जाता है कि धनराशि सुरक्षित है, 3) विक्रेता वस्तु/सेवा को डिलीवर करता है, 4) खरीदार पुष्टि करता है कि सब कुछ संतोषजनक है, 5) हम विक्रेता को धनराशि जारी करते हैं। यह दोनों पक्षों के लिए सुरक्षा सुनिश्चित करता है।"
      },
      {
        question: "आपका शुल्क क्या है?",
        answer: "मानक एस्क्रो लेनदेन के लिए, Middlesman शुल्क लेता है: ₹10,000 से कम के लेनदेन के लिए 2.5%, ₹10,000-₹50,000 के बीच के लेनदेन के लिए 2%, और ₹50,000 से अधिक के लेनदेन के लिए 1.5%। प्रीमियम सेवाओं के लिए अतिरिक्त शुल्क लागू हो सकता है।"
      },
      {
        question: "मैं लेनदेन कैसे बनाऊं?",
        answer: "लेनदेन बनाने के लिए: 1) अपने खाते में लॉग इन करें, 2) अपने डैशबोर्ड पर 'नया लेनदेन' पर क्लिक करें, 3) विक्रेता का विवरण और राशि दर्ज करें, 4) कोई शर्तें या नियम निर्दिष्ट करें, 5) विवरण की समीक्षा करें और पुष्टि करें।"
      },
      {
        question: "कौन से भुगतान तरीके समर्थित हैं?",
        answer: "हम कई भुगतान तरीकों का समर्थन करते हैं जिनमें UPI (PhonePe, Google Pay, Paytm), क्रेडिट/डेबिट कार्ड, नेट बैंकिंग, डिजिटल वॉलेट, अंतरराष्ट्रीय विकल्प (PayPal), और क्रिप्टोकरेंसी शामिल हैं।"
      },
      {
        question: "मैं विवाद कैसे उठाऊं?",
        answer: "विवाद उठाने के लिए: 1) लेनदेन पेज पर जाएँ, 2) 'विवाद उठाएँ' बटन पर क्लिक करें, 3) विवाद का कारण चुनें, 4) अपनी समस्या के बारे में विवरण प्रदान करें, 5) कोई सबूत या दस्तावेज़ जमा करें। हमारी टीम 24 घंटों के भीतर मामले की समीक्षा करेगी।"
      }
    ],
    hinglish: [
      {
        question: "Escrow kaise kaam karta hai?",
        answer: "Escrow ek secure payment method hai jahan Middlesman trusted third party ke roop mein kaam karta hai: 1) Buyer funds ko hamare paas deposit karta hai, 2) Seller ko notify kiya jata hai ki funds secure hain, 3) Seller goods/service deliver karta hai, 4) Buyer confirm karta hai ki sab kuch satisfactory hai, 5) Hum funds ko seller ko release karte hain. Yeh dono parties ke liye security ensure karta hai."
      },
      {
        question: "Aapke fees kya hain?",
        answer: "Standard escrow transactions ke liye, Middlesman charges karta hai: ₹10,000 se kam transactions ke liye 2.5%, ₹10,000-₹50,000 ke beech transactions ke liye 2%, aur ₹50,000 se upar transactions ke liye 1.5%. Premium services ke liye additional fees apply ho sakte hain."
      },
      {
        question: "Main transaction kaise create karoon?",
        answer: "Transaction create karne ke liye: 1) Apne account mein login karein, 2) Dashboard par 'New Transaction' par click karein, 3) Seller ka details aur amount enter karein, 4) Koi terms ya conditions specify karein, 5) Details ko review karein aur confirm karein."
      },
      {
        question: "Konse payment methods supported hain?",
        answer: "Hum multiple payment methods support karte hain jisme UPI (PhonePe, Google Pay, Paytm), Credit/Debit cards, Net Banking, Digital Wallets, International options (PayPal), aur Cryptocurrencies shamil hain."
      },
      {
        question: "Main dispute kaise raise karoon?",
        answer: "Dispute raise karne ke liye: 1) Transaction page par jaayein, 2) 'Raise Dispute' button par click karein, 3) Dispute ka reason select karein, 4) Apni issue ke baare mein details provide karein, 5) Koi evidence ya documentation submit karein. Hamari team 24 hours ke andar case review karegi."
      }
    ]
  };

  return faqs[language] || faqs.english;
}