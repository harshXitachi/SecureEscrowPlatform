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

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
