export const RECOVERY_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export const isRecoveryTokenExpired = (createdAt) =>
  !createdAt || Date.now() - new Date(createdAt).getTime() >= RECOVERY_TOKEN_TTL_MS;
