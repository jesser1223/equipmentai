export const TERMS_VERSION = "1.0";
export const PRIVACY_VERSION = "1.0";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const termsSections: LegalSection[] = [
  {
    heading: "1. Acceptance of Terms",
    paragraphs: [
      "These Terms of Service (\"Terms\") constitute a legally binding agreement between the person or business accepting these Terms (\"Customer,\" \"you,\" or \"your\") and [FULL LEGAL BUSINESS NAME], operating as EquipmentAI (\"EquipmentAI,\" \"we,\" \"us,\" or \"our\").",
      "By creating an account, selecting the agreement checkbox, or accessing or using the EquipmentAI platform, you agree to these Terms.",
      "If you accept these Terms on behalf of a company, you represent and warrant that you have the authority to bind that company.",
      "If you do not agree, you must not register for or use the Service.",
      "Our Privacy Policy explains how we handle personal information and forms an important part of your use of the Service.",
    ],
  },
  {
    heading: "2. Description of Services",
    paragraphs: [
      "EquipmentAI is a cloud-based business management software platform designed primarily for equipment contractors and related businesses.",
      "Depending on the subscription and features available, the Service may provide: equipment and attachment management; equipment rates and utilization records; job management and scheduling; customer and business contact management; quotes, estimates, and invoicing; payment recording and tracking; maintenance scheduling and records; document and photograph storage; operational dashboards and reporting; email notifications and workflow automation; and optional integrations and additional features.",
      "EquipmentAI may modify, improve, replace, or discontinue individual features, subject to applicable law and any commitments expressly made in a paid subscription agreement.",
      "The Service is an administrative and operational management tool. It is not a substitute for professional accounting, legal, tax, engineering, mechanical, or safety advice.",
    ],
  },
  {
    heading: "3. Eligibility and Account Registration",
    paragraphs: [
      "You must be at least 18 years old, or the age of majority in your jurisdiction, and legally capable of entering into a binding agreement.",
      "You agree to provide accurate registration information and keep that information current.",
      "EquipmentAI may review new company registrations before granting access. Account creation does not guarantee approval. We may deny an application for legitimate business, security, fraud-prevention, legal, or operational reasons, provided we comply with applicable law.",
      "You are responsible for protecting your login credentials and for activities carried out through your account by persons you authorize. You must promptly notify EquipmentAI of suspected unauthorized access.",
    ],
  },
  {
    heading: "4. Business Accounts and Authorized Users",
    paragraphs: [
      "The Customer is responsible for determining which employees, representatives, or contractors may access its company account.",
      "The Customer is responsible for assigning appropriate permissions, removing access when personnel leave, ensuring authorized users comply with these Terms, ensuring information uploaded by users is lawful and accurate, and maintaining appropriate internal business controls.",
      "EquipmentAI is not responsible for disputes between a Customer and its authorized users regarding company ownership, permissions, or internal access, except to the extent caused by EquipmentAI's own breach of legal or contractual obligations.",
    ],
  },
  {
    heading: "5. Subscription Fees, Billing, and Free Trials",
    paragraphs: [
      "EquipmentAI may offer paid subscriptions and promotional free trials. The current subscription price, billing interval, included features, applicable taxes, and any promotional conditions will be disclosed during subscription selection or checkout.",
      "Where offered, a 30-day free trial begins when the company is approved, or on the date specified during trial activation. A payment card is not required to begin the standard free trial unless expressly disclosed otherwise. A free trial does not automatically create a paid subscription unless the Customer has separately authorized the applicable paid billing arrangement. At the end of the trial, access may be restricted until the Customer selects and activates a paid subscription. Customer data is retained after the trial ends.",
      "If the Customer purchases a recurring subscription, the subscription renews at the disclosed billing interval until cancelled in accordance with the cancellation terms presented at purchase. By purchasing a paid subscription, the Customer authorizes the disclosed recurring charges through the applicable payment provider. Subscription fees, taxes, and payment terms must be clearly presented before payment authorization.",
      "EquipmentAI may change subscription prices with advance notice appropriate to the subscription and applicable law. A price change will not retroactively alter fees already paid.",
      "If a payment fails, EquipmentAI may notify the Customer, request updated payment information, and suspend paid access after providing any notice required by applicable law or the subscription agreement.",
      "Unless a separate written refund policy provides otherwise, subscription fees are generally non-refundable for a billing period already started, except where required by applicable law or where EquipmentAI has expressly agreed to a refund. This provision does not limit non-waivable statutory rights or remedies for EquipmentAI's breach.",
    ],
  },
  {
    heading: "6. Customer Data and Ownership",
    paragraphs: [
      "\"Customer Data\" means information, documents, records, photographs, and other materials submitted to or stored in the Service by or on behalf of a Customer.",
      "As between EquipmentAI and the Customer, the Customer retains ownership of its Customer Data and all rights it lawfully holds in that data. EquipmentAI does not acquire ownership of Customer Data merely because it is stored in the Service.",
      "The Customer grants EquipmentAI a limited, non-exclusive right to host, copy, process, transmit, display, back up, and otherwise handle Customer Data solely as reasonably necessary to provide and maintain the Service, carry out Customer-authorized functions, provide support and troubleshoot issues, protect platform security and integrity, meet applicable legal obligations, and perform other activities disclosed in the Privacy Policy or separately authorized by the Customer.",
      "EquipmentAI will not sell Customer Data to data brokers. EquipmentAI will not use identifiable Customer Data to train general-purpose artificial intelligence models without a separate lawful basis and any required notice or consent.",
      "The Customer represents that it has the necessary rights and legal authority to provide Customer Data to EquipmentAI.",
    ],
  },
  {
    heading: "7. Data Accuracy and Customer Responsibilities",
    paragraphs: [
      "The Customer is responsible for verifying all information entered into or generated through the Service, including equipment rates and operating hours, maintenance records and service intervals, job details and scheduling, quotes and estimated charges, invoices, tax calculations, and payment records, customer information and contact details, and attachments, expenses, and surcharges.",
      "EquipmentAI may automate calculations and workflows using information supplied by the Customer. Such calculations and workflows may contain errors or require human verification.",
      "The Customer remains responsible for reviewing important business records before relying on them, subject to EquipmentAI's own obligations to provide the Service with reasonable care and in accordance with these Terms.",
    ],
  },
  {
    heading: "8. Invoicing, Payments, and Taxes",
    paragraphs: [
      "EquipmentAI provides tools for preparing and managing business records. EquipmentAI is not a bank, accounting firm, tax adviser, or payment guarantor.",
      "Unless expressly provided through a separately identified payment service, EquipmentAI does not collect debts on behalf of Customers or guarantee that their clients will pay invoices.",
      "The Customer is responsible for confirming invoice accuracy, applying appropriate GST, HST, PST, or other taxes, meeting applicable tax and recordkeeping requirements, determining payment terms, managing disputes with its own customers, and verifying that payments have actually been received.",
      "Any default tax setting is a configurable software feature and does not constitute tax advice.",
    ],
  },
  {
    heading: "9. Equipment, Maintenance, and Operational Safety",
    paragraphs: [
      "EquipmentAI is not an equipment manufacturer, certified mechanic, safety inspector, or engineering service. Maintenance reminders, equipment records, availability indicators, and scheduling information are administrative aids.",
      "The Customer remains responsible for following manufacturer service instructions, performing legally required inspections, maintaining equipment in safe operating condition, complying with occupational health and safety requirements, ensuring operators are appropriately trained and qualified, and verifying equipment suitability and availability.",
      "The Customer must not rely exclusively on EquipmentAI to determine whether equipment is safe to operate. Nothing in this section excludes liability that cannot lawfully be excluded.",
    ],
  },
  {
    heading: "10. Automated Communications",
    paragraphs: [
      "The Service may allow Customers to send quotes, invoices, reminders, receipts, and other communications to their own clients.",
      "The Customer is responsible for ensuring that recipients' information is accurate and that communications comply with applicable privacy, anti-spam, and consumer protection laws. The Customer must not use the Service to send unlawful spam, fraudulent demands, harassment, or misleading communications.",
      "EquipmentAI may impose reasonable restrictions on communications to protect platform integrity and comply with law. The Customer acknowledges that email delivery can be delayed, rejected, filtered, or interrupted by third-party systems. EquipmentAI does not guarantee successful delivery of every message.",
    ],
  },
  {
    heading: "11. Acceptable Use",
    paragraphs: [
      "You must not access another Customer's information without authorization, attempt to bypass authentication or security controls, upload malicious code, interfere with Service availability or performance, use the Service for fraud or unlawful activities, infringe intellectual property or privacy rights, reverse engineer the Service except where applicable law permits, resell or sublicense the Service without authorization, conduct unauthorized security testing, or abuse automated functions or communication systems.",
      "EquipmentAI may investigate suspected violations and take proportionate action, including restricting access, where reasonably necessary.",
    ],
  },
  {
    heading: "12. Intellectual Property",
    paragraphs: [
      "EquipmentAI and its licensors retain all rights, title, and interest in the Service, including its software, source code, interface designs, trademarks, branding, documentation, and proprietary technology.",
      "Subject to these Terms and payment of applicable fees, EquipmentAI grants the Customer a limited, non-exclusive, non-transferable right to access and use the Service for its internal business purposes during the applicable subscription. This licence does not transfer ownership of the software.",
      "Customer Data remains governed by Section 6. Feedback voluntarily provided to EquipmentAI may be used to improve the Service without compensation, provided that doing so does not disclose confidential Customer Data or override applicable privacy obligations.",
    ],
  },
  {
    heading: "13. Confidentiality",
    paragraphs: [
      "Each party may receive non-public business or technical information belonging to the other party. The receiving party must use reasonable care to protect confidential information and may use it only for purposes related to the business relationship.",
      "Confidentiality obligations do not apply to information that is publicly available through no breach, independently developed, lawfully received without restriction, or required to be disclosed by law.",
      "Where legally permitted, a party compelled to disclose confidential information will provide reasonable advance notice.",
    ],
  },
  {
    heading: "14. Security and Privacy",
    paragraphs: [
      "EquipmentAI will implement and maintain administrative, technical, and organizational safeguards appropriate to the nature and sensitivity of the information it handles. No internet-based service can guarantee absolute security.",
      "EquipmentAI will respond to suspected security incidents in accordance with applicable law and its documented incident-response procedures.",
      "The Privacy Policy describes the collection, use, disclosure, retention, and protection of personal information.",
    ],
  },
  {
    heading: "15. Availability and Maintenance",
    paragraphs: [
      "EquipmentAI will use commercially reasonable efforts to maintain the Service. Access may be interrupted by scheduled maintenance, software updates, hosting or network failures, cybersecurity incidents, third-party service interruptions, or events beyond reasonable control.",
      "Unless expressly agreed in a separate service-level agreement, EquipmentAI does not guarantee uninterrupted or error-free availability. EquipmentAI will make reasonable efforts to communicate material planned interruptions where practicable.",
    ],
  },
  {
    heading: "16. Third-Party Services",
    paragraphs: [
      "EquipmentAI may rely on hosting, authentication, email, payment, storage, and other service providers. Optional third-party integrations may be subject to separate terms.",
      "EquipmentAI is not responsible for independent acts or omissions of third-party providers beyond the responsibility imposed on EquipmentAI by applicable law or its own contractual obligations.",
      "EquipmentAI remains responsible for its obligations concerning personal information under its control.",
    ],
  },
  {
    heading: "17. Suspension and Termination",
    paragraphs: [
      "The Customer may request cancellation of a paid subscription through the available account controls or designated support channel. Unless otherwise disclosed at purchase, cancellation stops future subscription renewals and does not automatically entitle the Customer to a refund for the current paid period.",
      "EquipmentAI may suspend or terminate access for material violations of these Terms, unlawful conduct, serious security threats, or unpaid subscription charges. Where reasonably practicable, EquipmentAI will provide notice and an opportunity to remedy a curable violation. Immediate suspension may be necessary to prevent serious harm, fraud, unauthorized access, or unlawful activity.",
    ],
  },
  {
    heading: "18. Data Export and Deletion",
    paragraphs: [
      "Customers may request access to, export of, or deletion of their data, subject to applicable law, technical limitations, contractual requirements, and legitimate retention obligations.",
      "Upon account termination, EquipmentAI will handle Customer Data according to its published retention and deletion procedures. EquipmentAI may retain information where reasonably necessary for legal compliance, accounting records, security investigations, dispute resolution, or other lawful purposes.",
      "The specific export availability, retention period, deletion schedule, and backup procedures must be accurately disclosed in the Privacy Policy or related documentation.",
    ],
  },
  {
    heading: "19. Disclaimers",
    paragraphs: [
      "To the maximum extent permitted by applicable law, and except for express warranties or obligations stated in these Terms, the Service is provided on an \"as available\" basis.",
      "EquipmentAI does not warrant that every calculation, reminder, forecast, report, or automated workflow will be free from error. EquipmentAI does not guarantee increased revenue, reduced expenses, customer acquisition, payment collection, equipment uptime, or any particular business outcome.",
      "Nothing in these Terms excludes statutory warranties, duties, or remedies that cannot lawfully be excluded.",
    ],
  },
  {
    heading: "20. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by applicable law, neither party will be liable to the other for indirect, incidental, special, consequential, or punitive damages, including lost profits or lost business opportunities, arising from use of the Service.",
      "Subject to the exceptions below, EquipmentAI's aggregate liability arising out of or relating to the Service will not exceed the total subscription fees paid or payable by the Customer during the twelve months immediately preceding the event giving rise to the claim. For a Customer using only a free trial, the proposed aggregate cap is CAD $100.",
      "These limitations do not apply to liability that cannot lawfully be limited, including liability for fraud or wilful misconduct, or to other liability that applicable law prohibits excluding.",
      "LEGAL REVIEW REQUIRED: The scope of this limitation, its application to confidentiality and privacy incidents, the free-trial cap, and any additional exclusions must be reviewed by Canadian counsel for enforceability and commercial reasonableness.",
    ],
  },
  {
    heading: "21. Indemnification",
    paragraphs: [
      "The Customer agrees to indemnify and defend EquipmentAI against third-party claims, damages, and reasonable legal expenses arising from Customer Data that infringes another person's rights, the Customer's unlawful use of the Service, the Customer's unauthorized or unlawful communications, or the Customer's material breach of these Terms.",
      "This obligation applies only to the extent the claim results from the Customer's conduct and does not apply to losses caused by EquipmentAI's negligence, misconduct, or breach of its own obligations.",
      "EquipmentAI must provide reasonably prompt notice of an indemnified claim and reasonable cooperation in its defence.",
    ],
  },
  {
    heading: "22. Changes to These Terms",
    paragraphs: [
      "EquipmentAI may update these Terms to reflect changes in law, security requirements, business practices, or Service functionality.",
      "Material changes will be communicated with reasonable advance notice where practicable. Where legally required or appropriate because a change materially affects Customer rights, EquipmentAI may require renewed affirmative acceptance.",
      "Changes will not apply retroactively where doing so would unlawfully impair existing rights.",
    ],
  },
  {
    heading: "23. Governing Law and Disputes",
    paragraphs: [
      "These Terms are governed by the laws of British Columbia and the applicable federal laws of Canada, without regard to conflict-of-law principles.",
      "Subject to mandatory legal rights and jurisdictional requirements, disputes will be brought before courts of competent jurisdiction in British Columbia.",
      "Before commencing formal proceedings, the parties are encouraged to attempt good-faith resolution by providing written notice describing the dispute and allowing a reasonable opportunity to respond.",
      "Nothing in these Terms prevents a party from seeking urgent injunctive relief or exercising non-waivable statutory rights.",
    ],
  },
  {
    heading: "24. General Provisions",
    paragraphs: [
      "If a provision is unenforceable, the remaining provisions will remain effective to the extent permitted by law. Failure to enforce a provision does not constitute a waiver.",
      "The Customer may not transfer its subscription without EquipmentAI's written consent, which will not be unreasonably withheld. EquipmentAI may assign this agreement as part of a legitimate business reorganization or sale, subject to applicable law and continuing obligations to Customers.",
      "Neither party is liable for delays caused by events beyond its reasonable control, except for payment obligations already due.",
      "These Terms, together with any applicable subscription order and incorporated agreements, constitute the entire agreement concerning the Service.",
    ],
  },
  {
    heading: "25. Contact Information",
    paragraphs: [
      "For questions regarding these Terms, contact EquipmentAI.",
      "Legal Operator: [FULL LEGAL BUSINESS NAME]",
      "Email: [OFFICIAL SUPPORT EMAIL]",
      "Address: [BUSINESS MAILING ADDRESS]",
      "Website: https://equipmentai.ca",
    ],
  },
];

