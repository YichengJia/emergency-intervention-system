/**
 * Simple wrapper around console.log for logging messages. This file can be
 * expanded in the future to integrate with more advanced logging frameworks
 * such as Winston or Bunyan.
 */
function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  if (meta) {
    console.log(`[${timestamp}] [${level}]`, message, meta);
  } else {
    console.log(`[${timestamp}] [${level}]`, message);
  }
}

module.exports = {
  log
};