// ============================================
//    UZAIR MD BOT — WEB PAIR SYSTEM
//    Website se pair code generate karo
// ============================================

'use strict';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');

const path    = require('path');
const fs      = require('fs');
const logger  = require('../utils/logger');
const config  = require('../config/config');

const pendingPairs = new Map();

async function generatePairCode(number) {
  const clean = number.replace(/[^0-9]/g, '');
  const sessionDir = path.join('./sessions', clean);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  // If already pending — return existing
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
      logger: { level: 'silent', child: () => ({ level: 'silent', info: ()=>{}, warn: ()=>{}, error: ()=>{}, debug: ()=>{}, trace: ()=>{}, fatal: ()=>{} }), info: ()=>{}, warn: ()=>{}, error: ()=>{}, debug: ()=>{}, trace: ()=>{}, fatal: ()=>{} },
    });

    sock.ev.on('creds.update', saveCreds);

    let resolved = false;

    // Request pair code
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(clean);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
        pendingPairs.set(clean, { code: formatted, sock });

        // Auto expire after 2 min
        setTimeout(() => {
          pendingPairs.delete(clean);
          try { sock.end(); } catch {}
        }, 120000);

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
    }, 2000);

    // On connected
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        logger.success(`✅ ${clean} connected via web pair!`);
        pendingPairs.delete(clean);

        // Load message handler
        try {
          const { handleMessage, setOwner } = require('../handlers/messageHandler');
          setOwner(sock, config.ownerNumber);
          sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
              try { await handleMessage(sock, msg); } catch {}
            }
          });
        } catch (e) {
          logger.error('Handler load error:', e.message);
        }
      }
    });

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { sock.end(); } catch {}
        reject(new Error('Timeout — try again'));
      }
    }, 60000);
  });
}

module.exports = { generatePairCode };
