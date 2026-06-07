// ============================================
//    UZAIR MD BOT — WEB PAIR SYSTEM
//    Website se pair code generate karo
// ============================================

'use strict';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require('@whiskeysockets/baileys');

const path   = require('path');
const fs     = require('fs');
const logger = require('../utils/logger');
const config = require('../config/config');

const pendingPairs = new Map();

async function generatePairCode(number) {
  const clean = number.replace(/[^0-9]/g, '');
  const sessionDir = path.join('./sessions', `web_${clean}`);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  // Already pending — return existing code
  if (pendingPairs.has(clean)) {
    return pendingPairs.get(clean).code;
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise(async (resolve, reject) => {
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent', info:()=>{}, warn:()=>{}, error:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{} }),
        info:()=>{}, warn:()=>{}, error:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{}
      },
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    let resolved = false;

    // Request pair code after 1.5s
    setTimeout(async () => {
      try {
        if (sock.authState.creds.registered) {
          if (!resolved) {
            resolved = true;
            reject(new Error('Number already registered — try another number'));
          }
          return;
        }

        const code = await sock.requestPairingCode(clean);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
        
        pendingPairs.set(clean, { code: formatted, sock });

        // Auto cleanup after 3 min
        setTimeout(() => {
          pendingPairs.delete(clean);
          try { sock.end(); } catch {}
        }, 180000);

        if (!resolved) {
          resolved = true;
          resolve(formatted);
        }
      } catch (e) {
        if (!resolved) {
          resolved = true;
          reject(e);
        }
      }
    }, 1500);

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        logger.success(`✅ ${clean} paired successfully via website!`);
        pendingPairs.delete(clean);

        // Start message handler for this session
        try {
          const { handleMessage } = require('../handlers/messageHandler');
          sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
              try { await handleMessage(sock, msg); } catch (e) {}
            }
          });
          logger.success(`✅ Message handler started for ${clean}`);
        } catch (e) {
          logger.error('Handler error:', e.message);
        }
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        logger.warn(`Connection closed for ${clean}, reason: ${reason}`);

        // Reconnect if not logged out
        if (reason !== DisconnectReason.loggedOut && reason !== 401) {
          logger.info(`Reconnecting ${clean}...`);
          setTimeout(() => generatePairCode(clean), 3000);
        } else {
          // Clear session if logged out
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          } catch {}
          pendingPairs.delete(clean);
        }
      }
    });

    // Timeout after 60s
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { sock.end(); } catch {}
        reject(new Error('Timeout — please try again'));
      }
    }, 60000);
  });
}

module.exports = { generatePairCode };
