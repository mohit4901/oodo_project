const LIMIT = 100; // max requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

const requestMap = new Map();

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!requestMap.has(ip)) {
    requestMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return next();
  }

  const rateData = requestMap.get(ip);

  if (now > rateData.resetTime) {
    // Reset window
    rateData.count = 1;
    rateData.resetTime = now + WINDOW_MS;
    return next();
  }

  rateData.count += 1;

  if (rateData.count > LIMIT) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.',
      data: null,
      errors: [
        {
          field: 'rate-limit',
          message: 'Rate limit exceeded'
        }
      ],
      pagination: null,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// Clean up stale IP records every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestMap.entries()) {
    if (now > data.resetTime) {
      requestMap.delete(ip);
    }
  }
}, 30 * 60 * 1000);
