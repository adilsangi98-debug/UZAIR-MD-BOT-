/**
 * ChatGPT AI Command
 * COMMAND: .chatgpt
 * USAGE: .chatgpt <your question>
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── Box Design ───
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

module.exports = {
  name: 'chatgpt',
  aliases: ['gptai', 'gpt', 'ai5'],
  category: 'ai',
  description: '🧠 Chat with ChatGPT AI',
  usage: '.chatgpt <your question>',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;
    const query = args ? args.join(' ').trim() : '';

    if (!query) {
      return reply(makeBox('USAGE', '❌ Koi sawal likho!\n\n💡 Example:\n.chatgpt What is Islam?\n.chatgpt Python kya hai?'));
    }

    try {
      try { await react('🧠'); } catch (e) {}

      let result = null;

      // ─── API 1: apisaqib ───
      try {
        const res = await axios.get(
          `https://apisaqib.vercel.app/api/v1/1015?q=${encodeURIComponent(query)}`,
          { timeout: 30000 }
        );
        result =
          res.data?.result ||
          res.data?.answer ||
          res.data?.response ||
          res.data?.text ||
          res.data?.message ||
          (typeof res.data === 'string' ? res.data : null);
      } catch (e) {
        console.log('API1 failed:', e.message);
      }

      // ─── API 2: siputzx GPT ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://api.siputzx.my.id/api/ai/gpt3`,
            { params: { prompt: query }, timeout: 30000 }
          );
          result = res.data?.data || res.data?.result || null;
        } catch (e) {
          console.log('API2 failed:', e.message);
        }
      }

      // ─── API 3: PrinceTech AI ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://api.princetechn.com/api/ai/ai`,
            { params: { apikey: 'prince', q: query }, timeout: 30000 }
          );
          result = res.data?.result || null;
        } catch (e) {
          console.log('API3 failed:', e.message);
        }
      }

      // ─── API 4: BK9 AI ───
      if (!result) {
        try {
          const res = await axios.get(
            `https://api.bk9.fun/ai/gpt4`,
            { params: { q: query }, timeout: 30000 }
          );
          result = res.data?.BK9 || res.data?.result || res.data?.answer || null;
        } catch (e) {
          console.log('API4 failed:', e.message);
        }
      }

      if (!result) {
        return reply(makeBox('❌ AI ERROR', 'Koi bhi server response nahi de raha.\nThodi der baad try karo!'));
      }

      const aiResponse = `💬 *Sawal:*\n${query}\n\n🤖 *Jawab:*\n${result}`;
      await reply(makeBox('🧠 CHATGPT AI', aiResponse));

      try { await react('✅'); } catch (e) {}

    } catch (e) {
      console.error('ChatGPT Error:', e.message);
      await reply(makeBox('❌ ERROR', `${e.message}\n\nDobara try karo!`));
      try { await react('❌'); } catch (e) {}
    }
  }
};



