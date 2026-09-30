/**
 * Public website copy (FR-SITE-2101). English only (ADR-020): write plain English that browser
 * translation handles well. Unknown company details are `null` and render as "to be announced" — never as placeholders.
 */

export type Status = 'in-development' | 'coming-soon' | 'future' | 'long-horizon';

/**
 * The one Oxinov account (sign-in, profile, product launcher). id.oxinov.com/ also redirects here.
 * This static site never handles tokens: its buttons open the account portal, the confidential Keycloak
 * client, which starts sign-in at id.oxinov.com (FR-ID-2202, FR-ID-2207). `next dev` reads
 * NEXT_PUBLIC_ACCOUNT_URL from .env.development.local to use a local portal; builds always use production.
 */
const accountBase = (
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ACCOUNT_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_ACCOUNT_URL
    : 'https://app.oxinov.com'
).replace(/\/+$/, '');
export const accountUrl = `${accountBase}/`;
export const signInUrl = `${accountBase}/auth/login`;
export const signUpUrl = `${accountBase}/auth/login?screen=signup`;

export const company = {
  name: 'Oxinov',
  legalName: 'Ox Inov Pvt. Ltd.',
  locality: 'Mahalaxmi Municipality, Ward 8, Lalitpur, Nepal',
  // Zoho Mail mailboxes (devops/terraform/environments/production/edge/mail.tf).
  email: 'support@oxinov.com' as string | null,
  securityEmail: 'security@oxinov.com' as string | null,
  legalEmail: 'legal@oxinov.com' as string | null,
  billingEmail: 'billing@oxinov.com' as string | null,
  // E.164 number, also reachable on WhatsApp and WeChat.
  phone: '+9779842572888' as string | null,
  phoneDisplay: '+977 984-2572888',
  officeHours: '24/7' as string | null,
  // Owner to supply before launch (see frontend/company-web/README.md).
  careersEmail: null as string | null,
  streetAddress: null as string | null,
  registrationNumber: null as string | null,
};

export const home = {
  headline: 'Technology built for real needs, everywhere',
  subheadline:
    'Oxinov builds software, services, and research across ten divisions. We start with learning, then grow one tested product at a time.',
  values: [
    { title: 'One Oxinov account', body: 'Sign in once and reach each Oxinov product as it launches.' },
    { title: 'Built on research', body: 'We test every product with real users before release.' },
    { title: 'Clear about status', body: 'We say what is in development and what is planned.' },
  ],
  primaryCta: 'Explore our products',
  secondaryCta: 'See our divisions',
  /** Button on the home page that opens the product people can use today. */
  productCta: 'Open Oxinov Edu',
  signUpCta: 'Create your Oxinov account',
  signInCta: 'Sign in',
  /** The one-account section (FR-ID-2202, FR-ID-2204, FR-ID-2207). Facts only: codes, no passwords. */
  account: {
    title: 'One Oxinov account for every product',
    intro:
      'Create your account once. Use it for Oxinov Edu today, and for each Oxinov product as it launches. There is no password to remember.',
    steps: [
      { title: 'Create your account', body: 'Enter your email address and name. We email you a link to confirm your address.' },
      { title: 'Sign in with a code', body: 'Each time you sign in, we email you a new code. It works once and expires after 10 minutes.' },
      { title: 'Open any product', body: 'Your account page lists the Oxinov products you can use. Sign in once and move between them.' },
    ],
    closingTitle: 'Ready to start?',
    closingBody: 'Creating an Oxinov account is free. Sign in if you already have one.',
  },
};

export const about = {
  paragraphs: [
    'Ox Inov Pvt. Ltd. is a technology company registered in Lalitpur, Nepal. We build digital products and services that solve practical problems for people, schools, and businesses.',
    'Our first product is Oxinov Edu, a learning platform now in development. Oxinov HR is the second product module, planned for verified recruitment, direct jobs, and applications. Commodity and local-service marketplaces remain future candidates.',
    'Our work is organised into ten divisions. They cover education, AI, engineering, services, robotics, media, agriculture, space, research, and production. Education is our current focus. The other divisions are future initiatives. We will open each one only when it has a clear customer need, an owner, and the approvals it requires.',
    'Every product shares one Oxinov account, so people sign in once. We research user needs before we build and test with real users before we launch.',
  ],
  mission: 'Build useful, trustworthy technology that solves real problems for people everywhere.',
  vision: 'A connected set of Oxinov products that people and organisations rely on every day.',
};

