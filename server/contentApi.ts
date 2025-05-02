import { Express, Request, Response } from "express";
import { db } from "../db";
import {
  contentPages,
  blogPosts,
  apiDocs,
  communityThreads,
  communityReplies,
  contactRequests,
  insertContentPageSchema,
  insertBlogPostSchema,
  insertApiDocSchema,
  insertCommunityThreadSchema,
  insertCommunityReplySchema,
  insertContactRequestSchema,
} from "@shared/schema";
import { eq, and, desc, like, asc } from "drizzle-orm";
import { z } from "zod";

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: Function) {
  // For now, we'll just check if the user is logged in using session
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // TODO: Add proper admin role check
  next();
}

export function registerContentApiRoutes(app: Express) {
  const apiPrefix = "/api/content";

  // Content Pages Routes
  app.get(`${apiPrefix}/pages`, async (req: Request, res: Response) => {
    try {
      const { category, subcategory, isPublished = true } = req.query;

      let query = db.select().from(contentPages);
      
      if (category) {
        query = query.where(eq(contentPages.category, category as string));
      }
      
      if (subcategory) {
        query = query.where(eq(contentPages.subcategory, subcategory as string));
      }
      
      if (isPublished === 'true') {
        query = query.where(eq(contentPages.isPublished, true));
      }

      query = query.orderBy(asc(contentPages.title));
      
      const pages = await query;
      res.json(pages);
    } catch (error) {
      console.error('Error fetching content pages:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/pages/:slug`, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const page = await db.query.contentPages.findFirst({
        where: eq(contentPages.slug, slug),
      });
      
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error fetching content page:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/pages`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertContentPageSchema.parse(req.body);
      const [newPage] = await db.insert(contentPages).values(validatedData).returning();
      res.status(201).json(newPage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating content page:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(`${apiPrefix}/pages/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertContentPageSchema.parse(req.body);
      
      const [updatedPage] = await db
        .update(contentPages)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(contentPages.id, parseInt(id)))
        .returning();
      
      if (!updatedPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      res.json(updatedPage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating content page:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(`${apiPrefix}/pages/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(contentPages).where(eq(contentPages.id, parseInt(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting content page:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Blog Posts Routes
  app.get(`${apiPrefix}/blog`, async (req: Request, res: Response) => {
    try {
      const { isPublished = true, limit = 10, offset = 0 } = req.query;
      
      let query = db.select().from(blogPosts);
      
      if (isPublished === 'true') {
        query = query.where(eq(blogPosts.isPublished, true));
      }
      
      query = query
        .orderBy(desc(blogPosts.publishedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      const posts = await query;
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/blog/:slug`, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
          author: true,
        },
      });
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/blog`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const [newPost] = await db.insert(blogPosts).values(validatedData).returning();
      res.status(201).json(newPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(`${apiPrefix}/blog/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertBlogPostSchema.parse(req.body);
      
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, parseInt(id)))
        .returning();
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(`${apiPrefix}/blog/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(blogPosts).where(eq(blogPosts.id, parseInt(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API Documentation Routes
  app.get(`${apiPrefix}/api-docs`, async (req: Request, res: Response) => {
    try {
      const { category, isPublished = true } = req.query;
      
      let query = db.select().from(apiDocs);
      
      if (category) {
        query = query.where(eq(apiDocs.category, category as string));
      }
      
      if (isPublished === 'true') {
        query = query.where(eq(apiDocs.isPublished, true));
      }
      
      query = query.orderBy(asc(apiDocs.category), asc(apiDocs.title));
      
      const docs = await query;
      res.json(docs);
    } catch (error) {
      console.error('Error fetching API docs:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/api-docs/:slug`, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const doc = await db.query.apiDocs.findFirst({
        where: eq(apiDocs.slug, slug),
      });
      
      if (!doc) {
        return res.status(404).json({ message: "API documentation not found" });
      }
      
      res.json(doc);
    } catch (error) {
      console.error('Error fetching API doc:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/api-docs`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertApiDocSchema.parse(req.body);
      const [newDoc] = await db.insert(apiDocs).values(validatedData).returning();
      res.status(201).json(newDoc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating API doc:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(`${apiPrefix}/api-docs/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertApiDocSchema.parse(req.body);
      
      const [updatedDoc] = await db
        .update(apiDocs)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(apiDocs.id, parseInt(id)))
        .returning();
      
      if (!updatedDoc) {
        return res.status(404).json({ message: "API documentation not found" });
      }
      
      res.json(updatedDoc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating API doc:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(`${apiPrefix}/api-docs/:id`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(apiDocs).where(eq(apiDocs.id, parseInt(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting API doc:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Community Routes
  app.get(`${apiPrefix}/community/threads`, async (req: Request, res: Response) => {
    try {
      const { category, isPinned, limit = 20, offset = 0 } = req.query;
      
      let query = db.select().from(communityThreads);
      
      if (category) {
        query = query.where(eq(communityThreads.category, category as string));
      }
      
      if (isPinned === 'true') {
        query = query.where(eq(communityThreads.isPinned, true));
      }
      
      query = query
        .orderBy(desc(communityThreads.isPinned), desc(communityThreads.updatedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      const threads = await query;
      res.json(threads);
    } catch (error) {
      console.error('Error fetching community threads:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/community/threads/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const thread = await db.query.communityThreads.findFirst({
        where: eq(communityThreads.id, parseInt(id)),
        with: {
          author: true,
          replies: {
            with: {
              author: true,
            },
            orderBy: asc(communityReplies.createdAt),
          },
        },
      });
      
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      
      // Update view count
      await db
        .update(communityThreads)
        .set({
          viewCount: thread.viewCount + 1,
        })
        .where(eq(communityThreads.id, parseInt(id)));
      
      res.json({ ...thread, viewCount: thread.viewCount + 1 });
    } catch (error) {
      console.error('Error fetching community thread:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/community/threads`, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "You must be logged in to create a thread" });
      }
      
      const validatedData = insertCommunityThreadSchema.parse({
        ...req.body,
        authorId: req.session.userId,
      });
      
      const [newThread] = await db.insert(communityThreads).values(validatedData).returning();
      res.status(201).json(newThread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating community thread:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/community/threads/:threadId/replies`, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "You must be logged in to reply" });
      }
      
      const { threadId } = req.params;
      
      // Check if thread exists and is not locked
      const thread = await db.query.communityThreads.findFirst({
        where: eq(communityThreads.id, parseInt(threadId)),
      });
      
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      
      if (thread.isLocked) {
        return res.status(403).json({ message: "This thread is locked" });
      }
      
      const validatedData = insertCommunityReplySchema.parse({
        ...req.body,
        threadId: parseInt(threadId),
        authorId: req.session.userId,
      });
      
      const [newReply] = await db.insert(communityReplies).values(validatedData).returning();
      
      // Update thread's updatedAt timestamp
      await db
        .update(communityThreads)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(communityThreads.id, parseInt(threadId)));
      
      res.status(201).json(newReply);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating community reply:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Contact Requests
  app.post(`${apiPrefix}/contact`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertContactRequestSchema.parse(req.body);
      
      const [newRequest] = await db.insert(contactRequests).values(validatedData).returning();
      res.status(201).json({ 
        message: "Your message has been sent successfully. We'll get back to you soon!",
        requestId: newRequest.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error submitting contact request:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin only: Get contact requests
  app.get(`${apiPrefix}/contact-requests`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      
      let query = db.select().from(contactRequests);
      
      if (status) {
        query = query.where(eq(contactRequests.status, status as string));
      }
      
      query = query
        .orderBy(desc(contactRequests.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      const requests = await query;
      res.json(requests);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(`${apiPrefix}/contact-requests/:id/status`, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['pending', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const [updatedRequest] = await db
        .update(contactRequests)
        .set({
          status: status,
          updatedAt: new Date(),
        })
        .where(eq(contactRequests.id, parseInt(id)))
        .returning();
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating contact request status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // These routes handle the menu structure from the screenshot
  // Product section
  app.get(`${apiPrefix}/product/features`, async (req: Request, res: Response) => {
    try {
      const features = await db.query.contentPages.findMany({
        where: and(
          eq(contentPages.category, "product"),
          eq(contentPages.subcategory, "features"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(features);
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/product/pricing`, async (req: Request, res: Response) => {
    try {
      const pricing = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "product"),
          eq(contentPages.subcategory, "pricing"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(pricing || { title: "Pricing", content: "Pricing information coming soon." });
    } catch (error) {
      console.error('Error fetching pricing:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/product/integrations`, async (req: Request, res: Response) => {
    try {
      const integrations = await db.query.contentPages.findMany({
        where: and(
          eq(contentPages.category, "product"),
          eq(contentPages.subcategory, "integrations"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/product/enterprise`, async (req: Request, res: Response) => {
    try {
      const enterprise = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "product"),
          eq(contentPages.subcategory, "enterprise"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(enterprise || { title: "Enterprise", content: "Enterprise information coming soon." });
    } catch (error) {
      console.error('Error fetching enterprise info:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/product/security`, async (req: Request, res: Response) => {
    try {
      const security = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "product"),
          eq(contentPages.subcategory, "security"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(security || { title: "Security", content: "Security information coming soon." });
    } catch (error) {
      console.error('Error fetching security info:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Company section
  app.get(`${apiPrefix}/company/about`, async (req: Request, res: Response) => {
    try {
      const about = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "company"),
          eq(contentPages.subcategory, "about"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(about || { title: "About Us", content: "About us information coming soon." });
    } catch (error) {
      console.error('Error fetching about us:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/company/careers`, async (req: Request, res: Response) => {
    try {
      const careers = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "company"),
          eq(contentPages.subcategory, "careers"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(careers || { title: "Careers", content: "Careers information coming soon." });
    } catch (error) {
      console.error('Error fetching careers:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/company/partners`, async (req: Request, res: Response) => {
    try {
      const partners = await db.query.contentPages.findFirst({
        where: and(
          eq(contentPages.category, "company"),
          eq(contentPages.subcategory, "partners"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(partners || { title: "Partners", content: "Partners information coming soon." });
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${apiPrefix}/company/legal`, async (req: Request, res: Response) => {
    try {
      const legal = await db.query.contentPages.findMany({
        where: and(
          eq(contentPages.category, "company"),
          eq(contentPages.subcategory, "legal"),
          eq(contentPages.isPublished, true)
        ),
      });
      res.json(legal);
    } catch (error) {
      console.error('Error fetching legal info:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}