// Search engine optimization for oxinov.com. Pages import from '@/seo' only; see README.md in this folder.
export * from './config';
export * from './routes';
export * from './metadata';
export { JsonLd } from './JsonLd';
export { organizationSchema, websiteSchema } from './schema/organization';
export { officeSchema } from './schema/office';
export { productPath, productSchema, productsSchema } from './schema/products';
export { divisionSchema, divisionsSchema } from './schema/divisions';
export { faqSchema } from './schema/faq';
export { breadcrumbSchema } from './schema/breadcrumbs';
