export interface CompanyPageContent {
  title: string;
  subtitle: string;
  description: string;
  content: string;
  imageSrc?: string;
}

export const companyContent: Record<string, CompanyPageContent> = {
  about: {
    title: "About Middlesman",
    subtitle: "The trusted platform for secure transactions",
    description: "Learn about our mission, vision, and the team behind Middlesman's innovative escrow platform.",
    content: `
## Our Story

Middlesman was founded in 2021 with a clear mission: to make online transactions safer and more reliable for everyone. What began as a solution for securing freelance contracts has grown into a comprehensive escrow platform serving businesses and individuals across India.

## Our Mission

We're on a mission to eliminate fraud and build trust in digital commerce. By creating a transparent, secure, and easy-to-use escrow platform, we're helping buyers and sellers transact with confidence.

## Our Team

Our diverse team brings together expertise in fintech, security, and customer experience. Led by our founding team of financial and technology experts, we're committed to continuous innovation and exceptional service.

### Leadership

- **Arjun Sharma** — Chief Executive Officer
- **Priya Mehta** — Chief Technology Officer
- **Vikram Patel** — Chief Financial Officer
- **Divya Gupta** — Chief Operating Officer

## Our Values

- **Trust** — The foundation of everything we do
- **Transparency** — Clear and open in all our operations
- **Security** — Uncompromising protection for all users
- **Innovation** — Constantly improving our platform
- **Accessibility** — Making escrow services available to everyone
    `,
    imageSrc: "/images/about-team.jpg"
  },
  
  careers: {
    title: "Join Our Team",
    subtitle: "Build the future of secure transactions",
    description: "Explore career opportunities at Middlesman and help us revolutionize the way people transact online.",
    content: `
## Why Work With Us

At Middlesman, we're not just building an escrow platform; we're revolutionizing the way people transact online. Join our team of passionate professionals who are dedicated to creating a safer digital economy.

## Our Culture

We foster a culture of innovation, collaboration, and continuous learning. Our diverse team brings together different perspectives, experiences, and skills to create solutions that work for everyone.

## Benefits

- Competitive salary and equity packages
- Comprehensive health insurance
- Flexible work arrangements
- Professional development budget
- Regular team events and retreats
- Modern, collaborative workspace
- Opportunity to make a real impact

## Open Positions

### Engineering
- Senior Backend Developer (Node.js, TypeScript)
- Frontend Engineer (React, TypeScript)
- DevOps Engineer
- Security Engineer

### Product & Design
- Product Manager
- UX/UI Designer
- Product Analyst

### Operations
- Customer Success Manager
- Operations Specialist
- Risk Analyst

### Marketing & Sales
- Digital Marketing Specialist
- Content Writer
- Sales Representative
- Business Development Executive

## How to Apply

Send your resume and a brief cover letter to careers@middlesman.com, or click the button below to view detailed job descriptions and apply online.
    `,
    imageSrc: "/images/careers.jpg"
  },
  
  partners: {
    title: "Partner With Us",
    subtitle: "Grow your business with secure transactions",
    description: "Discover partnership opportunities and join our network of businesses building trust in digital commerce.",
    content: `
## Partnership Opportunities

Middlesman offers various partnership models designed to add value to your business while providing your customers with secure transaction options.

## Why Partner With Us

- **Enhanced Trust** — Offer your customers a secure way to transact
- **New Revenue Streams** — Earn commission on transactions processed through our platform
- **Seamless Integration** — Easy API integration with your existing platform
- **White-Label Solutions** — Custom-branded escrow services for your business
- **Joint Marketing** — Co-marketing opportunities to reach new audiences

## Partnership Models

### Referral Partners
Refer your customers to Middlesman and earn commissions on their transactions. Ideal for consultants, business advisors, and marketplace operators.

### Technology Partners
Integrate our escrow API into your platform or application to provide secure payment options to your users. Perfect for marketplaces, e-commerce platforms, and SaaS providers.

### Strategic Partners
Deep integration opportunities for financial institutions, payment processors, and large marketplaces looking to offer comprehensive escrow services.

## Our Current Partners

We're proud to work with leading companies across various industries, including:

- Major e-commerce platforms
- Online marketplaces
- Payment service providers
- Legal and consulting firms
- Industry associations

## Become a Partner

Interested in exploring a partnership? Fill out our partner application form or contact our partnership team directly to discuss how we can work together.
    `,
    imageSrc: "/images/partners.jpg"
  }
}; 