/**
 * Meta AI Command
 * COMMAND: .meta
 * USAGE: .meta <your question>
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── Box Design ───
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

module.exports = {
  name: 'meta',
  aliases: ['metaai', 'metachat', 'ai4'],
  category: 'ai',
  description: '🌐 Chat with Meta AI',
  usage: '.meta <your question>',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;
    const query = args ? args.join(' ').trim() : '';

    if (!query) {
      return reply(makeBox('USAGE', '❌ Sawal likho!\n\n💡 Example:\n.meta Who is Mark Zuckerberg?\n.meta Python kya hai?'));
    }

    try {
      try { await react('🌐'); } catch (e) {}

      let result = null;

      // ─── API 1: apisaqib Meta AI ───
      try {
        const res = await axios.get(
          `https://apisaqib.vercel.app/api/v1/meta-ai?q=${encodeURIComponent(query)}`,
          { timeout: 30000 }
        );
        result = res.data?.result || res.data?.answer || res.data?.response || res.data?.text || null;
      } catch (e) {
        console.log('API1 failed:', e.message);
      }

      // ─── API 2: siputzx Meta AI ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://api.siputzx.my.id/api/ai/metaai`,
            { params: { query }, timeout: 30000 }
          );
          result = res.data?.data || res.data?.result || null;
        } catch (e) {
          console.log('API2 failed:', e.message);
        }
      }

      // ─── API 3: apisaqib ChatGPT fallback ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://apisaqib.vercel.app/api/v1/1015?q=${encodeURIComponent(query)}`,
            { timeout: 30000 }
          );
          result = res.data?.result || res.data?.answer || res.data?.response || null;
        } catch (e) {
          console.log('API3 failed:', e.message);
        }
      }

      // ─── API 4: princetechn fallback ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://api.princetechn.com/api/ai/ai`,
            { params: { apikey: 'prince', q: query }, timeout: 30000 }
          );
          result = res.data?.result || null;
        } catch (e) {
          console.log('API4 failed:', e.message);
        }
      }

      if (!result) {
        return reply(makeBox('❌ AI ERROR', 'Koi bhi server response nahi de raha.\nThodi der baad try karo!'));
      }

      const aiResponse = `💬 *Sawal:*\n${query}\n\n🤖 *Jawab:*\n${result}`;
      await reply(makeBox('🌐 META AI', aiResponse));

      try { await react('✅'); } catch (e) {}

    } catch (e) {
      console.error('Meta AI Error:', e.message);
      await reply(makeBox('❌ ERROR', `${e.message}\n\nDobara try karo!`));
      try { await react('❌'); } catch (e) {}
    }
  }
};


