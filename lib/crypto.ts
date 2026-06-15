function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importAesKey(keyBytes: Uint8Array, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(keyBytes),
    "AES-GCM",
    false,
    usages,
  );
}

export async function encryptMessage(message: string): Promise<{
  payload: string;
  key: string;
}> {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await importAesKey(keyBytes, ["encrypt"]);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(message),
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return {
    payload: bytesToBase64Url(combined),
    key: bytesToBase64Url(keyBytes),
  };
}

export async function decryptMessage(payload: string, key: string): Promise<string> {
  const keyBytes = base64UrlToBytes(key);
  const combined = base64UrlToBytes(payload);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const cryptoKey = await importAesKey(keyBytes, ["decrypt"]);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}
