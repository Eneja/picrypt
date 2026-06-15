import disposableDomains from "disposable-email-domains";

const extraBlockedDomains = [
  "tempmail.com",
  "throwaway.email",
  "mailinator.com",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "grr.la",
  "spam4.me",
  "trashmail.com",
  "getnada.com",
  "mintemail.com",
  "emailondeck.com",
  "fakeinbox.com",
  "maildrop.cc",
  "dispostable.com",
  "mailnesia.com",
  "temp-mail.org",
  "10minutemail.com",
];

const blockedDomains = new Set(
  [...disposableDomains, ...extraBlockedDomains].map((domain) => domain.toLowerCase()),
);

export function getEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return parts[1];
}

export function isBlockedEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) {
    return true;
  }

  if (blockedDomains.has(domain)) {
    return true;
  }

  const segments = domain.split(".");
  for (let index = 0; index < segments.length - 1; index += 1) {
    const parentDomain = segments.slice(index).join(".");
    if (blockedDomains.has(parentDomain)) {
      return true;
    }
  }

  return false;
}

export function validateEmailFormat(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validateSignupEmail(email: string): string | null {
  const formatError = validateEmailFormat(email);
  if (formatError) {
    return formatError;
  }

  const trimmed = email.trim().toLowerCase();

  if (isBlockedEmailDomain(trimmed)) {
    return "Temporary or disposable email addresses are not allowed. Use a permanent email.";
  }

  return null;
}
