export function isAdminExpired(expiresAt: number | null, now = Math.floor(Date.now() / 1000)) {
  return expiresAt !== null && expiresAt <= now;
}
