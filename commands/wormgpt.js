// ============================================
//      UZAIR  MD BOT — COMMANDS/WORMGPT.JS
//      WormGPT AI Command
// ============================================

'use strict';

const axios = require('axios');
const { toSmallCaps } = require('../utils/fonts');
const logger = require('../utils/logger');

const wormgpt = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const query = args.join(' ');

  if (!query) {
    return ctx.reply(
      `❌ *${toSmallCaps('provide a question')}!*\n\n` +
      `📌 *${toSmallCaps('usage')}:* .wormgpt <question>`
    );
  }

  // ✅ Typing animation — 2 seconds
  await sock.sendPresenceUpdate('composing', from);
  await new Promise(r => setTimeout(r, 2000));
  await sock.sendPresenceUpdate('paused', from);

  await react('🤖');

  try {
    const res = await axios.get(
      `https://apiskeith.top/ai/wormgpt?q=${encodeURIComponent(query)}`,
      { timeout: 30000 }
    );

    // API response — jo bhi text mile woh de do
    const reply =
      res.data?.result ||
      res.data?.response ||
      res.data?.answer ||
      res.data?.text ||
      res.data?.message ||
      (typeof res.data === 'string' ? res.data : null);

    if (!reply) {
      await react('❌');
      return ctx.reply(`❌ *${toSmallCaps('no response from wormgpt')}*`);
    }

    await react('✅');
    await sock.sendMessage(from, {
      text: `🤖 *${toSmallCaps('wormgpt')}*\n\n${reply}`
    }, { quoted: msg });

  } catch (err) {
    logger.error('wormgpt error:', err.message);
    await react('❌');

    const status = err.response?.status;
    let errMsg = `❌ *${toSmallCaps('something went wrong, try again later')}*`;

    if (status === 504 || status === 503) {
      errMsg = `⏱️ *${toSmallCaps('api timeout — thodi der baad try karo')}*`;
    } else if (err.code === 'ECONNABORTED') {
      errMsg = `❌ *${toSmallCaps('request timeout — server slow hai')}*`;
    }

    await ctx.reply(errMsg);
  }
};

module.exports = { wormgpt };
