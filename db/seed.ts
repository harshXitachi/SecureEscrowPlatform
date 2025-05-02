import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

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
      
      // Create another user for testimonials
      const [sarah] = await db.insert(schema.users).values({
        username: "sarahjohnson",
        password: hashedPassword,
      }).returning({ id: schema.users.id });
      sarahId = sarah.id;

      console.log("Users created successfully.");
    } else {
      console.log("Users already exist, using existing users.");
      johnId = existingUsers[0].id;
      janeId = existingUsers.length > 1 ? existingUsers[1].id : existingUsers[0].id;
      sarahId = existingUsers.length > 2 ? existingUsers[2].id : existingUsers[0].id;
    }

    // Check if transactions already exist
    const existingTransactions = await db.query.transactions.findMany();
    
    if (existingTransactions.length === 0) {
      console.log("Creating sample transactions...");
      
      // Create sample transactions
      const [transaction1] = await db.insert(schema.transactions).values({
        title: "Website Development Project",
        description: "Design and development of a responsive website with modern features",
        type: "service",
        amount: "4500.00",
        currency: "USD",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "active",
        buyerId: johnId,
        sellerId: janeId,
      }).returning({ id: schema.transactions.id });
      
      const [transaction2] = await db.insert(schema.transactions).values({
        title: "Product Manufacturing",
        description: "Production of custom products according to specifications",
        type: "product",
        amount: "12750.00",
        currency: "USD",
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: "pending",
        buyerId: johnId,
        sellerId: janeId,
      }).returning({ id: schema.transactions.id });
      
      const [transaction3] = await db.insert(schema.transactions).values({
        title: "Marketing Consultation",
        description: "Strategic marketing consultation for product launch",
        type: "service",
        amount: "2300.00",
        currency: "USD",
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (completed)
        status: "completed",
        buyerId: johnId,
        sellerId: janeId,
      }).returning({ id: schema.transactions.id });

      // Create milestones for first transaction
      await db.insert(schema.milestones).values([
        {
          title: "UI/UX Design Completion",
          description: "Deliver wireframes and design mockups for all pages",
          amount: "1200.00",
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          status: "completed",
          transactionId: transaction1.id,
        },
        {
          title: "Frontend Development",
          description: "Implement responsive frontend with all interactive elements",
          amount: "1500.00",
          dueDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000), // today
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          status: "completed",
          transactionId: transaction1.id,
        },
        {
          title: "Backend Integration",
          description: "Connect frontend to API endpoints and implement data flow",
          amount: "1200.00",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          status: "active",
          transactionId: transaction1.id,
        },
        {
          title: "Launch & Training",
          description: "Website deployment and client training session",
          amount: "600.00",
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          status: "pending",
          transactionId: transaction1.id,
        },
      ]);

      // Create milestones for second transaction
      await db.insert(schema.milestones).values([
        {
          title: "Initial Prototype",
          description: "Create initial prototype for approval",
          amount: "3500.00",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          status: "pending",
          transactionId: transaction2.id,
        },
        {
          title: "First Production Batch",
          description: "Produce first batch of products",
          amount: "4000.00",
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
          status: "pending",
          transactionId: transaction2.id,
        },
        {
          title: "Quality Assurance",
          description: "Quality check and testing of products",
          amount: "2500.00",
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
          status: "pending",
          transactionId: transaction2.id,
        },
        {
          title: "Final Delivery",
          description: "Delivery of all products and documentation",
          amount: "2750.00",
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          status: "pending",
          transactionId: transaction2.id,
        },
      ]);

      // Create milestones for third transaction (all completed)
      await db.insert(schema.milestones).values([
        {
          title: "Market Analysis",
          description: "Comprehensive market analysis and competitor research",
          amount: "1000.00",
          dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          status: "completed",
          transactionId: transaction3.id,
        },
        {
          title: "Strategy Development",
          description: "Creation of marketing strategy and campaign plan",
          amount: "1300.00",
          dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          status: "completed",
          transactionId: transaction3.id,
        },
      ]);

      console.log("Sample transactions and milestones created successfully.");
    } else {
      console.log("Transactions already exist, skipping creation.");
    }

    // Check if content pages already exist
    const existingContentPages = await db.query.contentPages.findMany();
    
    if (existingContentPages.length === 0) {
      console.log("Creating content pages...");
      
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
      });
      
      console.log("Content pages created successfully.");
      
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
      });
    } else {
      console.log("Content pages already exist, skipping creation.");
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
