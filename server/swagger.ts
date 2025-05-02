import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Middlesman Escrow API",
      version: "1.0.0",
      description: "API documentation for the Middlesman Escrow Platform",
      contact: {
        name: "Middlesman Support",
        url: "https://middlesman.io",
        email: "support@middlesman.io",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    components: {
      securitySchemes: {
        oauth2: {
          type: "oauth2",
          flows: {
            clientCredentials: {
              tokenUrl: "/api/oauth/token",
              scopes: {
                "transactions:read": "Read transaction data",
                "transactions:write": "Create and update transactions",
                "disputes:read": "Read dispute data",
                "disputes:write": "Create and update disputes",
              },
            },
          },
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Transaction: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            amount: { type: "string" },
            currency: { type: "string" },
            type: { type: "string" },
            status: { type: "string" },
            escrowStatus: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
            buyerId: { type: "integer" },
            sellerId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Milestone: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            amount: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time", nullable: true },
            status: { type: "string" },
            escrowStatus: { type: "string" },
            transactionId: { type: "integer" },
            completionProof: { type: "string", nullable: true },
            rejectionReason: { type: "string", nullable: true },
          },
        },
        Dispute: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            resolution: { type: "string", nullable: true },
            resolutionType: { type: "string", nullable: true },
            transactionId: { type: "integer" },
            milestoneId: { type: "integer", nullable: true },
            raisedById: { type: "integer" },
            assignedToId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            errors: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "array", items: { type: "string" } },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string" },
            callbackUrl: { type: "string" },
            events: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      // Marketplace API Endpoints
      "/api/marketplace/transactions": {
        post: {
          summary: "Create a new transaction",
          description: "Create a new escrow transaction between a buyer and a seller",
          tags: ["Marketplace"],
          security: [{ oauth2: ["transactions:write"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "description", "amount", "type", "buyerId", "sellerId"],
                  properties: {
                    title: { type: "string", minLength: 3 },
                    description: { type: "string", minLength: 10 },
                    amount: { type: "number", minimum: 0 },
                    type: { type: "string" },
                    currency: { type: "string", default: "USD" },
                    dueDate: { type: "string", format: "date-time" },
                    buyerId: { type: "integer" },
                    sellerId: { type: "integer" },
                    paymentMethod: { type: "string" },
                    milestones: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["title", "description", "amount", "dueDate"],
                        properties: {
                          title: { type: "string", minLength: 3 },
                          description: { type: "string", minLength: 10 },
                          amount: { type: "number", minimum: 0 },
                          dueDate: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Transaction created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Transaction" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/marketplace/transactions/{id}": {
        get: {
          summary: "Get transaction details",
          description: "Retrieve details of a specific transaction by ID",
          tags: ["Marketplace"],
          security: [{ oauth2: ["transactions:read"] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Transaction ID",
            },
          ],
          responses: {
            "200": {
              description: "Transaction details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Transaction" },
                },
              },
            },
            "400": {
              description: "Invalid transaction ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Transaction not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/marketplace/transactions/{id}/release": {
        post: {
          summary: "Release funds",
          description: "Release funds for a transaction or a specific milestone",
          tags: ["Marketplace"],
          security: [{ oauth2: ["transactions:write"] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Transaction ID",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    milestoneId: { type: "integer", description: "ID of the specific milestone to release funds for" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Funds released successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid transaction or milestone ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Transaction or milestone not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/marketplace/transactions/{id}/refund": {
        post: {
          summary: "Initiate a refund",
          description: "Initiate a refund for a transaction or a specific milestone",
          tags: ["Marketplace"],
          security: [{ oauth2: ["transactions:write"] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Transaction ID",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    milestoneId: { type: "integer", description: "ID of the specific milestone to refund" },
                    reason: { type: "string", description: "Reason for the refund" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Refund initiated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid transaction or milestone ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Transaction or milestone not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/marketplace/transactions/{id}/dispute": {
        post: {
          summary: "Raise a dispute",
          description: "Raise a dispute for a transaction or a specific milestone",
          tags: ["Marketplace"],
          security: [{ oauth2: ["disputes:write"] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Transaction ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "description", "raisedById"],
                  properties: {
                    title: { type: "string", minLength: 3 },
                    description: { type: "string", minLength: 10 },
                    milestoneId: { type: "integer" },
                    raisedById: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Dispute created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Dispute" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Transaction not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/marketplace/webhooks": {
        post: {
          summary: "Register a webhook",
          description: "Register a webhook to receive notifications about transaction and dispute events",
          tags: ["Marketplace"],
          security: [{ oauth2: ["transactions:read"] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["callbackUrl", "events"],
                  properties: {
                    callbackUrl: { type: "string", format: "uri" },
                    events: { 
                      type: "array", 
                      items: { 
                        type: "string",
                        enum: [
                          "transaction.created",
                          "transaction.updated",
                          "transaction.completed",
                          "transaction.refunded",
                          "dispute.created",
                          "dispute.updated",
                          "dispute.resolved",
                          "milestone.completed"
                        ]
                      } 
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Webhook registered successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Webhook" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      
      // Admin API Endpoints
      "/api/admin/users": {
        get: {
          summary: "Get all users",
          description: "Retrieve a list of all users with pagination and filtering options",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search term for filtering users by username",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
              description: "Number of items per page",
            },
            {
              name: "isActive",
              in: "query",
              schema: { type: "boolean" },
              description: "Filter users by active status",
            },
          ],
          responses: {
            "200": {
              description: "List of users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      users: {
                        type: "array",
                        items: { $ref: "#/components/schemas/User" },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/transactions": {
        get: {
          summary: "Get all transactions",
          description: "Retrieve a list of all transactions with pagination and filtering options",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Filter transactions by status",
            },
            {
              name: "buyerId",
              in: "query",
              schema: { type: "integer" },
              description: "Filter transactions by buyer ID",
            },
            {
              name: "sellerId",
              in: "query",
              schema: { type: "integer" },
              description: "Filter transactions by seller ID",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
              description: "Number of items per page",
            },
            {
              name: "sort",
              in: "query",
              schema: { type: "string", enum: ["createdAt", "amount", "dueDate"], default: "createdAt" },
              description: "Field to sort by",
            },
            {
              name: "order",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
              description: "Sort order",
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search term for filtering transactions by title or description",
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter transactions created on or after this date",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter transactions created on or before this date",
            },
          ],
          responses: {
            "200": {
              description: "List of transactions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      transactions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Transaction" },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/disputes": {
        get: {
          summary: "Get all disputes",
          description: "Retrieve a list of all disputes with pagination and filtering options",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Filter disputes by status",
            },
            {
              name: "transactionId",
              in: "query",
              schema: { type: "integer" },
              description: "Filter disputes by transaction ID",
            },
            {
              name: "assignedToId",
              in: "query",
              schema: { type: "string" },
              description: "Filter disputes by assigned admin ID or 'unassigned'",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number for pagination",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
              description: "Number of items per page",
            },
          ],
          responses: {
            "200": {
              description: "List of disputes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      disputes: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Dispute" },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/disputes/{id}": {
        get: {
          summary: "Get dispute details",
          description: "Retrieve details of a specific dispute by ID",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Dispute ID",
            },
          ],
          responses: {
            "200": {
              description: "Dispute details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Dispute" },
                },
              },
            },
            "400": {
              description: "Invalid dispute ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Dispute not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        patch: {
          summary: "Update dispute",
          description: "Update a dispute's status, resolution, or assigned admin",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Dispute ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["open", "reviewing", "resolved", "closed"] },
                    resolution: { type: "string" },
                    resolutionType: { type: "string", enum: ["refund", "release", "partial", "cancelled"] },
                    assignedToId: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Dispute updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Dispute" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Dispute not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/reports/transactions": {
        get: {
          summary: "Get transaction reports",
          description: "Generate reports and analytics on transactions",
          tags: ["Admin", "Reports"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for the report period",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for the report period",
            },
            {
              name: "type",
              in: "query",
              schema: { type: "string" },
              description: "Filter by transaction type",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Filter by transaction status",
            },
          ],
          responses: {
            "200": {
              description: "Transaction reports",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      summary: {
                        type: "object",
                        properties: {
                          totalTransactions: { type: "integer" },
                          totalAmount: { type: "string" },
                        },
                      },
                      byStatus: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            status: { type: "string" },
                            count: { type: "integer" },
                            totalAmount: { type: "string" },
                          },
                        },
                      },
                      byMonth: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            month: { type: "string" },
                            count: { type: "integer" },
                            totalAmount: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid date range",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/reports/users": {
        get: {
          summary: "Get user reports",
          description: "Generate reports and analytics on user activity",
          tags: ["Admin", "Reports"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for the report period",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for the report period",
            },
          ],
          responses: {
            "200": {
              description: "User reports",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      summary: {
                        type: "object",
                        properties: {
                          totalUsers: { type: "integer" },
                          newUsers: { type: "integer" },
                        },
                      },
                      monthlySignups: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            month: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                      mostActiveBuyers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "integer" },
                            user: { $ref: "#/components/schemas/User" },
                            transactionCount: { type: "integer" },
                          },
                        },
                      },
                      mostActiveSellers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "integer" },
                            user: { $ref: "#/components/schemas/User" },
                            transactionCount: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid date range",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/admin/reports/disputes": {
        get: {
          summary: "Get dispute reports",
          description: "Generate reports and analytics on dispute resolution",
          tags: ["Admin", "Reports"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for the report period",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for the report period",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Filter by dispute status",
            },
          ],
          responses: {
            "200": {
              description: "Dispute reports",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      summary: {
                        type: "object",
                        properties: {
                          totalDisputes: { type: "integer" },
                          averageResolutionTime: { type: "number" },
                        },
                      },
                      byStatus: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            status: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                      byResolutionType: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            resolutionType: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                      byMonth: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            month: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid date range",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./server/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Serve Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve Swagger spec as JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  
  console.log("Swagger documentation available at /api-docs");
}