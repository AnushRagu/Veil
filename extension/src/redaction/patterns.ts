export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  pan: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  cvv: /\b\d{3,4}\b(?!\s?\d{4})/g,
  otp: /\b\d{6}\b/g,
  ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  apiKey: /\b(?:sk-[A-Za-z0-9]{32,}|[A-Za-z0-9_-]{32,})\b/g,
  jwt: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  url: /https?:\/\/[^\s]+/g,
};

export const PII_CATEGORY_MAP: Record<keyof typeof PII_PATTERNS, string> = {
  email: "email",
  phone: "phone",
  creditCard: "credit_card",
  aadhaar: "aadhaar",
  pan: "pan",
  ssn: "account_number",
  cvv: "cvv",
  otp: "otp",
  ipv4: "custom",
  url: "custom",
  apiKey: "custom",
  jwt: "custom",
};

export const SENSITIVE_AUTOCOMPLETE_VALUES = [
  "password",
  "new-password",
  "current-password",
  "one-time-code",
  "cc-number",
  "cc-csc",
  "cc-exp",
  "cc-name",
  "address-line1",
  "address-line2",
  "address-line3",
  "postal-code",
  "tel",
  "email",
];

export const SENSITIVE_INPUT_TYPES = ["password", "tel", "email"];

export const SENSITIVE_LABEL_KEYWORDS = [
  "password",
  "passwort",
  "contraseña",
  "mot de passe",
  "senha",
  "parola",
  "hasło",
  "пароль",
  "密码",
  "パスワード",
  "비밀번호",
  "credit card",
  "creditcard",
  "debit card",
  "card number",
  "cardnumber",
  "cvv",
  "cvc",
  "security code",
  "otp",
  "one-time",
  "verification code",
  "auth code",
  "aadhaar",
  "pan",
  "ssn",
  "social security",
  "account number",
  "routing number",
  "iban",
  "swift",
  "pin",
  "cvc2",
  "cvv2",
  "email",
  "e-mail",
  "phone",
  "mobile",
  "address",
  "street",
  "zip",
  "postal",
  "expiry",
  "expiration",
  "api key",
  "secret",
  "token",
  "profile photo",
  "profile image",
  "user photo",
];

export const EXPLICIT_SENSITIVE_ATTRS = [
  "data-sensitive",
  "data-private",
  "data-pii",
  "data-confidential",
];

export function detectPIICategory(text: string): { category: string; match: string } | null {
  for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return { category: PII_CATEGORY_MAP[category as keyof typeof PII_CATEGORY_MAP], match: matches[0] };
    }
  }
  return null;
}

export function findAllPII(text: string): Array<{ category: string; match: string; index: number }> {
  const results: Array<{ category: string; match: string; index: number }> = [];
  for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
    const regex = new RegExp(pattern);
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        category: PII_CATEGORY_MAP[category as keyof typeof PII_CATEGORY_MAP],
        match: match[0],
        index: match.index,
      });
    }
  }
  return results.sort((a, b) => a.index - b.index);
}

export function getReplacementToken(category: string): string {
  const tokens: Record<string, string> = {
    email: "[REDACTED_EMAIL]",
    phone: "[REDACTED_PHONE]",
    credit_card: "[REDACTED_CARD]",
    cvv: "[REDACTED_CVV]",
    aadhaar: "[REDACTED_AADHAAR]",
    pan: "[REDACTED_PAN]",
    account_number: "[REDACTED_ACCOUNT]",
    password: "[REDACTED_PASSWORD]",
    otp: "[REDACTED_OTP]",
    address: "[REDACTED_ADDRESS]",
    face: "[REDACTED_FACE]",
    explicit_sensitive: "[REDACTED_SENSITIVE]",
    custom: "[REDACTED]",
  };
  return tokens[category] || "[REDACTED]";
}