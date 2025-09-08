// backend/utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  writeLog(filename, content) {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, content);
  }

  info(message, meta) {
    const content = this.formatMessage('INFO', message, meta);
    console.log(content);
    this.writeLog('app.log', content);
  }

  error(message, error, meta) {
    const content = this.formatMessage('ERROR', message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
    console.error(content);
    this.writeLog('error.log', content);
  }

  warn(message, meta) {
    const content = this.formatMessage('WARN', message, meta);
    console.warn(content);
    this.writeLog('app.log', content);
  }

  debug(message, meta) {
    if (process.env.NODE_ENV === 'development') {
      const content = this.formatMessage('DEBUG', message, meta);
      console.log(content);
      this.writeLog('debug.log', content);
    }
  }

  access(req, res, responseTime) {
    const content = this.formatMessage('ACCESS', 'API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent']
    });
    this.writeLog('access.log', content);
  }
}

module.exports = new Logger();