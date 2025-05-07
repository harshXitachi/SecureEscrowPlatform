export interface LegalPageContent {
  title: string;
  subtitle: string;
  description: string;
  content: string;
  lastUpdated: string;
}

export const legalContent: Record<string, LegalPageContent> = {
  terms: {
    title: "Terms of Service",
    subtitle: "Guidelines for using the Middlesman platform",
    description: "Please read these terms carefully before using our services.",
    lastUpdated: "November 15, 2023",
    content: `
## Terms of Service Agreement

### 1. Acceptance of Terms

By accessing or using the Middlesman platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.

### 2. Description of Service

Middlesman is an escrow platform that facilitates secure transactions between buyers and sellers. We act as a neutral third party that holds funds until all parties fulfill their obligations as agreed upon.

### 3. User Accounts

3.1. To use certain features of the platform, you must register for an account.

3.2. You agree to provide accurate, current, and complete information during the registration process.

3.3. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

3.4. You must notify us immediately of any unauthorized use of your account.

### 4. Transaction Process

4.1. Buyers agree to deposit funds into our escrow service before sellers are required to deliver goods or services.

4.2. Sellers agree to deliver goods or services as described in the transaction details.

4.3. Upon satisfactory delivery, buyers agree to release funds to the seller.

4.4. For disputes, both parties agree to our dispute resolution process.

### 5. Fees and Payments

5.1. We charge fees based on the transaction amount as outlined in our pricing section.

5.2. All fees are non-refundable unless required by law.

5.3. We reserve the right to change our fee structure with appropriate notice.

### 6. Dispute Resolution

6.1. In case of a dispute, both parties agree to our mediation process.

6.2. We will review evidence from both parties before making a decision.

6.3. Our decision is final and binding within the platform.

### 7. Prohibited Activities

Users agree not to engage in any of the following:

7.1. Fraudulent transactions or misrepresentations
7.2. Money laundering or financing illegal activities
7.3. Transactions involving prohibited items
7.4. Harassment or abuse of other users
7.5. Attempts to manipulate our systems or processes

### 8. Termination

We reserve the right to suspend or terminate accounts that violate these terms or engage in suspicious activities.

### 9. Limitation of Liability

9.1. Middlesman is not responsible for the quality, safety, or legality of items or services transacted.

9.2. We do not guarantee continuous, uninterrupted access to our services.

9.3. Our maximum liability shall not exceed the fees paid for the specific transaction in dispute.

### 10. Modifications to Terms

We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.

### 11. Governing Law

These terms are governed by the laws of India, and all disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, India.

### 12. Contact Information

For questions about these terms, please contact us at legal@middlesman.com.
    `
  },
  
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your information",
    description: "Our commitment to safeguarding your privacy and data security.",
    lastUpdated: "December 5, 2023",
    content: `
## Privacy Policy

### 1. Introduction

At Middlesman, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

### 2. Information We Collect

#### 2.1 Personal Information

We may collect the following personal information:

- Contact information (name, email address, phone number)
- Financial information (bank account details, payment information)
- Identity verification information (government ID, address proof)
- Transaction details and history
- Communication records between users and our support team

#### 2.2 Automatically Collected Information

When you use our platform, we automatically collect:

- Device information (browser type, IP address, device type)
- Usage data (pages visited, time spent, clicks)
- Location information (with your consent)
- Cookies and similar tracking technologies

### 3. How We Use Your Information

We use your information for the following purposes:

- Processing transactions and providing our escrow services
- Verifying your identity and preventing fraud
- Communicating with you about transactions and our services
- Improving our platform and user experience
- Complying with legal obligations
- Resolving disputes between users

### 4. Data Sharing and Disclosure

We may share your information with:

#### 4.1 Transaction Partners
Information necessary to complete transactions with other users involved in your transactions.

#### 4.2 Service Providers
Third-party vendors who perform services on our behalf, such as payment processing, data analysis, and customer support.

#### 4.3 Legal Requirements
When required by law, court order, or governmental authority.

#### 4.4 Business Transfers
In connection with a merger, acquisition, or sale of assets.

### 5. Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

### 6. Data Retention

We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.

### 7. Your Rights

Depending on your location, you may have rights regarding your personal information, including:

- Access to your personal information
- Correction of inaccurate information
- Deletion of your personal information
- Restriction of processing
- Data portability
- Objection to processing

### 8. Children's Privacy

Our services are not directed to individuals under 18 years of age, and we do not knowingly collect personal information from children.

### 9. International Data Transfers

Your information may be transferred and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information.

### 10. Updates to This Policy

We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our platform or by email.

### 11. Contact Us

If you have questions or concerns about this Privacy Policy, please contact our Data Protection Officer at privacy@middlesman.com.
    `
  }
}; 