/**
 * Public website copy (FR-SITE-2101). English is the source; a Nepali dictionary will mirror these
 * keys. Unknown company details are `null` and render as "to be announced" — never as placeholders.
 */

export type Status = 'in-development' | 'coming-soon' | 'future' | 'long-horizon';

export const company = {
  name: 'Oxinov',
  legalName: 'Oxinov Pvt. Ltd.',
  locality: 'Mahalaxmi Municipality, Ward 6, Lalitpur, Nepal',
  // Zoho Mail mailboxes (devops/terraform/environments/production/edge/mail.tf).
  email: 'support@oxinov.com' as string | null,
  securityEmail: 'security@oxinov.com' as string | null,
  legalEmail: 'legal@oxinov.com' as string | null,
  billingEmail: 'billing@oxinov.com' as string | null,
  // Owner to supply before launch (see frontend/company-web/README.md).
  careersEmail: null as string | null,
  phone: null as string | null,
  streetAddress: null as string | null,
  officeHours: null as string | null,
  registrationNumber: null as string | null,
};

export const home = {
  headline: 'Technology built in Nepal, for real needs',
  subheadline:
    'Oxinov builds software, services, and research across ten divisions. We start with learning, then grow one tested product at a time.',
  values: [
    { title: 'One Oxinov account', body: 'Sign in once and reach each Oxinov product as it launches.' },
    { title: 'Built on research', body: 'We test every product with real users before release.' },
    { title: 'Clear about status', body: 'We say what is in development and what is planned.' },
  ],
  primaryCta: 'Explore our products',
  secondaryCta: 'See our divisions',
};

export const about = {
  paragraphs: [
    'Oxinov Pvt. Ltd. is a technology company registered in Lalitpur, Nepal. We build digital products and services that solve practical problems for people, schools, and businesses.',
    'Our first product is Oxinov Edu, a learning platform now in development. It is designed for training providers who teach languages, IT, and exam preparation. Next, we plan three marketplace products for commodities, jobs, and local services.',
    'Our work is organised into ten divisions. They cover education, AI, engineering, services, robotics, media, agriculture, space, research, and production. Education is our current focus. The other divisions are future initiatives. We will open each one only when it has a clear customer need, an owner, and the approvals it requires.',
    'Every product shares one Oxinov account, so people sign in once. We research user needs before we build and test with real users before we launch.',
  ],
  mission: 'Build useful, trustworthy technology that solves real problems in Nepal and beyond.',
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
      'Oxinov AI will explore tools that help businesses work with their documents, data, and language. We are interested in AI that supports people rather than replacing their judgement. Plans include business chat tools, document question-and-answer, and models for Nepali language, speech, and vision. Any AI feature we build will be reviewed for privacy and safety before release.',
    focus: ['Document and business AI tools', 'Nepali language and speech models', 'Governed automation assistants'],
  },
  {
    slug: 'engineering',
    name: 'Oxinov Engineering',
    tagline: 'Software and cloud work for Nepali businesses.',
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
      'Oxinov Media & Studio will explore production services for animation, video, music, and podcasts. We also plan dubbing and subtitling in Nepali and other languages. A media asset tool could help clients store and receive their files. Any streaming or broadcasting service is subject to regulatory approval and will not be offered until approval exists.',
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

export interface Product {
  key: 'lms' | 'market' | 'jobs' | 'services';
  name: string;
  address: string;
  purpose: string;
  description: string;
  status: Status;
}

export const products: Product[] = [
  {
    key: 'lms',
    name: 'Oxinov Edu',
    address: 'edu.oxinov.com',
    purpose: 'One place to run courses, exams, and learners.',
    description:
      'Oxinov Edu helps training providers run their own branded learning platform. Instructors can publish recorded lessons, chapter practice, mock exams, and assignments. Administrators can manage learners, results, and enrolments. It is designed for subjects such as Japanese, Korean, English, and IT. Learners will use it on the web and on mobile apps.',
    status: 'in-development',
  },
  {
    key: 'market',
    name: 'Oxinov Commodity Market',
    address: 'market.oxinov.com',
    purpose: 'A verified marketplace for commodities and used equipment.',
    description:
      'Oxinov Commodity Market is planned as a marketplace for farm produce, raw materials, wholesale goods, and machinery. It will also cover second-hand equipment. Our aim is to give buyers and sellers verified listings, clear condition grading, and more open pricing. We are designing it to reduce the risk that comes with trading through long chains of middlemen.',
    status: 'coming-soon',
  },
  {
    key: 'jobs',
    name: 'Oxinov Jobs',
    address: 'jobs.oxinov.com',
    purpose: 'Connecting verified candidates with verified employers.',
    description:
      'Oxinov Jobs is planned to help employers in Nepal find skilled people, and help learners find relevant work. Candidates will build profiles with their skills and experience. Employers will post jobs and manage applications. Candidates can show verified Oxinov Edu certificates. Matching will be explainable, and a person will always make the hiring decision.',
    status: 'coming-soon',
  },
  {
    key: 'services',
    name: 'Oxinov Services Market',
    address: 'services.oxinov.com',
    purpose: 'Find and book verified local service providers.',
    description:
      'Oxinov Services Market is planned to help people and businesses find local help they can trust. Seekers will post a need or book a listed service. Providers will share their services, prices, and areas. After each booking, customers can leave a review. A report and dispute process will help resolve problems fairly.',
    status: 'coming-soon',
  },
];

export const statusLabel: Record<Status, string> = {
  'in-development': 'In development',
  'coming-soon': 'Coming soon',
  future: 'Future initiative',
  'long-horizon': 'Long-term initiative',
};

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
    'Oxinov is an early-stage company in Lalitpur, Nepal. We are building our first product and planning the next ones. We look for people who write clearly, test their work, and care about the people who use it.',
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