export interface Division {
  slug: string;
  name: string;
  tagline: string;
  status: Status;
  regulated?: boolean;
  description: string;
  focus: string[];
}

export const divisions: Division[] = [
  {
    slug: 'education',
    name: 'Oxinov Education',
    tagline: 'Learning tools for training providers and learners.',
    status: 'in-development',
    description:
      'Education is our first division and our current focus. We are building Oxinov Edu, a platform where training providers can run courses, exams, and assignments in one place. It supports language, IT, and exam preparation subjects. Over time, Oxinov HR will link learning to real opportunities, so learners can show verified skills to employers.',
    focus: ['Oxinov Edu learning platform', 'Mock exams and practice', 'Links between training and jobs'],
  },
  {
    slug: 'ai',
    name: 'Oxinov AI',
    tagline: 'Practical AI tools for businesses.',
    status: 'future',
    description:
      'Oxinov AI will explore tools that help businesses work with their documents, data, and language. We are interested in AI that supports people rather than replacing their judgement. Plans include business chat tools, document question-and-answer, and language, speech, and vision models, including for languages that current tools serve poorly. Any AI feature we build will be reviewed for privacy and safety before release.',
    focus: ['Document and business AI tools', 'Language and speech models', 'Governed automation assistants'],
  },
  {
    slug: 'engineering',
    name: 'Oxinov Engineering',
    tagline: 'Software and cloud work for businesses everywhere.',
    status: 'future',
    description:
      'Oxinov Engineering will offer software, cloud, and security work for organisations. We plan to help businesses run reliable systems and protect their data. Areas under consideration include business software such as ERP and CRM, cloud hosting support, and security reviews. Each area will start only after we confirm demand and complete any licensing review it needs.',
    focus: ['Business software for local companies', 'Cloud and hosting support', 'Security reviews and monitoring'],
  },
  {
    slug: 'services',
    name: 'Oxinov Services',
    tagline: 'Connecting people with trusted local help.',
    status: 'future',
    description:
      "Oxinov Services will make it easier to find and book local service providers. People often rely on word of mouth, with little verification or clear pricing. Our planned Oxinov Services Market aims to change that with verified providers, clear bookings, and reviews. This division will also cover client project support for Oxinov's own consulting work.",
    focus: ['Oxinov Services Market', 'Client project portal', 'Support and service requests'],
  },
  {
    slug: 'robotics',
    name: 'Oxinov Robotics & Automation',
    tagline: 'Connected devices and automation for industry and learning.',
    status: 'future',
    description:
      'Oxinov Robotics & Automation will explore how connected devices and automation can help factories, farms, and classrooms. We plan to build a shared device platform that collects sensor data and sends alerts. It could later support robotics kits linked to Oxinov Edu courses. Drone-related work, if pursued, is subject to regulatory approval.',
    focus: ['Device registry and sensor data', 'Factory monitoring dashboards', 'Educational robotics kits'],
  },
  {
    slug: 'studio',
    name: 'Oxinov Media & Studio',
    tagline: 'Production and localisation for education and culture.',
    status: 'future',
    description:
      'Oxinov Media & Studio will explore production services for animation, video, music, and podcasts. We also plan dubbing and subtitling in many languages. A media asset tool could help clients store and receive their files. Any streaming or broadcasting service is subject to regulatory approval and will not be offered until approval exists.',
    focus: ['Studio production projects', 'Dubbing and subtitling', 'Media file delivery for clients'],
  },
  {
    slug: 'agritech',
    name: 'Oxinov AgriTech',
    tagline: 'Better tools for farms and farm trade.',
    status: 'future',
    description:
      'Oxinov AgriTech will explore technology that helps farmers plan, grow, and sell. Farmers often face unclear prices and long supply chains. Our planned Oxinov Commodity Market is one answer. Later ideas include farm management tools, sensor-based irrigation, crop disease detection, and farm-to-market tracking. Each idea will be tested with farmers before we build it.',
    focus: ['Oxinov Commodity Market', 'Farm management tools', 'Crop and soil insights'],
  },
  {
    slug: 'space',
    name: 'Oxinov Space',
    tagline: 'Space data for agriculture, mapping, and learning.',
    status: 'long-horizon',
    regulated: true,
    description:
      'Oxinov Space is a long-term initiative. We are interested in how satellite imagery and map data can support agriculture, disaster response, and planning. We may also explore simulation software for education and research. Any work involving real satellites or ground stations requires government approval. We will not offer such services until approval exists.',
    focus: ['Earth observation data', 'Maps and geospatial analysis', 'Simulation for education and research'],
  },
  {
    slug: 'research',
    name: 'Oxinov Research',
    tagline: 'Careful research behind every product.',
    status: 'long-horizon',
    description:
      'Oxinov Research supports every other division. We study user needs and test uncertain ideas before they become products. Each research project has an owner, a clear question, a time limit, and a decision at the end. In the future, we plan to publish reports and explore programmes that support new ideas and young innovators.',
    focus: ['User and product research', 'Technical reports and publications', 'Innovation programmes'],
  },
  {
    slug: 'production',
    name: 'Oxinov Production',
    tagline: 'Hardware and trade to support our products.',
    status: 'long-horizon',
    regulated: true,
    description:
      'Oxinov Production is a long-term initiative. We plan to explore making and selling electronics, connected devices, and learning kits that support our other divisions. After-sales care, such as repairs and warranty tracking, would be part of this work. Any import or export activity is subject to regulatory approval and will not be offered until approval exists.',
    focus: ['Electronics and device catalogue', 'Repairs and warranty support', 'Technology trade (subject to regulatory approval)'],
  },
];

