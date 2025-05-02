import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Check if users already exist
    const existingUsers = await db.query.users.findMany();
    
    let johnId = 0;
    let janeId = 0;
    let sarahId = 0;

    if (existingUsers.length === 0) {
      console.log("Creating users...");
      
      // Create buyer user
      const [john] = await db.insert(schema.users).values({
        username: "johnsmith",
        password: hashedPassword,
      }).returning({ id: schema.users.id });
      johnId = john.id;
      
      // Create seller user
      const [jane] = await db.insert(schema.users).values({
        username: "janedoe",
        password: hashedPassword,
      }).returning({ id: schema.users.id });
      janeId = jane.id;
      
      // Create admin users
      const [sarah] = await db.insert(schema.users).values({
        username: "sarahadmin",
        password: hashedPassword,
        role: "admin",
      }).returning({ id: schema.users.id });
      sarahId = sarah.id;
      
      // Create main admin user with specified credentials
      await db.insert(schema.users).values({
        username: "middelman001",
        password: await bcrypt.hash("okyr001", 10),
        role: "admin",
      }).returning();
      
      console.log("Users created successfully.");
    } else {
      console.log("Users already exist, using existing users.");
      johnId = existingUsers[0].id;
      janeId = existingUsers[1].id;
      sarahId = existingUsers[2].id;
      
      // Check if admin user with username middelman001 exists
      const adminExists = await db.query.users.findFirst({
        where: (users) => eq(users.username, "middelman001")
      });
      
      // Create the admin user if it doesn't exist
      if (!adminExists) {
        console.log("Creating admin user with credentials...");
        await db.insert(schema.users).values({
          username: "middelman001",
          password: await bcrypt.hash("okyr001", 10),
          role: "admin",
        }).returning();
      }
    }

    // Check if transactions already exist
    const existingTransactions = await db.query.transactions.findMany();
    
    if (existingTransactions.length === 0) {
      console.log("Creating transactions...");
      
      // Create a transaction
      const [transaction] = await db.insert(schema.transactions).values({
        title: "Purchase of MacBook Pro",
        description: "Used MacBook Pro 16\" in excellent condition",
        amount: 120000,
        type: "goods",
        status: "pending",
        escrowStatus: "awaiting_payment",
        paymentStatus: "unpaid",
        buyerId: johnId,
        sellerId: janeId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create milestones for the transaction
      await db.insert(schema.milestones).values({
        transactionId: transaction.id,
        title: "Inspection Period",
        description: "Buyer has 3 days to inspect the laptop after delivery",
        amount: 120000,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create a second transaction
      const [transaction2] = await db.insert(schema.transactions).values({
        title: "Website Development",
        description: "E-commerce website development for fashion store",
        amount: 80000,
        type: "services",
        status: "in_progress",
        escrowStatus: "funded",
        paymentStatus: "paid",
        buyerId: janeId,
        sellerId: johnId,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date()
      }).returning();
      
      // Create milestones for the second transaction
      await db.insert(schema.milestones).values([
        {
          transactionId: transaction2.id,
          title: "Design Phase",
          description: "UI/UX design and approval",
          amount: 20000,
          status: "completed",
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date()
        },
        {
          transactionId: transaction2.id,
          title: "Development Phase",
          description: "Frontend and backend development",
          amount: 40000,
          status: "in_progress",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date()
        },
        {
          transactionId: transaction2.id,
          title: "Testing and Deployment",
          description: "Final testing and site deployment",
          amount: 20000,
          status: "pending",
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          updatedAt: new Date()
        }
      ]);
      
      // Create a third transaction with a dispute
      const [transaction3] = await db.insert(schema.transactions).values({
        title: "Interior Design Consultation",
        description: "Interior design services for 3BHK apartment",
        amount: 45000,
        type: "services",
        status: "disputed",
        escrowStatus: "dispute_resolution",
        paymentStatus: "paid",
        buyerId: johnId,
        sellerId: janeId,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        updatedAt: new Date()
      }).returning();
      
      // Create a milestone for the third transaction
      await db.insert(schema.milestones).values({
        transactionId: transaction3.id,
        title: "Complete Design",
        description: "Full interior design plan with material suggestions",
        amount: 45000,
        status: "disputed",
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        updatedAt: new Date()
      });
      
      // Create a dispute for the third transaction
      const [dispute] = await db.insert(schema.disputes).values({
        transactionId: transaction3.id,
        title: "Incomplete Work",
        description: "The design plans are missing kitchen and bathroom details",
        status: "under_review",
        outcome: null,
        buyerEvidence: "The contract clearly specified all rooms must be included",
        sellerEvidence: "The kitchen and bathroom were excluded as per initial discussion",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date()
      }).returning();
      
      // Create evidence for the dispute
      await db.insert(schema.disputeEvidence).values([
        {
          disputeId: dispute.id,
          title: "Contract Document",
          description: "Original signed contract",
          fileUrl: "https://example.com/contract.pdf",
          submittedBy: johnId,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date()
        },
        {
          disputeId: dispute.id,
          title: "Chat Screenshot",
          description: "Screenshot of conversation discussing scope",
          fileUrl: "https://example.com/screenshot.jpg",
          submittedBy: janeId,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          updatedAt: new Date()
        }
      ]);
      
      // Add some messages
      await db.insert(schema.messages).values([
        {
          content: "Hi Jane, I've sent the payment for the MacBook Pro.",
          senderId: johnId,
          receiverId: janeId,
          transactionId: transaction.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date()
        },
        {
          content: "Thanks John! I'll ship it tomorrow with tracking.",
          senderId: janeId,
          receiverId: johnId,
          transactionId: transaction.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000), // 1 day ago + 1 hour
          updatedAt: new Date()
        },
        {
          content: "Can you please share the design mockups for review?",
          senderId: janeId,
          receiverId: johnId,
          transactionId: transaction2.id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date()
        },
        {
          content: "Sure, I've uploaded them to the shared folder. Please check and provide feedback.",
          senderId: johnId,
          receiverId: janeId,
          transactionId: transaction2.id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 7200000), // 5 days ago + 2 hours
          updatedAt: new Date()
        }
      ]);
      
      console.log("Transactions and related data created successfully.");
    } else {
      console.log("Transactions already exist, skipping creation.");
    }

    // Always update content pages
    console.log("Creating/updating content pages...");
      
    // Features page
    await db.insert(schema.contentPages).values({
      slug: "escrow-features",
      title: "Escrow Features",
      content: `
# Middlesman Escrow Platform Features

Our escrow service provides secure transaction management for both buyers and sellers.

## Key Features

### Secure Payments
All payments are held securely until all parties are satisfied with the transaction.

### Milestone Payments
Break down large projects into manageable milestones with separate payment releases.

### Dispute Resolution
Our fair and transparent dispute resolution process protects both buyers and sellers.

### Transaction Dashboard
Track all your transactions in real-time from a single dashboard.

### APIs for Integration
Easily integrate our escrow service into your marketplace or platform.
      `,
      category: "product",
      subcategory: "features",
      isPublished: true,
      metaTitle: "Escrow Features | Middlesman",
      metaDescription: "Explore the secure escrow features of Middlesman's escrow platform including milestone payments, dispute resolution, and more.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Escrow Features",
        content: `
# Middlesman Escrow Platform Features

Our escrow service provides secure transaction management for both buyers and sellers.

## Key Features

### Secure Payments
All payments are held securely until all parties are satisfied with the transaction.

### Milestone Payments
Break down large projects into manageable milestones with separate payment releases.

### Dispute Resolution
Our fair and transparent dispute resolution process protects both buyers and sellers.

### Transaction Dashboard
Track all your transactions in real-time from a single dashboard.

### APIs for Integration
Easily integrate our escrow service into your marketplace or platform.
        `,
        category: "product",
        subcategory: "features",
        isPublished: true,
        metaTitle: "Escrow Features | Middlesman",
        metaDescription: "Explore the secure escrow features of Middlesman's escrow platform including milestone payments, dispute resolution, and more.",
        updatedAt: new Date()
      }
    });
    
    // Pricing page
    await db.insert(schema.contentPages).values({
      slug: "pricing",
      title: "Pricing",
      content: `
# Middlesman Pricing

We offer transparent pricing with no hidden fees.

## Transaction Fees

| Transaction Size | Fee Percentage |
| ---------------- | -------------- |
| Up to ₹10,000    | 3.5%           |
| ₹10,001 - ₹50,000 | 3.0%          |
| ₹50,001 - ₹100,000 | 2.5%         |
| Above ₹100,000   | 2.0%           |

## Enterprise Plans

For high-volume users, we offer custom enterprise plans with reduced rates.
Contact our sales team to learn more.

## Payment Methods

We support multiple payment methods including:
- UPI
- Net Banking
- Credit/Debit Cards
- Razorpay
- Cryptocurrency (coming soon)
      `,
      category: "product",
      subcategory: "pricing",
      isPublished: true,
      metaTitle: "Pricing | Middlesman",
      metaDescription: "Transparent pricing for Middlesman's escrow services. View our fee structure and payment options.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Pricing",
        content: `
# Middlesman Pricing

We offer transparent pricing with no hidden fees.

## Transaction Fees

| Transaction Size | Fee Percentage |
| ---------------- | -------------- |
| Up to ₹10,000    | 3.5%           |
| ₹10,001 - ₹50,000 | 3.0%          |
| ₹50,001 - ₹100,000 | 2.5%         |
| Above ₹100,000   | 2.0%           |

## Enterprise Plans

For high-volume users, we offer custom enterprise plans with reduced rates.
Contact our sales team to learn more.

## Payment Methods

We support multiple payment methods including:
- UPI
- Net Banking
- Credit/Debit Cards
- Razorpay
- Cryptocurrency (coming soon)
        `,
        category: "product",
        subcategory: "pricing",
        isPublished: true,
        metaTitle: "Pricing | Middlesman",
        metaDescription: "Transparent pricing for Middlesman's escrow services. View our fee structure and payment options.",
        updatedAt: new Date()
      }
    });
    
    // Integrations page
    await db.insert(schema.contentPages).values({
      slug: "marketplace-integrations",
      title: "Marketplace Integrations",
      content: `
# Integrate with Your Marketplace

Our RESTful API makes it easy to integrate Middlesman escrow services with your marketplace or platform.

## Available Integrations

- WordPress Plugin
- Custom API Integration
- WooCommerce Extension
- Shopify App
- Mobile SDKs (iOS & Android)

## API Documentation

Our comprehensive API documentation provides everything you need to get started:

- Authentication
- Transaction Management
- Webhook Events
- Error Handling
- Sample Code

## Support

Our integration team is available to help with custom integrations and answer any questions.
      `,
      category: "product",
      subcategory: "integrations",
      isPublished: true,
      metaTitle: "Marketplace Integrations | Middlesman",
      metaDescription: "Integrate Middlesman's secure escrow services with your marketplace or platform using our APIs and plugins.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Marketplace Integrations",
        content: `
# Integrate with Your Marketplace

Our RESTful API makes it easy to integrate Middlesman escrow services with your marketplace or platform.

## Available Integrations

- WordPress Plugin
- Custom API Integration
- WooCommerce Extension
- Shopify App
- Mobile SDKs (iOS & Android)

## API Documentation

Our comprehensive API documentation provides everything you need to get started:

- Authentication
- Transaction Management
- Webhook Events
- Error Handling
- Sample Code

## Support

Our integration team is available to help with custom integrations and answer any questions.
        `,
        category: "product",
        subcategory: "integrations",
        isPublished: true,
        metaTitle: "Marketplace Integrations | Middlesman",
        metaDescription: "Integrate Middlesman's secure escrow services with your marketplace or platform using our APIs and plugins.",
        updatedAt: new Date()
      }
    });
    
    // Enterprise page
    await db.insert(schema.contentPages).values({
      slug: "enterprise-solutions",
      title: "Enterprise Solutions",
      content: `
# Enterprise Solutions

Middlesman offers customized escrow solutions for enterprise customers with high transaction volumes.

## Enterprise Features

- Dedicated Account Manager
- Custom Workflow Development
- Lower Transaction Fees
- Priority Support
- Advanced Reporting
- White-labeled Solutions
- Custom API Development
- Service Level Agreements (SLAs)

## Industries We Serve

- Real Estate
- IT Services
- Freelance Marketplaces
- Import/Export Businesses
- Vehicle Marketplaces
- Equipment Sales
- Mergers & Acquisitions

Contact our enterprise sales team to discuss your specific requirements.
      `,
      category: "product",
      subcategory: "enterprise",
      isPublished: true,
      metaTitle: "Enterprise Solutions | Middlesman",
      metaDescription: "Customized escrow solutions for enterprise customers with high transaction volumes and unique requirements.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Enterprise Solutions",
        content: `
# Enterprise Solutions

Middlesman offers customized escrow solutions for enterprise customers with high transaction volumes.

## Enterprise Features

- Dedicated Account Manager
- Custom Workflow Development
- Lower Transaction Fees
- Priority Support
- Advanced Reporting
- White-labeled Solutions
- Custom API Development
- Service Level Agreements (SLAs)

## Industries We Serve

- Real Estate
- IT Services
- Freelance Marketplaces
- Import/Export Businesses
- Vehicle Marketplaces
- Equipment Sales
- Mergers & Acquisitions

Contact our enterprise sales team to discuss your specific requirements.
        `,
        category: "product",
        subcategory: "enterprise",
        isPublished: true,
        metaTitle: "Enterprise Solutions | Middlesman",
        metaDescription: "Customized escrow solutions for enterprise customers with high transaction volumes and unique requirements.",
        updatedAt: new Date()
      }
    });
    
    // Security page
    await db.insert(schema.contentPages).values({
      slug: "security-practices",
      title: "Security Practices",
      content: `
# Our Security Practices

At Middlesman, security is our top priority. We employ industry-leading security measures to protect your transactions and data.

## Security Measures

- End-to-end Encryption
- Multi-factor Authentication
- Regular Security Audits
- HTTPS/TLS Encryption
- Compliance with PCI DSS
- Distributed Denial of Service (DDoS) Protection
- Regular Penetration Testing
- Secure Data Centers

## Data Protection

We take your privacy seriously and only collect information necessary to provide our services.

## Regulatory Compliance

Middlesman complies with all relevant financial regulations and maintains appropriate licenses.

## Reporting Security Issues

If you discover a security vulnerability, please contact our security team immediately at security@middlesman.com.
      `,
      category: "product",
      subcategory: "security",
      isPublished: true,
      metaTitle: "Security Practices | Middlesman",
      metaDescription: "Learn about Middlesman's industry-leading security practices that protect your transactions and data.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Security Practices",
        content: `
# Our Security Practices

At Middlesman, security is our top priority. We employ industry-leading security measures to protect your transactions and data.

## Security Measures

- End-to-end Encryption
- Multi-factor Authentication
- Regular Security Audits
- HTTPS/TLS Encryption
- Compliance with PCI DSS
- Distributed Denial of Service (DDoS) Protection
- Regular Penetration Testing
- Secure Data Centers

## Data Protection

We take your privacy seriously and only collect information necessary to provide our services.

## Regulatory Compliance

Middlesman complies with all relevant financial regulations and maintains appropriate licenses.

## Reporting Security Issues

If you discover a security vulnerability, please contact our security team immediately at security@middlesman.com.
        `,
        category: "product",
        subcategory: "security",
        isPublished: true,
        metaTitle: "Security Practices | Middlesman",
        metaDescription: "Learn about Middlesman's industry-leading security practices that protect your transactions and data.",
        updatedAt: new Date()
      }
    });
    
    // About page
    await db.insert(schema.contentPages).values({
      slug: "about-us",
      title: "About Middlesman",
      content: `
# About Middlesman

Middlesman was founded in 2023 with a mission to make online transactions safer and more secure for everyone.

## Our Mission

To provide the most trusted escrow service that enables confident transactions between parties who don't know each other.

## Our Story

Middlesman was born out of frustration with the risks of online transactions. Our founders experienced firsthand the challenges of buying and selling high-value items online and decided to create a solution.

## Our Team

Our team brings together expertise in fintech, security, and customer experience to build the best escrow service possible.

## Our Values

- Trust
- Transparency
- Security
- Innovation
- Customer Focus

## Contact Us

We'd love to hear from you! Contact us at info@middlesman.com.
      `,
      category: "company",
      subcategory: "about",
      isPublished: true,
      metaTitle: "About Middlesman | Our Story",
      metaDescription: "Learn about Middlesman's mission, story, team, and values in making online transactions safer for everyone.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "About Us",
        content: `
# About Middlesman

Middlesman was founded in 2023 with a mission to make online transactions safer and more secure for everyone.

## Our Mission

To provide the most trusted escrow service that enables confident transactions between parties who don't know each other.

## Our Story

Middlesman was born out of the personal experiences of our founders, who faced challenges when buying and selling high-value items online. After a particularly problematic transaction involving a vintage motorcycle sale that went wrong, they realized there was a need for a reliable escrow service in India that could protect both buyers and sellers.

Starting with a simple concept, they built the first version of Middlesman to serve the Indian market's unique needs. The platform quickly gained traction as users recognized the value of having a trusted third party hold funds during transactions.

## Our Team

Middlesman is led by a diverse team of experts in fintech, security, customer experience, and marketplace dynamics:

- **Vikram Mehta, CEO & Co-founder** - 15 years of experience in fintech and e-commerce
- **Ananya Sharma, CTO & Co-founder** - Former security architect at leading payment companies
- **Dhruv Kapoor, COO** - Expert in operations and customer experience
- **Priyanka Reddy, Head of Legal** - Specialized in financial regulations and compliance
- **Raj Patel, Head of Partnerships** - Building our integration ecosystem

## Our Values

- **Trust** - The foundation of everything we do
- **Transparency** - Clear communication and no hidden fees or terms
- **Security** - Industry-leading protection for all transactions
- **Innovation** - Continuously improving our service
- **Customer Focus** - Building solutions that address real user needs

## Investors & Partners

Middlesman is backed by leading investors in the fintech space and has partnered with major marketplace platforms to provide integrated escrow services.

## Contact Us

We'd love to hear from you! Contact us at:

Email: info@middlesman.com
Phone: +91 (022) 4567-8901
Address: Koramangala, Bangalore - 560034, India
        `,
        category: "company",
        subcategory: "about-us",
        isPublished: true,
        metaTitle: "About Us | Middlesman",
        metaDescription: "Learn about Middlesman's mission, story, team, and values in making online transactions safer for everyone.",
        updatedAt: new Date()
      }
    });
    
    // Contact Us
    await db.insert(schema.contentPages).values({
      slug: "contact-us",
      title: "Contact Us",
      content: `
# Contact Middlesman

We're here to help with any questions or concerns you may have about our escrow services.

## Customer Support

**Email:** support@middlesman.com
**Phone:** +91 (022) 4567-8900
**Hours:** Monday-Friday, 9:00 AM - 6:00 PM IST

## Sales Inquiries

Interested in our enterprise solutions or have questions about integrating with your marketplace?

**Email:** sales@middlesman.com
**Phone:** +91 (022) 4567-8902

## Media Inquiries

For press and media inquiries, please contact:

**Email:** media@middlesman.com

## Office Locations

### Headquarters - Bangalore
123 Tech Park
Koramangala
Bangalore - 560034
India

### Mumbai Office
456 Financial District
Lower Parel
Mumbai - 400013
India

### Delhi Office (Coming Soon)
Our Delhi office will be opening in June 2025.

## Send Us a Message

Use the form below to send us a message, and we'll get back to you as soon as possible.

- Name
- Email
- Phone
- Subject
- Message

## Connect With Us

Follow us on social media for the latest updates:

- Twitter: @MiddlesmanEscrow
- LinkedIn: Middlesman Secure Escrow
- Facebook: MiddlesmanEscrow
- Instagram: @middlesman_escrow
      `,
      category: "company",
      subcategory: "contact-us",
      isPublished: true,
      metaTitle: "Contact Us | Middlesman",
      metaDescription: "Get in touch with the Middlesman team for support, sales inquiries, or any other questions about our escrow services.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Contact Us",
        content: `
# Contact Middlesman

We're here to help with any questions or concerns you may have about our escrow services.

## Customer Support

**Email:** support@middlesman.com
**Phone:** +91 (022) 4567-8900
**Hours:** Monday-Friday, 9:00 AM - 6:00 PM IST

## Sales Inquiries

Interested in our enterprise solutions or have questions about integrating with your marketplace?

**Email:** sales@middlesman.com
**Phone:** +91 (022) 4567-8902

## Media Inquiries

For press and media inquiries, please contact:

**Email:** media@middlesman.com

## Office Locations

### Headquarters - Bangalore
123 Tech Park
Koramangala
Bangalore - 560034
India

### Mumbai Office
456 Financial District
Lower Parel
Mumbai - 400013
India

### Delhi Office (Coming Soon)
Our Delhi office will be opening in June 2025.

## Send Us a Message

Use the form below to send us a message, and we'll get back to you as soon as possible.

- Name
- Email
- Phone
- Subject
- Message

## Connect With Us

Follow us on social media for the latest updates:

- Twitter: @MiddlesmanEscrow
- LinkedIn: Middlesman Secure Escrow
- Facebook: MiddlesmanEscrow
- Instagram: @middlesman_escrow
        `,
        category: "company",
        subcategory: "contact-us",
        isPublished: true,
        metaTitle: "Contact Us | Middlesman",
        metaDescription: "Get in touch with the Middlesman team for support, sales inquiries, or any other questions about our escrow services.",
        updatedAt: new Date()
      }
    });

    // Legal pages - Terms of Service
    await db.insert(schema.contentPages).values({
      slug: "terms-of-service",
      title: "Terms of Service",
      content: `
# Terms of Service

These Terms of Service ("Terms") govern your use of the Middlesman escrow service. By using our service, you agree to these Terms.

## 1. Service Description

Middlesman provides escrow services for online transactions between buyers and sellers. We hold funds until both parties are satisfied with the transaction.

## 2. User Accounts

You must create an account to use our service. You are responsible for maintaining the confidentiality of your account information.

## 3. Fees

We charge fees for our escrow services as described in our Pricing page. Fees are non-refundable.

## 4. Transaction Process

The basic process is as follows:
1. Buyer and seller agree to terms
2. Buyer sends funds to Middlesman
3. Seller delivers goods or services
4. Buyer approves the delivery
5. Middlesman releases funds to seller

## 5. Disputes

If a dispute arises, we will investigate and make a determination based on evidence provided by both parties.

## 6. Prohibited Activities

You may not use our service for illegal activities, fraud, or any purpose that violates these Terms.

## 7. Limitation of Liability

Middlesman is not liable for disputes between users, except as specifically provided in these Terms.

## 8. Modification of Terms

We may modify these Terms at any time. Continued use of our service after changes constitutes acceptance of the modified Terms.

## 9. Governing Law

These Terms are governed by the laws of India.
      `,
      category: "company",
      subcategory: "legal",
      isPublished: true,
      metaTitle: "Terms of Service | Middlesman",
      metaDescription: "Middlesman's Terms of Service governing the use of our escrow services.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Terms of Service",
        content: `
# Terms of Service

These Terms of Service ("Terms") govern your use of the Middlesman escrow service. By using our service, you agree to these Terms.

## 1. Service Description

Middlesman provides escrow services for online transactions between buyers and sellers. We hold funds until both parties are satisfied with the transaction.

## 2. User Accounts

You must create an account to use our service. You are responsible for maintaining the confidentiality of your account information.

## 3. Fees

We charge fees for our escrow services as described in our Pricing page. Fees are non-refundable.

## 4. Transaction Process

The basic process is as follows:
1. Buyer and seller agree to terms
2. Buyer sends funds to Middlesman
3. Seller delivers goods or services
4. Buyer approves the delivery
5. Middlesman releases funds to seller

## 5. Disputes

If a dispute arises, we will investigate and make a determination based on evidence provided by both parties.

## 6. Prohibited Activities

You may not use our service for illegal activities, fraud, or any purpose that violates these Terms.

## 7. Limitation of Liability

Middlesman is not liable for disputes between users, except as specifically provided in these Terms.

## 8. Modification of Terms

We may modify these Terms at any time. Continued use of our service after changes constitutes acceptance of the modified Terms.

## 9. Governing Law

These Terms are governed by the laws of India.
        `,
        category: "company",
        subcategory: "legal",
        isPublished: true,
        metaTitle: "Terms of Service | Middlesman",
        metaDescription: "Middlesman's Terms of Service governing the use of our escrow services.",
        updatedAt: new Date()
      }
    });
    
    // Legal pages - Privacy Policy
    await db.insert(schema.contentPages).values({
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: `
# Privacy Policy

This Privacy Policy describes how Middlesman collects, uses, and discloses your information.

## Information We Collect

- Account Information: Name, email, phone number
- Transaction Information: Details about escrow transactions
- Payment Information: Payment method details
- Communication: Messages sent through our platform
- Usage Information: How you interact with our service

## How We Use Your Information

- To provide and improve our services
- To process transactions
- To communicate with you
- To prevent fraud and abuse
- To comply with legal obligations

## Information Sharing

We may share your information with:
- Transaction counterparties
- Service providers
- Legal authorities when required by law

## Data Security

We implement reasonable security measures to protect your information.

## Your Rights

Depending on your location, you may have rights regarding your personal information, including:
- Access to your data
- Correction of inaccurate data
- Deletion of your data
- Objection to certain processing

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@middlesman.com.
      `,
      category: "company",
      subcategory: "legal",
      isPublished: true,
      metaTitle: "Privacy Policy | Middlesman",
      metaDescription: "Learn how Middlesman collects, uses, and protects your personal information.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Privacy Policy",
        content: `
# Privacy Policy

This Privacy Policy describes how Middlesman collects, uses, and discloses your information.

## Information We Collect

- Account Information: Name, email, phone number
- Transaction Information: Details about escrow transactions
- Payment Information: Payment method details
- Communication: Messages sent through our platform
- Usage Information: How you interact with our service

## How We Use Your Information

- To provide and improve our services
- To process transactions
- To communicate with you
- To prevent fraud and abuse
- To comply with legal obligations

## Information Sharing

We may share your information with:
- Transaction counterparties
- Service providers
- Legal authorities when required by law

## Data Security

We implement reasonable security measures to protect your information.

## Your Rights

Depending on your location, you may have rights regarding your personal information, including:
- Access to your data
- Correction of inaccurate data
- Deletion of your data
- Objection to certain processing

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@middlesman.com.
        `,
        category: "company",
        subcategory: "legal",
        isPublished: true,
        metaTitle: "Privacy Policy | Middlesman",
        metaDescription: "Learn how Middlesman collects, uses, and protects your personal information.",
        updatedAt: new Date()
      }
    });

    // Resources - Documentation
    await db.insert(schema.contentPages).values({
      slug: "documentation",
      title: "Documentation",
      content: `
# API Documentation

Comprehensive documentation for the Middlesman API to help you integrate escrow services into your platform.

## Getting Started

Follow these steps to quickly integrate with our API:

1. Create a developer account
2. Generate API keys
3. Choose the right endpoints for your needs
4. Implement the client-side integration

## Authentication

All API requests require authentication using OAuth 2.0. 

\`\`\`javascript
// Example authentication code
const getAccessToken = async () => {
  const response = await fetch('https://api.middlesman.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      grant_type: 'client_credentials'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
\`\`\`

## API Endpoints

Our API includes endpoints for:

- Transaction Management
- User Management
- Dispute Resolution
- Webhook Events
- Payment Processing

## Response Formats

All API responses are in JSON format and include appropriate HTTP status codes.

## Error Handling

Our API uses conventional HTTP response codes to indicate success or failure.
      `,
      category: "resources",
      subcategory: "documentation",
      isPublished: true,
      metaTitle: "API Documentation | Middlesman",
      metaDescription: "Comprehensive documentation for integrating with the Middlesman escrow API. Learn how to implement secure transactions in your platform.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Documentation",
        content: `
# API Documentation

Comprehensive documentation for the Middlesman API to help you integrate escrow services into your platform.

## Getting Started

Follow these steps to quickly integrate with our API:

1. Create a developer account
2. Generate API keys
3. Choose the right endpoints for your needs
4. Implement the client-side integration

## Authentication

All API requests require authentication using OAuth 2.0. 

\`\`\`javascript
// Example authentication code
const getAccessToken = async () => {
  const response = await fetch('https://api.middlesman.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      grant_type: 'client_credentials'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
\`\`\`

## API Endpoints

Our API includes endpoints for:

- Transaction Management
- User Management
- Dispute Resolution
- Webhook Events
- Payment Processing

## Response Formats

All API responses are in JSON format and include appropriate HTTP status codes.

## Error Handling

Our API uses conventional HTTP response codes to indicate success or failure.
        `,
        category: "resources",
        subcategory: "documentation",
        isPublished: true,
        metaTitle: "API Documentation | Middlesman",
        metaDescription: "Comprehensive documentation for integrating with the Middlesman escrow API. Learn how to implement secure transactions in your platform.",
        updatedAt: new Date()
      }
    });

    // Resources - Guides
    await db.insert(schema.contentPages).values({
      slug: "integration-guides",
      title: "Integration Guides",
      content: `
# Integration Guides

Step-by-step guides to help you implement Middlesman escrow services into your platform.

## Basic Integration Guide

### Step 1: Register Your Application
Create a developer account and register your application to get API credentials.

### Step 2: Implement Authentication
Set up OAuth 2.0 authentication using your client ID and secret.

### Step 3: Create Your First Transaction
Learn how to create, manage, and complete transactions.

\`\`\`javascript
// Example code for creating a transaction
async function createTransaction(amount, buyerId, sellerId) {
  const accessToken = await getAccessToken();
  
  const response = await fetch('https://api.middlesman.com/transactions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'INR',
      buyer_id: buyerId,
      seller_id: sellerId,
      description: 'Sample transaction'
    })
  });
  
  return await response.json();
}
\`\`\`

### Step 4: Implement Webhooks
Set up webhook endpoints to receive real-time notifications about transaction status changes.

## Advanced Integration Topics

- Handling Disputes
- Implementing Milestone Payments
- Custom Payment Flows
- Mobile SDK Integration
- White-labeling Options

## Platform-Specific Guides

- WordPress Integration
- WooCommerce Plugin Setup
- Shopify App Configuration
- Custom Website Integration
      `,
      category: "resources",
      subcategory: "guides",
      isPublished: true,
      metaTitle: "Integration Guides | Middlesman",
      metaDescription: "Step-by-step guides for implementing Middlesman escrow services into your platform or marketplace.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Integration Guides",
        content: `
# Integration Guides

Step-by-step guides to help you implement Middlesman escrow services into your platform.

## Basic Integration Guide

### Step 1: Register Your Application
Create a developer account and register your application to get API credentials.

### Step 2: Implement Authentication
Set up OAuth 2.0 authentication using your client ID and secret.

### Step 3: Create Your First Transaction
Learn how to create, manage, and complete transactions.

\`\`\`javascript
// Example code for creating a transaction
async function createTransaction(amount, buyerId, sellerId) {
  const accessToken = await getAccessToken();
  
  const response = await fetch('https://api.middlesman.com/transactions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'INR',
      buyer_id: buyerId,
      seller_id: sellerId,
      description: 'Sample transaction'
    })
  });
  
  return await response.json();
}
\`\`\`

### Step 4: Implement Webhooks
Set up webhook endpoints to receive real-time notifications about transaction status changes.

## Advanced Integration Topics

- Handling Disputes
- Implementing Milestone Payments
- Custom Payment Flows
- Mobile SDK Integration
- White-labeling Options

## Platform-Specific Guides

- WordPress Integration
- WooCommerce Plugin Setup
- Shopify App Configuration
- Custom Website Integration
        `,
        category: "resources",
        subcategory: "guides",
        isPublished: true,
        metaTitle: "Integration Guides | Middlesman",
        metaDescription: "Step-by-step guides for implementing Middlesman escrow services into your platform or marketplace.",
        updatedAt: new Date()
      }
    });

    // Resources - API Reference
    await db.insert(schema.contentPages).values({
      slug: "api-reference",
      title: "API Reference",
      content: `
# API Reference

Complete reference documentation for all Middlesman API endpoints.

## Transactions API

### Create Transaction

\`\`\`
POST /api/v1/transactions
\`\`\`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| amount | number | Transaction amount |
| currency | string | Currency code (INR, USD, etc.) |
| buyer_id | string | Unique identifier for the buyer |
| seller_id | string | Unique identifier for the seller |
| description | string | Description of the transaction |
| due_date | string | ISO date for transaction completion |

**Response:**

\`\`\`json
{
  "id": "txn_123456789",
  "status": "pending",
  "amount": 5000,
  "currency": "INR",
  "buyer_id": "usr_buyer123",
  "seller_id": "usr_seller456",
  "created_at": "2025-05-01T12:00:00Z",
  "updated_at": "2025-05-01T12:00:00Z"
}
\`\`\`

### Get Transaction

\`\`\`
GET /api/v1/transactions/:id
\`\`\`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Transaction ID |

### Update Transaction

\`\`\`
PATCH /api/v1/transactions/:id
\`\`\`

## Users API

### Create User

\`\`\`
POST /api/v1/users
\`\`\`

### Get User

\`\`\`
GET /api/v1/users/:id
\`\`\`

## Disputes API

### Create Dispute

\`\`\`
POST /api/v1/disputes
\`\`\`

### Get Dispute

\`\`\`
GET /api/v1/disputes/:id
\`\`\`

## Webhooks API

### Register Webhook

\`\`\`
POST /api/v1/webhooks
\`\`\`

### List Webhooks

\`\`\`
GET /api/v1/webhooks
\`\`\`
      `,
      category: "resources",
      subcategory: "api-reference",
      isPublished: true,
      metaTitle: "API Reference | Middlesman",
      metaDescription: "Complete reference documentation for all Middlesman API endpoints, parameters, and responses.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "API Reference",
        content: `
# API Reference

Complete reference documentation for all Middlesman API endpoints.

## Transactions API

### Create Transaction

\`\`\`
POST /api/v1/transactions
\`\`\`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| amount | number | Transaction amount |
| currency | string | Currency code (INR, USD, etc.) |
| buyer_id | string | Unique identifier for the buyer |
| seller_id | string | Unique identifier for the seller |
| description | string | Description of the transaction |
| due_date | string | ISO date for transaction completion |

**Response:**

\`\`\`json
{
  "id": "txn_123456789",
  "status": "pending",
  "amount": 5000,
  "currency": "INR",
  "buyer_id": "usr_buyer123",
  "seller_id": "usr_seller456",
  "created_at": "2025-05-01T12:00:00Z",
  "updated_at": "2025-05-01T12:00:00Z"
}
\`\`\`

### Get Transaction

\`\`\`
GET /api/v1/transactions/:id
\`\`\`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Transaction ID |

### Update Transaction

\`\`\`
PATCH /api/v1/transactions/:id
\`\`\`

## Users API

### Create User

\`\`\`
POST /api/v1/users
\`\`\`

### Get User

\`\`\`
GET /api/v1/users/:id
\`\`\`

## Disputes API

### Create Dispute

\`\`\`
POST /api/v1/disputes
\`\`\`

### Get Dispute

\`\`\`
GET /api/v1/disputes/:id
\`\`\`

## Webhooks API

### Register Webhook

\`\`\`
POST /api/v1/webhooks
\`\`\`

### List Webhooks

\`\`\`
GET /api/v1/webhooks
\`\`\`
        `,
        category: "resources",
        subcategory: "api-reference",
        isPublished: true,
        metaTitle: "API Reference | Middlesman",
        metaDescription: "Complete reference documentation for all Middlesman API endpoints, parameters, and responses.",
        updatedAt: new Date()
      }
    });

    // Resources - Blog
    await db.insert(schema.contentPages).values({
      slug: "blog",
      title: "Blog",
      content: `
# Middlesman Blog

Latest news, updates, and insights from the Middlesman team.

## Recent Articles

### How Escrow Services Revolutionize E-commerce Trust
*May 1, 2025*

E-commerce has grown exponentially in recent years, but trust remains a significant barrier for many transactions. Escrow services bridge this gap by providing a secure way for buyers and sellers to complete transactions with confidence.

In this article, we'll explore how escrow services like Middlesman are revolutionizing trust in e-commerce platforms, especially for high-value transactions and services.

### Implementing Secure Payment Flows in Your Marketplace
*April 15, 2025*

Creating a marketplace platform requires careful consideration of payment flows to ensure both buyers and sellers are protected. This article provides best practices for implementing secure payment processing.

Key points include:
- The importance of holding funds in escrow
- Milestone-based payments for services
- Dispute resolution processes
- Compliance requirements

### The Future of Digital Escrow: Blockchain and Beyond
*April 1, 2025*

The escrow industry is evolving rapidly with new technologies. Blockchain technology offers promising advancements in transparency, security, and automation for escrow services.

This article examines how blockchain smart contracts could revolutionize the escrow process, reducing costs and increasing efficiency while maintaining the essential trust element of traditional escrow services.

## Industry Insights

### Protecting Digital Service Purchases with Escrow
*March 15, 2025*

Digital services present unique challenges for buyers and sellers. Unlike physical products, services can be subjective and difficult to evaluate before payment.

This article explains how escrow services provide protection for both parties in digital service transactions, from web development to digital marketing services.

### Case Study: How CarTradeIndia Increased Transaction Volume by 45%
*March 1, 2025*

When CarTradeIndia integrated Middlesman's escrow service, they saw dramatic improvements in customer confidence and transaction completions.

This case study details how the implementation worked, challenges overcome, and the measurable results achieved in their online vehicle marketplace.
      `,
      category: "resources",
      subcategory: "blog",
      isPublished: true,
      metaTitle: "Blog | Middlesman",
      metaDescription: "Latest news, updates, and insights about secure transactions, escrow services, and e-commerce trust.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Blog",
        content: `
# Middlesman Blog

Latest news, updates, and insights from the Middlesman team.

## Recent Articles

### How Escrow Services Revolutionize E-commerce Trust
*May 1, 2025*

E-commerce has grown exponentially in recent years, but trust remains a significant barrier for many transactions. Escrow services bridge this gap by providing a secure way for buyers and sellers to complete transactions with confidence.

In this article, we'll explore how escrow services like Middlesman are revolutionizing trust in e-commerce platforms, especially for high-value transactions and services.

### Implementing Secure Payment Flows in Your Marketplace
*April 15, 2025*

Creating a marketplace platform requires careful consideration of payment flows to ensure both buyers and sellers are protected. This article provides best practices for implementing secure payment processing.

Key points include:
- The importance of holding funds in escrow
- Milestone-based payments for services
- Dispute resolution processes
- Compliance requirements

### The Future of Digital Escrow: Blockchain and Beyond
*April 1, 2025*

The escrow industry is evolving rapidly with new technologies. Blockchain technology offers promising advancements in transparency, security, and automation for escrow services.

This article examines how blockchain smart contracts could revolutionize the escrow process, reducing costs and increasing efficiency while maintaining the essential trust element of traditional escrow services.

## Industry Insights

### Protecting Digital Service Purchases with Escrow
*March 15, 2025*

Digital services present unique challenges for buyers and sellers. Unlike physical products, services can be subjective and difficult to evaluate before payment.

This article explains how escrow services provide protection for both parties in digital service transactions, from web development to digital marketing services.

### Case Study: How CarTradeIndia Increased Transaction Volume by 45%
*March 1, 2025*

When CarTradeIndia integrated Middlesman's escrow service, they saw dramatic improvements in customer confidence and transaction completions.

This case study details how the implementation worked, challenges overcome, and the measurable results achieved in their online vehicle marketplace.
        `,
        category: "resources",
        subcategory: "blog",
        isPublished: true,
        metaTitle: "Blog | Middlesman",
        metaDescription: "Latest news, updates, and insights about secure transactions, escrow services, and e-commerce trust.",
        updatedAt: new Date()
      }
    });

    // Resources - Community
    await db.insert(schema.contentPages).values({
      slug: "community",
      title: "Community",
      content: `
# Middlesman Community

Join our growing community of developers, marketplace owners, and users who are passionate about secure transactions.

## Developer Forum

Our developer forum is the perfect place to ask questions, share your integration experiences, and get help from both our team and other developers.

[Visit the Developer Forum →](https://community.middlesman.com/developers)

## Feature Requests

Have ideas for improving Middlesman? We'd love to hear them! Submit and vote on feature requests to help shape our product roadmap.

[Submit a Feature Request →](https://community.middlesman.com/requests)

## Integration Showcase

See how other businesses have implemented Middlesman in their platforms:

- **SecondHandElectronics.in** - Used escrow for high-value electronics sales
- **FreelanceDevs.co** - Implemented milestone payments for development projects
- **ArtisanMarket.com** - Created custom API integration for handmade goods marketplace
- **PropertyEscrow.in** - Specialized implementation for real estate transactions

## Recent Discussions

### Handling International Escrow Transactions
*Started by: Rajesh K. - 3 days ago*
Discussion about currency conversion, international regulations, and best practices.

### Best Practices for Dispute Resolution
*Started by: Priya M. - 1 week ago*
Community sharing experiences and tips for effective dispute resolution processes.

### Mobile SDK Implementation Tips
*Started by: Arjun T. - 2 weeks ago*
Developers discussing the best approaches for implementing the Middlesman SDK in mobile apps.

## Community Events

### Upcoming Webinars

- **May 15, 2025** - Advanced API Integration Techniques
- **June 1, 2025** - Escrow for Marketplace Platforms
- **June 20, 2025** - Security Best Practices for Payment Flows

### Developer Hackathon

Join our annual hackathon in July 2025 and build innovative solutions using the Middlesman API. Cash prizes and partnership opportunities available!
      `,
      category: "resources",
      subcategory: "community",
      isPublished: true,
      metaTitle: "Community | Middlesman",
      metaDescription: "Join the Middlesman community of developers, marketplace owners, and users. Access forums, resources, and events.",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.contentPages.slug,
      set: {
        title: "Community",
        content: `
# Middlesman Community

Join our growing community of developers, marketplace owners, and users who are passionate about secure transactions.

## Developer Forum

Our developer forum is the perfect place to ask questions, share your integration experiences, and get help from both our team and other developers.

[Visit the Developer Forum →](https://community.middlesman.com/developers)

## Feature Requests

Have ideas for improving Middlesman? We'd love to hear them! Submit and vote on feature requests to help shape our product roadmap.

[Submit a Feature Request →](https://community.middlesman.com/requests)

## Integration Showcase

See how other businesses have implemented Middlesman in their platforms:

- **SecondHandElectronics.in** - Used escrow for high-value electronics sales
- **FreelanceDevs.co** - Implemented milestone payments for development projects
- **ArtisanMarket.com** - Created custom API integration for handmade goods marketplace
- **PropertyEscrow.in** - Specialized implementation for real estate transactions

## Recent Discussions

### Handling International Escrow Transactions
*Started by: Rajesh K. - 3 days ago*
Discussion about currency conversion, international regulations, and best practices.

### Best Practices for Dispute Resolution
*Started by: Priya M. - 1 week ago*
Community sharing experiences and tips for effective dispute resolution processes.

### Mobile SDK Implementation Tips
*Started by: Arjun T. - 2 weeks ago*
Developers discussing the best approaches for implementing the Middlesman SDK in mobile apps.

## Community Events

### Upcoming Webinars

- **May 15, 2025** - Advanced API Integration Techniques
- **June 1, 2025** - Escrow for Marketplace Platforms
- **June 20, 2025** - Security Best Practices for Payment Flows

### Developer Hackathon

Join our annual hackathon in July 2025 and build innovative solutions using the Middlesman API. Cash prizes and partnership opportunities available!
        `,
        category: "resources",
        subcategory: "community",
        isPublished: true,
        metaTitle: "Community | Middlesman",
        metaDescription: "Join the Middlesman community of developers, marketplace owners, and users. Access forums, resources, and events.",
        updatedAt: new Date()
      }
    });

    // Create a sample API documentation
    console.log("Creating API documentation...");
    await db.insert(schema.apiDocs).values({
      slug: "create-transaction",
      title: "Create Transaction",
      version: "v1",
      endpoint: "/api/marketplace/transactions",
      method: "POST",
      description: "Creates a new escrow transaction between a buyer and seller.",
      requestParams: JSON.stringify({
        "Required headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_API_TOKEN"
        }
      }),
      requestBody: JSON.stringify({
        "type": "Required. Type of transaction (e.g., 'goods', 'services')",
        "title": "Required. Title of the transaction",
        "description": "Required. Description of the transaction",
        "amount": "Required. Total amount of the transaction",
        "currency": "Required. Currency code (e.g., 'INR', 'USD')",
        "buyer_id": "Required. ID of the buyer",
        "seller_id": "Required. ID of the seller",
        "due_date": "Optional. Due date for the transaction (ISO format)",
        "milestones": "Optional. Array of milestone objects"
      }),
      responseExample: JSON.stringify({
        "id": 123,
        "type": "goods",
        "title": "Purchase of laptop",
        "description": "Purchase of used MacBook Pro",
        "amount": 75000,
        "currency": "INR",
        "status": "pending",
        "escrow_status": "awaiting_payment",
        "payment_status": "unpaid",
        "buyer": {
          "id": 456,
          "username": "john_buyer"
        },
        "seller": {
          "id": 789,
          "username": "mary_seller"
        },
        "created_at": "2023-09-15T10:30:00Z",
        "updated_at": "2023-09-15T10:30:00Z"
      }),
      category: "Transactions",
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: schema.apiDocs.slug,
      set: {
        title: "Create Transaction",
        version: "v1",
        endpoint: "/api/marketplace/transactions",
        method: "POST",
        description: "Creates a new escrow transaction between a buyer and seller.",
        requestParams: JSON.stringify({
          "Required headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_API_TOKEN"
          }
        }),
        requestBody: JSON.stringify({
          "type": "Required. Type of transaction (e.g., 'goods', 'services')",
          "title": "Required. Title of the transaction",
          "description": "Required. Description of the transaction",
          "amount": "Required. Total amount of the transaction",
          "currency": "Required. Currency code (e.g., 'INR', 'USD')",
          "buyer_id": "Required. ID of the buyer",
          "seller_id": "Required. ID of the seller",
          "due_date": "Optional. Due date for the transaction (ISO format)",
          "milestones": "Optional. Array of milestone objects"
        }),
        responseExample: JSON.stringify({
          "id": 123,
          "type": "goods",
          "title": "Purchase of laptop",
          "description": "Purchase of used MacBook Pro",
          "amount": 75000,
          "currency": "INR",
          "status": "pending",
          "escrow_status": "awaiting_payment",
          "payment_status": "unpaid",
          "buyer": {
            "id": 456,
            "username": "john_buyer"
          },
          "seller": {
            "id": 789,
            "username": "mary_seller"
          },
          "created_at": "2023-09-15T10:30:00Z",
          "updated_at": "2023-09-15T10:30:00Z"
        }),
        category: "Transactions",
        isPublished: true,
        updatedAt: new Date()
      }
    });

    console.log("Content pages created/updated successfully.");
    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();