export const privacySections: LegalSection[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "EquipmentAI (\"EquipmentAI,\" \"we,\" \"us,\" or \"our\") respects the privacy of individuals and businesses using our website and software platform.",
      "This Privacy Policy explains how we collect, use, disclose, retain, protect, and otherwise process personal information in connection with EquipmentAI.",
      "EquipmentAI provides business management software primarily for Canadian equipment contractors. We are committed to handling personal information responsibly and in accordance with applicable Canadian privacy legislation, including British Columbia's Personal Information Protection Act and the federal Personal Information Protection and Electronic Documents Act where applicable. Other provincial privacy legislation may apply depending on the circumstances.",
      "This Policy applies to our website, account registration process, software platform, support interactions, and related services.",
    ],
  },
  {
    heading: "2. Our Role in Handling Information",
    paragraphs: [
      "EquipmentAI may process information in two primary capacities.",
      "Account and business administration: EquipmentAI determines how certain personal information is used to operate accounts, provide support, administer subscriptions, protect security, and manage its business.",
      "Customer-controlled business records: Customers may upload personal information about their employees, representatives, clients, or other contacts. EquipmentAI processes this information to provide the services requested by the Customer.",
      "Customers are responsible for having appropriate authority to collect and provide information about other individuals. EquipmentAI remains responsible for its own applicable privacy obligations and for appropriate protection of information under its control.",
    ],
  },
  {
    heading: "3. Information We Collect",
    paragraphs: [
      "Depending on how you use the Service, we may collect the following categories of information.",
      "Account information: names and business names, business email addresses, telephone numbers, account usernames and identifiers, authentication information, account status and subscription information, and records of agreement acceptance.",
      "Business and operational information: equipment and attachment records, equipment rates and usage hours, maintenance schedules and service history, job descriptions, locations, and schedules, customer and supplier contact details, quotes, invoices, and payment records, uploaded documents and photographs, and business settings and preferences.",
      "Technical and security information: IP addresses, device and browser information, authentication and session records, access timestamps, security events and diagnostic logs, and information necessary to investigate technical problems.",
      "Billing information: if paid subscriptions are available, we may collect subscription details, transaction identifiers, billing contact information, payment status, and applicable tax information. Where a third-party payment processor handles payment credentials, its collection and handling of those credentials will be governed by its own terms and privacy notices.",
      "Implementation verification required: the actual payment provider and whether EquipmentAI receives, stores, or can access payment card details must be confirmed before publication.",
      "Communications: we may collect information contained in support requests, account inquiries, feedback, and communications with our team.",
    ],
  },
  {
    heading: "4. How We Collect Information",
    paragraphs: [
      "Information may be collected directly when you register or use the Service, when a Customer or authorized user uploads business records, automatically through necessary technical operations, through authorized third-party service providers, and when you contact EquipmentAI for assistance.",
      "We limit collection to information reasonably necessary for identified, legitimate purposes.",
    ],
  },
  {
    heading: "5. How We Use Information",
    paragraphs: [
      "We may use information to create and administer accounts, verify registration information and manage account approvals, provide equipment, job, customer, quote, invoice, and maintenance features, process authorized subscriptions and payments, deliver requested emails and notifications, provide customer support, diagnose errors and maintain system performance, detect fraud, unauthorized access, and security threats, meet applicable legal and accounting requirements, improve the Service using information we are legally permitted to process for that purpose, communicate material changes to the Service or our policies, and send marketing communications where permitted by law and subject to applicable consent and unsubscribe requirements.",
      "We will not use personal information for materially unrelated purposes without an appropriate legal basis and any required notice or consent.",
    ],
  },
  {
    heading: "6. Consent and Privacy Choices",
    paragraphs: [
      "Where consent is required, EquipmentAI will seek meaningful consent appropriate to the sensitivity of the information and the purposes of processing.",
      "We will not make consent to optional marketing a condition of obtaining the core Service.",
      "Users may withdraw consent where permitted by law, subject to legal or contractual restrictions and reasonable notice. Withdrawal may affect features that depend on the relevant information.",
      "Acknowledging this Privacy Policy during registration does not automatically authorize promotional email or text messaging.",
    ],
  },
  {
    heading: "7. Customer Information Entered Into the Platform",
    paragraphs: [
      "Customers may enter personal information concerning their own clients, employees, contractors, or business contacts.",
      "Customers must ensure they have the necessary legal authority to collect and use that information and provide it to EquipmentAI.",
      "EquipmentAI will use Customer-controlled information for authorized Service purposes, subject to applicable law. EquipmentAI will not independently market to a Customer's uploaded contacts merely because those contacts appear in the Customer's account.",
      "We will not disclose one Customer's business records to another Customer except where lawfully authorized or required by law.",
    ],
  },
  {
    heading: "8. Sharing and Disclosure",
    paragraphs: [
      "EquipmentAI may disclose information to service providers where reasonably necessary to operate the Service. Such providers may include cloud hosting and database providers, authentication and security providers, email delivery providers, payment processors, storage and backup providers, customer support or technical service providers, and optional integrations enabled by Customers.",
      "We will take reasonable steps to require service providers to protect information and process it only for authorized purposes.",
      "We may also disclose information with the Customer's authorization, where required by applicable law or valid legal process, to investigate fraud or serious security incidents, in connection with a legitimate corporate transaction subject to applicable legal protections, or where otherwise lawfully permitted.",
      "Before publication, EquipmentAI must identify its actual service providers and material processing arrangements.",
    ],
  },
  {
    heading: "9. Data Storage and International Processing",
    paragraphs: [
      "EquipmentAI uses cloud-based infrastructure and may engage providers that store or process information in Canada or other countries.",
      "The actual hosting regions, backup locations, and international processing arrangements must be verified before publication.",
      "Where information is processed outside Canada, it may be subject to the laws and lawful access requirements of the jurisdiction in which it is processed.",
      "EquipmentAI will apply safeguards appropriate to the sensitivity of the information and its legal obligations. We will provide further details regarding material cross-border processing arrangements where required by law.",
    ],
  },
  {
    heading: "10. Data Security",
    paragraphs: [
      "EquipmentAI is committed to maintaining safeguards appropriate to the sensitivity of the information it handles.",
      "Depending on the system and verified implementation, these may include access controls, authenticated sessions, protected communications, role-based permissions, logging, backups, and monitoring.",
      "We will periodically assess security risks and take reasonable steps to address identified vulnerabilities. No online service can guarantee absolute protection against unauthorized access, system failure, or cyberattacks.",
      "Customers are responsible for maintaining secure passwords, protecting account credentials, and appropriately managing their authorized users.",
      "Security claims must be verified against the deployed system before publication.",
    ],
  },
  {
    heading: "11. Data Retention",
    paragraphs: [
      "EquipmentAI retains personal information only for as long as reasonably necessary for the purposes for which it was collected, or as otherwise permitted or required by applicable law.",
      "Retention periods may differ for active account records, Customer business records, subscription and tax records, security logs, support communications, backups, and legal and compliance records.",
      "When information is no longer required, EquipmentAI will securely delete, anonymize, or otherwise dispose of it as appropriate.",
      "Publication requirement: EquipmentAI must establish and document its actual retention periods, deletion procedures, and backup lifecycle before representing any specific deletion deadline to Customers.",
    ],
  },
  {
    heading: "12. Account Closure and Deletion Requests",
    paragraphs: [
      "Customers may request account closure and deletion of eligible information by contacting EquipmentAI. We will review and respond to requests in accordance with applicable law.",
      "Certain information may need to be retained for legal, financial, security, or dispute-resolution purposes. Information in backups may remain temporarily until the applicable backup lifecycle expires, subject to appropriate safeguards.",
      "Account cancellation does not necessarily result in immediate deletion of every record.",
    ],
  },
  {
    heading: "13. Access, Correction, and Individual Rights",
    paragraphs: [
      "Subject to applicable law, individuals may request information about personal information held about them, access to eligible personal information, correction of inaccurate or incomplete information, withdrawal of consent where permitted, information about relevant privacy practices, and deletion or other rights where provided by applicable law.",
      "We may need to verify identity before processing a request. Where information is controlled by a Customer, we may direct the individual to that Customer or coordinate with the Customer as appropriate.",
      "Requests may be subject to lawful exceptions, including protection of other individuals' information and legally required retention.",
    ],
  },
  {
    heading: "14. Cookies and Similar Technologies",
    paragraphs: [
      "EquipmentAI may use cookies or comparable technologies necessary for authentication, session management, security, and platform operation.",
      "Any optional analytics, advertising, or tracking technologies must be disclosed accurately and handled in accordance with applicable privacy requirements. Where legally required, we will provide appropriate notice and consent controls.",
      "Implementation verification required: a complete cookie and tracking inventory must be completed before publication.",
    ],
  },
  {
    heading: "15. Marketing Communications",
    paragraphs: [
      "EquipmentAI may communicate with prospective and existing customers about its services where permitted by applicable law.",
      "Commercial electronic messages will be handled in accordance with Canada's Anti-Spam Legislation and other applicable requirements. Where required, we will obtain appropriate consent, provide sender identification, and offer a functioning unsubscribe mechanism.",
      "Users may withdraw marketing consent without losing access to core account functions. Necessary transactional or service-related communications may continue where legally permitted.",
    ],
  },
  {
    heading: "16. Automated Processing and Artificial Intelligence",
    paragraphs: [
      "EquipmentAI may use automated calculations and workflows to provide features such as invoice preparation, reminders, scheduling assistance, and reporting.",
      "If artificial intelligence functionality is introduced or expanded, EquipmentAI will disclose material processing practices where required.",
      "Identifiable Customer Data will not be used to train general-purpose artificial intelligence models without a separate lawful basis and any required notice or consent.",
      "Where external AI service providers process Customer Data, EquipmentAI will assess the privacy and security implications and provide appropriate disclosures. Automated outputs should be reviewed before being relied upon for significant business decisions.",
    ],
  },
  {
    heading: "17. Privacy and Security Incidents",
    paragraphs: [
      "EquipmentAI will investigate suspected unauthorized access, loss, disclosure, or misuse of personal information.",
      "We will take reasonable steps to contain incidents, assess potential harm, and remediate identified issues.",
      "Where applicable law requires notification to affected individuals or regulators, EquipmentAI will provide notifications in accordance with those requirements.",
      "We will maintain required incident records and cooperate with lawful regulatory processes.",
    ],
  },
  {
    heading: "18. Children's Privacy",
    paragraphs: [
      "EquipmentAI is intended for business use by adults. We do not knowingly solicit accounts from children.",
      "If we become aware that personal information has been collected from a child without the required legal authority or consent, we will take appropriate steps consistent with applicable law.",
    ],
  },
  {
    heading: "19. Third-Party Websites and Integrations",
    paragraphs: [
      "The Service may contain links to external websites or optional integrations. Those services may operate under their own privacy policies.",
      "EquipmentAI is not responsible for independent third-party privacy practices, except to the extent EquipmentAI has obligations under applicable law or contract.",
      "Customers should review third-party terms before enabling optional integrations.",
    ],
  },
  {
    heading: "20. Changes to This Policy",
    paragraphs: [
      "EquipmentAI may update this Privacy Policy to reflect changes in law, technology, security, or business practices.",
      "We will publish the revised Policy with an updated effective date and version number. Where changes materially affect the handling of personal information, we will provide appropriate notice and obtain any additional consent required by law.",
      "Previous versions and acceptance records will be retained where reasonably necessary for accountability and legal compliance.",
    ],
  },
  {
    heading: "21. Privacy Complaints",
    paragraphs: [
      "Individuals may contact EquipmentAI with questions or complaints about our privacy practices. We will review privacy complaints and respond in accordance with applicable law.",
      "Individuals may also have the right to complain to the Office of the Information and Privacy Commissioner for British Columbia, the Office of the Privacy Commissioner of Canada, or another applicable regulator.",
    ],
  },
  {
    heading: "22. Contact Our Privacy Officer",
    paragraphs: [
      "EquipmentAI",
      "Legal Operator: [FULL LEGAL BUSINESS NAME]",
      "Privacy Officer: [NAME OR DESIGNATED ROLE]",
      "Email: [PRIVACY EMAIL ADDRESS]",
      "Mailing Address: [BUSINESS MAILING ADDRESS]",
      "Website: https://equipmentai.ca",
    ],
  },
];

export function agreementDecision(agreed: unknown) {
  if (agreed !== true) {
    return { ok: false as const, error: "You must agree to the Terms of Service and acknowledge the Privacy Policy." };
  }
  return { ok: true as const };
}
