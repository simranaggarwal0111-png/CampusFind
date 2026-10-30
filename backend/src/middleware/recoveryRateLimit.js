const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestsByIp = new Map();

export const recoveryRateLimit = (req, res, next) => {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  let record = requestsByIp.get(ip);

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    requestsByIp.set(ip, record);
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      message: "Too many recovery submissions. Please try again later.",
    });
  }

  record.count += 1;
  if (requestsByIp.size > 10_000) {
    for (const [address, entry] of requestsByIp) {
      if (now >= entry.resetAt) requestsByIp.delete(address);
    }
  }

  return next();
};