export interface Question {
  question: string;
  answer: string;
}

export interface Product {
  key: 'edu' | 'market' | 'hr' | 'services';
  /** Page at oxinov.com/products/<slug>/. */
  slug: string;
  name: string;
  address: string;
  /** The division that owns the product (a slug from `divisions`). */
  division: string;
  purpose: string;
  description: string;
  status: Status;
  /** Page title in search results (60 characters or fewer, with the main keyword). */
  searchTitle: string;
  /** One or two sentences for search results (50–160 characters). */
  summary: string;
  audience: string[];
  /** Launched products list working features; coming-soon products list planned ones. */
  features: { title: string; body: string }[];
  /** Shown on the product page and published as FAQPage data. Facts only. */
  faqs: Question[];
}

export const products: Product[] = [
  {
    key: 'edu',
    slug: 'edu',
    name: 'Oxinov Edu',
    address: 'edu.oxinov.com',
    division: 'education',
    purpose: 'One place to run courses, exams, and learners.',
    description:
      'Oxinov Edu helps training providers run their own branded learning platform. Instructors can publish recorded lessons, chapter practice, mock exams, and assignments. Administrators can manage learners, results, and enrolments. It is designed for subjects such as Japanese, Korean, English, and IT. Learners will use it on the web and on mobile apps.',
    status: 'in-development',
    searchTitle: 'Oxinov Edu: online classroom and learning platform for schools',
    summary:
      'Oxinov Edu is an online classroom for schools and teachers: video lessons, timed mock exams, assignments, and class Q&A in one place.',
    audience: ['Language schools', 'IT and coding training centres', 'Exam preparation institutes', 'Independent teachers'],
    features: [
      {
        title: 'Courses and lessons',
        body: 'Build courses from chapters and lessons. Publish text, video, and audio lessons with playback speed, resume, and transcripts.',
      },
      {
        title: 'Timed practice and mock exams',
        body: 'Create quizzes with four question types and sections that draw random questions. Attempts save as learners work, submit when time runs out, and show results with answer review.',
      },
      {
        title: 'Assignments and grading',
        body: 'Learners hand in text, links, and files before a deadline. Teachers grade with feedback or ask for a revision.',
      },
      {
        title: 'Class stream and lesson Q&A',
        body: 'Post announcements to the class. Learners ask questions under each lesson, vote on answers, and see the best answer marked.',
      },
      {
        title: 'Notes, books, and resources',
        body: 'Learners keep private notes linked to video moments and download them. Teachers attach PDFs, EPUB books, Office files, images, and links to lessons.',
      },
      {
        title: 'Your own learning space',
        body: 'Each school gets its own space with a course catalogue. Invite learners with join codes and give administrators, teachers, and learners their own roles.',
      },
    ],
    faqs: [
      {
        question: 'What is Oxinov Edu?',
        answer:
          'Oxinov Edu is an online classroom and learning management system. Schools and teachers use it to run courses, lessons, timed mock exams, and assignments in one place.',
      },
      {
        question: 'Who is Oxinov Edu for?',
        answer:
          'It is designed for training providers anywhere in the world, such as language schools, IT training centres, exam preparation institutes, and independent teachers.',
      },
      {
        question: 'Can I run timed mock exams online?',
        answer:
          'Yes. Teachers set a time limit and build sections that draw random questions. Answers save automatically, the attempt submits when time runs out, and learners can review their answers.',
      },
      {
        question: 'Is Oxinov Edu available now?',
        answer:
          'Oxinov Edu is in development. Its core features already work at edu.oxinov.com, and we add more with each release. Mobile apps are planned.',
      },
      {
        question: 'How much does Oxinov Edu cost?',
        answer:
          'Prices are not published yet. Oxinov plans a Free plan with fair usage limits and paid plans for more. Prices will appear on the pricing page when they are set.',
      },
      {
        question: 'Do I need a separate account?',
        answer: 'No. You sign in with one Oxinov account, which will also work in every other Oxinov product as it launches.',
      },
    ],
  },
  {
    key: 'market',
    slug: 'commodity-market',
    name: 'Oxinov Commodity Market',
    address: 'market.oxinov.com',
    division: 'agritech',
    purpose: 'A verified marketplace for commodities and used equipment.',
    description:
      'Oxinov Commodity Market is planned as a marketplace for farm produce, raw materials, wholesale goods, and machinery. It will also cover second-hand equipment. Our aim is to give buyers and sellers verified listings, clear condition grading, and more open pricing. We are designing it to reduce the risk that comes with trading through long chains of middlemen.',
    status: 'coming-soon',
    searchTitle: 'Oxinov Commodity Market: verified commodity trading',
    summary:
      'Oxinov Commodity Market is a planned marketplace for farm produce, raw materials, machinery, and used equipment, with verified listings.',
    audience: ['Farmers and cooperatives', 'Wholesale buyers and traders', 'Sellers of machinery and used equipment'],
    features: [
      { title: 'Verified listings', body: 'Buyers and sellers are checked before they trade, so listings come from real people and businesses.' },
      { title: 'Clear condition grading', body: 'Used equipment and goods carry a stated condition grade, so buyers know what they are getting.' },
      { title: 'More open pricing', body: 'Prices are visible to both sides, reducing the risk of trading through long chains of middlemen.' },
    ],
    faqs: [
      {
        question: 'What will Oxinov Commodity Market sell?',
        answer: 'It is planned for farm produce, raw materials, wholesale goods, commercial machinery, and second-hand equipment.',
      },
      {
        question: 'When will Oxinov Commodity Market launch?',
        answer: 'It is coming soon. It is planned as the next Oxinov product after Oxinov Edu, and no launch date is set yet.',
      },
    ],
  },
  {
    key: 'hr',
    slug: 'hr',
    name: 'Oxinov HR',
    address: 'hr.oxinov.com',
    division: 'services',
    purpose: 'Verified recruitment, direct jobs, and applications in one product.',
    description:
      'Oxinov HR is planned as one product for two hiring paths. Companies can engage verified HR professionals and agencies to manage recruitment from CV to deployment, or publish jobs for candidates to apply directly. Candidates can show verified Oxinov Edu certificates. Matching will be explainable, consent will control candidate data, and a person will always make the hiring decision.',
    status: 'coming-soon',
    searchTitle: 'Oxinov HR: verified recruitment and direct hiring',
    summary:
      'Oxinov HR is a planned recruitment product connecting candidates, verified employers, and verified HR professionals.',
    audience: ['Job seekers and learners', 'Employers and hiring teams', 'HR professionals and recruitment agencies'],
    features: [
      { title: 'Verified HR network', body: 'Companies find identity-, credential-, and licence-verified HR professionals and agencies.' },
      { title: 'Managed or direct hiring', body: 'Use an HR professional from CV to deployment, or publish a job for direct applications.' },
      { title: 'Skills with consent', body: 'Candidates can show verified Edu certificates; matching is explained and candidate data is shared only with consent.' },
    ],
    faqs: [
      {
        question: 'How does Oxinov HR connect to Oxinov Edu?',
        answer: 'Learners will be able to show verified Oxinov Edu certificates on their Oxinov HR profile, so employers can trust the skills they list.',
      },
      {
        question: 'When will Oxinov HR launch?',
        answer: 'It is coming soon after its unified legal, safety, privacy, and operating release gate closes. No launch date is set yet.',
      },
    ],
  },
  {
    key: 'services',
    slug: 'services-market',
    name: 'Oxinov Services Market',
    address: 'services.oxinov.com',
    division: 'services',
    purpose: 'Find and book verified local service providers.',
    description:
      'Oxinov Services Market is planned to help people and businesses find local help they can trust. Seekers will post a need or book a listed service. Providers will share their services, prices, and areas. After each booking, customers can leave a review. A report and dispute process will help resolve problems fairly.',
    status: 'coming-soon',
    searchTitle: 'Oxinov Services Market: book verified local help',
    summary:
      'Oxinov Services Market is a planned app to find and book verified local service providers, with clear prices and genuine reviews.',
    audience: ['People who need local help', 'Businesses that hire service providers', 'Independent providers and small firms'],
    features: [
      { title: 'Post a need or book a service', body: 'Describe what you need, or book a listed service directly.' },
      { title: 'Verified providers', body: 'Providers share their services, prices, and areas, and are checked before they appear.' },
      { title: 'Reviews and fair disputes', body: 'Customers review each booking, and a report and dispute process helps resolve problems fairly.' },
    ],
    faqs: [
      {
        question: 'How will Oxinov Services Market check providers?',
        answer: 'Providers will be verified before they are listed, and only customers who made a booking can leave a review.',
      },
      {
        question: 'When will Oxinov Services Market launch?',
        answer: 'It is coming soon after Oxinov HR. No launch date is set yet.',
      },
    ],
  },
];

