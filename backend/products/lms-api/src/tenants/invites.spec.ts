import { generateInviteCode, normalizeInviteCode } from './invites.service';

describe('join codes', () => {
  it('generates 8-character codes without look-alike characters', () => {
    for (let i = 0; i < 200; i += 1) expect(generateInviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
    expect(generateInviteCode(() => 0)).toBe('AAAAAAAA');
    expect(generateInviteCode((max) => max - 1)).toBe('99999999');
  });

  it('accepts codes the way people type them and rejects anything else', () => {
    expect(normalizeInviteCode('k7px-9qmd')).toBe('K7PX9QMD');
    expect(normalizeInviteCode(' K7PX 9QMD ')).toBe('K7PX9QMD');
    expect(normalizeInviteCode('K7PX9QM')).toBeNull();
    expect(normalizeInviteCode('K7PX9QMO')).toBeNull(); // O is never issued
    expect(normalizeInviteCode("K7PX'; --")).toBeNull();
  });
});
