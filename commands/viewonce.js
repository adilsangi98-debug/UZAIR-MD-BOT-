// ============================================
//      BADSHAH MD BOT — COMMANDS/VIEWONCE.JS
//      ViewOnce Media Bypass
// ============================================

'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { toSmallCaps } = require('../utils/fonts');
const db = require('../database/db');

const vv = async (ctx) => {
  const { sock, msg, sender } = ctx;

  try {
    const message = msg.message || {};
    const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage || 
                   message.imageMessage?.contextInfo?.quotedMessage || 
                   message.videoMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return ctx.reply(`❌ *${toSmallCaps('reply to a view-once image/video/audio and type .vv')}*`);
    }

    // ViewOnce message unwrap
    const voContent = quoted.viewOnceMessageV2?.message ||
                      quoted.viewOnceMessage?.message ||
                      quoted.ephemeralMessage?.message ||
                      quoted;

    const imgMsg = voContent.imageMessage;
    const vidMsg = voContent.videoMessage;
    const audMsg = voContent.audioMessage;

    if (!imgMsg && !vidMsg && !audMsg) {
      return ctx.reply(`❌ *${toSmallCaps('no view-once media found')}!*`);
    }

    const mediaType = imgMsg ? 'image' : (vidMsg ? 'video' : 'audio');
    const mediaMsg  = imgMsg || vidMsg || audMsg;

    const stream = await downloadContentFromMessage(mediaMsg, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (!buffer || buffer.length < 500) {
      return ctx.reply(`❌ *${toSmallCaps('media expired or unavailable')}!*`);
    }

    // 🚀 FIX: Jisne command chali (sender), bot usi ke Inbox (IB) mein bhej dega
    const targetJid = sender;

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (mediaType === 'image') {
      await sock.sendMessage(targetJid, { image: buffer, caption: `👁️ *${toSmallCaps('view once bypassed')}*` });
    } else if (mediaType === 'video') {
      await sock.sendMessage(targetJid, { video: buffer, caption: `👁️ *${toSmallCaps('view once bypassed')}*`, mimetype: 'video/mp4' });
    } else if (mediaType === 'audio') {
      await sock.sendMessage(targetJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
    }

  } catch (err) {
    console.log('[VV ERROR]', err.message);
    await ctx.reply(`❌ *${toSmallCaps('failed')}!*\n_${toSmallCaps('reply to a view-once message')}_`);
  }
};

module.exports = { vv };