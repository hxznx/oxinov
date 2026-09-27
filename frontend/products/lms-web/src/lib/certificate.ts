/** Certificate IDs are shown in groups of four for reading aloud and typing (ABCD-EFGH-JKMN-PQRS). */
export function groupCode(code: string): string {
  return code.replace(/(.{4})(?!$)/g, '$1-');
}

/** LinkedIn's "Add licence or certification" link, prefilled from the certificate (FR-CERT-601). */
export function linkedInAddUrl(input: { courseTitle: string; schoolName: string; issuedAt: string; code: string; verifyUrl: string }): string {
  const issued = new Date(input.issuedAt);
  const url = new URL('https://www.linkedin.com/profile/add');
  url.search = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: input.courseTitle,
    organizationName: input.schoolName,
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    certUrl: input.verifyUrl,
    certId: groupCode(input.code),
  }).toString();
  return url.toString();
}