export const statusLabel: Record<Status, string> = {
  'in-development': 'In development',
  'coming-soon': 'Coming soon',
  future: 'Future initiative',
  'long-horizon': 'Long-term initiative',
};

/** Pricing questions, shown on /pricing/ and published as FAQPage data. Facts only; no prices until approved. */
export const pricingFaqs: Question[] = [
  {
    question: 'Is there a free plan?',
    answer: 'Yes. The Free plan will include the core features of every launched Oxinov product with fair usage limits. No card is required.',
  },
  {
    question: 'When will prices be published?',
    answer: 'Prices will be published on this page when the first Oxinov product opens, in US dollars and local currencies.',
  },
  {
    question: 'Do I pay separately for each product?',
    answer: 'No. Oxinov One is planned as one subscription that upgrades every launched product.',
  },
  {
    question: 'How are team and school plans priced?',
    answer: 'The Business plan is priced per seat and adds shared workspaces, an admin console, roles, invoices, and support. Enterprise plans are custom.',
  },
];

/** Plan ladder from docs/01-company/subscription-model.md; prices are unapproved, so none are shown. */
export const plans = [
  { name: 'Free', audience: 'Everyone with an Oxinov account', summary: 'Core features of every launched product with fair usage limits. No card required.' },
  { name: 'Plus', audience: 'People who use Oxinov regularly', summary: 'Higher limits and premium features across products through Oxinov One.' },
  { name: 'Pro', audience: 'Power users and professionals', summary: 'The highest individual limits, advanced features, and early access.' },
  { name: 'Business', audience: 'Teams and organisations', summary: 'Shared workspaces, an admin console, roles, invoices, and support, priced per seat.' },
  { name: 'Enterprise', audience: 'Institutions and government', summary: 'Custom limits, single sign-on, contracts, and dedicated support.' },
];

