export function isConfiguredOwner(userId: string | null | undefined) {
  const ownerId = process.env.OWNER_USER_ID?.trim();
  if (!ownerId || !userId) return false;
  return userId === ownerId;
}
