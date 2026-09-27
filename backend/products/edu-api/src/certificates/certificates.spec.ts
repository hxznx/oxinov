import { generateCertificateCode, normalizeCertificateCode } from './certificates.service';

describe('certificate codes', () => {
  it('are 16 characters from an alphabet without look-alikes', () => {
    for (let i = 0; i < 50; i += 1) expect(generateCertificateCode()).toMatch(/^[A-HJKMNP-Z2-9]{16}$/);
    expect(generateCertificateCode(() => 0)).toBe('AAAAAAAAAAAAAAAA');
  });

  it('accept the grouped display form and lower case, and nothing else', () => {
    expect(normalizeCertificateCode('abcd-efgh-jkmn-pqrs')).toBe('ABCDEFGHJKMNPQRS');
    expect(normalizeCertificateCode(' ABCD EFGH JKMN PQRS ')).toBe('ABCDEFGHJKMNPQRS');
    for (const bad of ['', 'ABCDEFGHJKMNPQR', 'ABCDEFGHJKMNPQRSX', 'ABCDEFGHJKMNPQR0', 'ABCDEFGHJKMNPQRI', "ABCDEFGHJKMNPQ';"]) {
      expect(normalizeCertificateCode(bad)).toBeNull();
    }
  });
});