export const careers = {
  intro:
    'Oxinov is an early-stage company headquartered in Lalitpur, Nepal, building for people everywhere. We are building our first product and planning the next ones. We look for people who write clearly, test their work, and care about the people who use it.',
  skills: 'We expect to need skills in software engineering, design, user research, content, and operations. Open roles will be listed here when available.',
};

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
}

export const legalDocs: LegalDoc[] = [
  { slug: 'terms', title: 'Terms of Service', summary: 'The rules for using any Oxinov product with your Oxinov account.' },
  { slug: 'privacy', title: 'Privacy Policy', summary: 'What personal data Oxinov collects, why, how long we keep it, and your choices.' },
  { slug: 'acceptable-use', title: 'Acceptable Use and Community Policy', summary: 'Conduct that is not allowed on Oxinov products, and how we enforce it.' },
  { slug: 'cookies', title: 'Cookie Policy', summary: 'The cookies this website uses. Non-essential cookies stay off unless you opt in.' },
];

/**
 * Sign-in help at oxinov.com/help/sign-in/, linked from every sign-in page ("Trouble signing in?").
 * Customer accounts have no passwords (FR-ID-2204), so this page replaces "forgot password". Facts must match
 * devops/keycloak/configure-realm.sh: six-digit codes valid 10 minutes, email links valid 30 minutes, and a
 * temporary pause after 5 failed attempts (Keycloak waits up to 15 minutes).
 */
