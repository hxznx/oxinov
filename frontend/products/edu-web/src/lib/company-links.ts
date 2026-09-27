/** Links from a product back to the company website (oxinov.com): what the product is, legal terms, and help. */
export interface CompanyLink {
  label: string;
  href: string;
}

/** COMPANY_URL overrides the website address (for example in a local stack); production uses oxinov.com. */
export function companyUrl(value: string | undefined = process.env.COMPANY_URL): string {
  return (value || 'https://oxinov.com').replace(/\/+$/, '');
}

/**
 * Footer links for a product app. `product` is the slug of its page on the company website
 * (oxinov.com/products/<slug>/); the account portal passes none and links to the company home and products.
 */
export function companyLinks(product?: { slug: string; name: string }, base = companyUrl()): CompanyLink[] {
  const intro = product
    ? [{ label: `About ${product.name}`, href: `${base}/products/${product.slug}/` }]
    : [
        { label: 'About Oxinov', href: `${base}/` },
        { label: 'Products', href: `${base}/products/` },
      ];
  return [
    ...intro,
    { label: 'Terms', href: `${base}/legal/terms/` },
    { label: 'Privacy', href: `${base}/legal/privacy/` },
    { label: 'Help and contact', href: `${base}/contact/` },
  ];
}
