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
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const path   = require('path');
const fs     = require('fs');
const pino   = require('pino');
const logger = require('../utils/logger');

const activePairs = new Map();

async function generatePairCode(number) {
  const clean = number.replace(/[^0-9]/g, '');

  // Already has code — return it
  if (activePairs.has(clean) && activePairs.get(clean).code) {
    return activePairs.get(clean).code;
  }

  // Clear old session — fresh start
  const sessionDir = path.join('./sessions', `web_${clean}`);
  try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
  fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise(async (resolve, reject) => {
    let resolved = false;
    let sock;

    const done = (result, error) => {
      if (resolved) return;
      resolved = true;
      if (error) reject(error);
      else resolve(result);
    };

    try {
      sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });

      sock.ev.on('creds.update', saveCreds);

      // Request pair code after 2 seconds
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(clean);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          activePairs.set(clean, { code: formatted, sock });
          logger.success(`Pair code: ${formatted} for ${clean}`);
          done(formatted);
        } catch (e) {
          done(null, new Error('Code generate nahi hua — dobara try karo'));
        }
      }, 2000);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          logger.success(`✅ ${clean} connected!`);
          activePairs.delete(clean);

          try {
            const { handleMessage, setOwner } = require('../handlers/messageHandler');
            setOwner(clean, clean);
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
              if (type !== 'notify') return;
              for (const msg of messages) {
                try { await handleMessage(sock, { messages: [msg], type }, clean); } catch {}
              }
            });
          } catch (e) {}
        }

        if (connection === 'close') {
          const reason = lastDisconnect?.error?.output?.statusCode;
          logger.warn(`Connection closed: ${clean}, reason: ${reason}`);

          if (reason === 515) {
            // Stream error — reconnect after 3s
            logger.info(`515 error — reconnecting ${clean}...`);
            setTimeout(async () => {
              activePairs.delete(clean);
              try { await generatePairCode(clean); } catch {}
            }, 3000);
          } else if (reason === DisconnectReason.loggedOut || reason === 401) {
            activePairs.delete(clean);
            try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
          } else {
            setTimeout(async () => {
              try { await generatePairCode(clean); } catch {}
            }, 5000);
          }
        }
      });

      // Timeout 90 seconds
      setTimeout(() => {
        done(null, new Error('Timeout — please try again'));
      }, 90000);

    } catch (e) {
      done(null, e);
    }
  });
}

module.exports = { generatePairCode };