export const signInHelp = {
  intro:
    'Oxinov accounts do not use passwords. You sign in with your email address and a six-digit code that we email to you. If something goes wrong, the answers below usually fix it.',
  questions: [
    {
      question: 'I forgot my password. How do I reset it?',
      answer:
        'You do not need one. Oxinov accounts have no password to forget. Enter your email address on the sign-in page and we email you a six-digit code. Use that code to sign in.',
    },
    {
      question: 'The sign-in code did not arrive.',
      answer:
        'Wait a minute, then check your spam, junk, and promotions folders. Make sure the email address shown on the code screen is correct; if it is not, choose "Use a different email". Then choose "Send a new code". Adding no-reply@oxinov.com to your contacts helps future codes reach your inbox.',
    },
    {
      question: 'My code does not work.',
      answer:
        'Each code works once and expires after 10 minutes. If you asked for more than one code, use the one in the most recent email. If the code has expired, we send you a new one automatically.',
    },
    {
      question: 'It says there have been too many attempts.',
      answer:
        'After 5 wrong attempts we pause sign-in for your account for a short time to protect it. Wait up to 15 minutes, then try again with a new code.',
    },
    {
      question: 'We could not find an account with my email.',
      answer:
        'Check the spelling of your email address. If you have not used Oxinov before, choose "Create an account". One account works for every Oxinov product.',
    },
    {
      question: 'The confirmation link for my new account expired or did not arrive.',
      answer:
        'Confirmation links work once, for 30 minutes. Sign in with the same email address and choose "Send the link again" to get a new one. Check your spam and promotions folders too.',
    },
    {
      question: 'I got a code or link I did not ask for.',
      answer:
        'Ignore it. Nobody can sign in to your account without the code, and Oxinov will never ask you to share it. If you did share a code with someone, email security@oxinov.com straight away.',
    },
    {
      question: 'I can no longer use the email address on my account.',
      answer:
        'Email support@oxinov.com from any address with your name and the email address on your account. We confirm that the account is yours before we change anything, so this can take a little time.',
    },
    {
      question: 'Should I keep myself signed in?',
      answer:
        'Choose "Keep me signed in on this device" only on your own phone or computer. On a shared or public device, leave it off and sign out when you finish.',
    },
  ] as Question[],
};
