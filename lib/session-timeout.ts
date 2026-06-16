export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
export const SESSION_WARNING_MS = 2 * 60 * 1000;
export const SESSION_WARNING_AT_MS = INACTIVITY_TIMEOUT_MS - SESSION_WARNING_MS;

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
