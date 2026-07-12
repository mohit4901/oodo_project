import morgan from 'morgan';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    if (isProduction) {
      console.log(JSON.stringify({ level: 'info', message, meta, timestamp }));
    } else {
      console.log(`\x1b[32m[INFO]\x1b[0m [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  warn: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    if (isProduction) {
      console.log(JSON.stringify({ level: 'warn', message, meta, timestamp }));
    } else {
      console.warn(`\x1b[33m[WARN]\x1b[0m [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message, meta = '') => {
    const timestamp = new Date().toISOString();
    if (isProduction) {
      console.error(JSON.stringify({ level: 'error', message, meta, timestamp }));
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

// Morgan HTTP middleware configuration
export const httpLogger = morgan((tokens, req, res) => {
  const logMessage = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');

  if (res.statusCode >= 400) {
    logger.error(`HTTP Error: ${logMessage}`);
  } else {
    logger.info(`HTTP Request: ${logMessage}`);
  }
  return null; // Don't print to stdout directly from morgan to prevent double logs
});
