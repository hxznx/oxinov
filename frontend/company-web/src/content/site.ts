/**
 * Public website copy (FR-SITE-2101). English only (ADR-020): write plain English that browser
 * translation handles well. Unknown company details are `null` and render as "to be announced" — never as placeholders.
 */

export type Status = 'in-development' | 'coming-soon' | 'future' | 'long-horizon';

/** The one Oxinov account (sign-in, profile, product launcher). id.oxinov.com/ also redirects here. */
export const accountUrl = 'https://app.oxinov.com/';

export const company = {
  name: 'Oxinov',
  legalName: 'Oxinov Pvt. Ltd.',
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
};

export const about = {
  paragraphs: [
    'Oxinov Pvt. Ltd. is a technology company registered in Lalitpur, Nepal. We build digital products and services that solve practical problems for people, schools, and businesses.',
    'Our first product is Oxinov Edu, a learning platform now in development. It is designed for training providers who teach languages, IT, and exam preparation. Next, we plan three marketplace products for commodities, jobs, and local services.',
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
      'Education is our first division and our current focus. We are building Oxinov Edu, a platform where training providers can run courses, exams, and assignments in one place. It supports language, IT, and exam preparation subjects. Over time, we plan to link learning to real opportunities through Oxinov Jobs, so learners can show verified skills to employers.',
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
  key: 'lms' | 'market' | 'jobs' | 'services';
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
    key: 'lms',
    slug: 'edu',
    name: 'Oxinov Edu',
    address: 'edu.oxinov.com',
    division: 'education',
    purpose: 'One place to run courses, exams, and learners.',
    description:
      'Oxinov Edu helps training providers run their own branded learning platform. Instructors can publish recorded lessons, chapter practice, mock exams, and assignments. Administrators can manage learners, results, and enrolments. It is designed for subjects such as Japanese, Korean, English, and IT. Learners will use it on the web and on mobile apps.',
    status: 'in-development',
    searchTitle: 'Oxinov Edu: online classroom and LMS for schools',
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
          'Oxinov Edu is an online classroom and learning management system (LMS). Schools and teachers use it to run courses, lessons, timed mock exams, and assignments in one place.',
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
    key: 'jobs',
    slug: 'jobs',
    name: 'Oxinov Jobs',
    address: 'jobs.oxinov.com',
    division: 'education',
    purpose: 'Connecting verified candidates with verified employers.',
    description:
      'Oxinov Jobs is planned to help employers find skilled people, and help learners find relevant work. Candidates will build profiles with their skills and experience. Employers will post jobs and manage applications. Candidates can show verified Oxinov Edu certificates. Matching will be explainable, and a person will always make the hiring decision.',
    status: 'coming-soon',
    searchTitle: 'Oxinov Jobs: verified jobs and skill matching',
    summary:
      'Oxinov Jobs is a planned jobs platform that connects verified candidates, including Oxinov Edu learners, with verified employers.',
    audience: ['Job seekers and learners', 'Employers and recruiters', 'Training providers placing graduates'],
    features: [
      { title: 'Skill profiles', body: 'Candidates build profiles with their skills and experience, and can show verified Oxinov Edu certificates.' },
      { title: 'Jobs and applications', body: 'Employers post jobs and manage applications in one place.' },
      { title: 'Explainable matching', body: 'Matches come with reasons, and a person always makes the hiring decision.' },
    ],
    faqs: [
      {
        question: 'How does Oxinov Jobs connect to Oxinov Edu?',
        answer: 'Learners will be able to show verified Oxinov Edu certificates on their Oxinov Jobs profile, so employers can trust the skills they list.',
      },
      {
        question: 'When will Oxinov Jobs launch?',
        answer: 'It is coming soon, after Oxinov Edu and Oxinov Commodity Market. No launch date is set yet.',
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
        answer: 'It is coming soon, after Oxinov Jobs. No launch date is set yet.',
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

/** Plan ladder from docs/company/SUBSCRIPTION-MODEL.md; prices are unapproved, so none are shown. */
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
