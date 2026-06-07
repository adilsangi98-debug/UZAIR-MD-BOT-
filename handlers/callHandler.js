// ============================================
//    UZAIR  MD BOT — HANDLERS/CALLHANDLER.JS
//    Incoming Call Handler
// ============================================

'use strict';

const config = require('../config/config');
const logger = require('../utils/logger');
const { toSmallCaps } = require('../utils/fonts');

/**
 * Handle incoming WhatsApp calls
 * @param {Object} sock
 * @param {Array}  calls
 * @param {string} botNum
 */
const handleCall = async (sock, calls, botNum) => {
  for (const call of calls) {
    try {
      const callerId = call.from;
      const callId   = call.id;
      const isVideo  = call.isVideo;

      logger.info(`Incoming ${isVideo ? 'video' : 'audio'} call from ${callerId}`);

      // ─── Reject call if enabled ──────────────
      if (config.behavior.rejectCalls) {
        await sock.rejectCall(callId, callerId);

        // Notify caller
        await sock.sendMessage(callerId, {
          text:
`📵 *Call Rejected!*

${toSmallCaps('AMMAR MD')} does not accept calls.

_Please use text or send a message instead._`,
        });

        logger.info(`Call rejected from: ${callerId}`);
      }

    } catch (err) {
      logger.error('Call handler error:', err.message);
    }
  }
};

module.exports = { handleCall };
