import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

let pool: any;
let db: any;
// Declare mockUsers globally so it can be exported if needed
let mockUsers: any[] = [];

// For local development without a database
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using mock database for local development");
  
  // Start with an empty mockUsers array (no test or admin users)
  mockUsers = [];

  // Mock pool implementation
  pool = {
    query: async () => ({ rows: [] }),
    end: async () => {}
  };
  
  // Mock db implementation that mimics drizzle interface
  db = {
    query: {
      messages: {
        findMany: async () => [],
        findFirst: async () => null
      },
      users: {
        findMany: async () => mockUsers,
        findFirst: async (params?: any) => {
          try {
            if (!params || !params.where) {
              return null;
            }
            let usernameToFind = null;
            let idToFind = null;
            if (params.where.username) {
              usernameToFind = params.where.username;
            }
            if (params.where.id !== undefined) {
              idToFind = params.where.id;
            }
            if (!usernameToFind && params.where.left && params.where.right) {
              if (params.where.left.name === 'username') {
                usernameToFind = params.where.right;
              }
            }
            if (usernameToFind) {
              const user = mockUsers.find(u => u.username === usernameToFind);
              if (user) {
                return { ...user };
              }
            }
            if (idToFind !== null) {
              const user = mockUsers.find(u => u.id === idToFind);
              if (user) {
                return { ...user };
              }
            }
            return null;
          } catch (error) {
            return null;
          }
        }
      },
      transactions: {
        findMany: async () => []
      },
      disputes: {
        findMany: async () => []
      }
    },
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: async () => {
          if (table === schema.users) {
            const username = data.username;
            const existingUser = mockUsers.find(u => u.username === username);
            if (existingUser) {
              const error = new Error(`Username ${username} already exists`);
              // @ts-ignore
              error.code = "UNIQUE_VIOLATION";
              throw error;
            }
            const newUser = { 
              id: mockUsers.length + 1, 
              username: username, 
              password: data.password, 
              role: data.role || 'user', 
              createdAt: new Date() 
            };
            if (!newUser.password) {
              throw new Error("User registration error: Missing password field");
            }
            mockUsers.push(newUser);
            return [{ 
              id: newUser.id, 
              username: newUser.username, 
              role: newUser.role 
            }];
          }
          return [{ id: 1, content: 'Mock response', senderId: 1 }];
        }
      })
    })
  };
} else {
  // Real database connection
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

// Export for direct access in routes
export { db, pool, mockUsers };