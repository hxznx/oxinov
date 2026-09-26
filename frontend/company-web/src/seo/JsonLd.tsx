/**
 * Structured data for search engines (schema.org JSON-LD). The data comes only from our own content,
 * and `<` is escaped so no value can close the script element.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
