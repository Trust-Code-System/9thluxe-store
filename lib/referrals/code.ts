// lib/referrals/code.ts
// PURE referral-code generation. Codes are short, uppercase, unambiguous (no O/0/I/1). Attribution
// and any reward payout are handled by services and stay behind the `referral_rewards` flag.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReferralCode(length = 7): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

/** Basic validity check for a user-supplied referral code. */
export function isValidReferralCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{5,12}$/.test(code.toUpperCase())
}
