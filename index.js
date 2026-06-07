// ============================================
//         UZAIR MD BOT — INDEX.JS
//         Website Pair System
//         Developer: UZAIR
// ============================================

'use strict';

const fs      = require('fs');
const path    = require('path');
const express = require('express');
const config  = require('./config/config');
const logger  = require('./utils/logger');

// Banner
logger.banner();

// Directories
const dirs = ['./sessions', './database', './assets', './logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Anti-Crash
process.on('uncaughtException',  (err) => logger.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason?.message || reason));

// Restore Sessions
const { restoreAllSessions } = require('./core/whatsapp');
(async () => {
  try {
    await restoreAllSessions(null);
    logger.success('All saved sessions restored.');
  } catch (err) {
    logger.error('Session restore error:', err.message);
  }
})();

// Express Web Server + Pair API
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/ping', (req, res) => res.send('pong'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pair Code API
app.get('/pair', async (req, res) => {
  try {
    const number = (req.query.number || req.query.phone || '').replace(/[^0-9]/g, '');
    if (!number || number.length < 10) {
      return res.json({ error: 'Valid number required with country code' });
    }

    const { generatePairCode } = require('./core/webPair');
    const code = await generatePairCode(number);
    res.json({ code });
  } catch (err) {
    logger.error('Pair error:', err.message);
    res.json({ error: err.message });
  }
});

// Session check API
app.get('/session', (req, res) => {
  const number = (req.query.number || '').replace(/[^0-9]/g, '');
  const sessionManager = require('./core/session');
  if (sessionManager.exists(number)) {
    res.json({ connected: true, number });
  } else {
    res.json({ connected: false });
  }
});

app.listen(config.port, () => {
  logger.success(`UZAIR MD BOT running on port ${config.port}`);
  logger.success(`Website: http://localhost:${config.port}`);
});

// Graceful Shutdown
process.on('SIGINT',  () => { logger.warn('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { logger.warn('Shutting down...'); process.exit(0); });
