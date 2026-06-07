'use strict';

const axios = require('axios');
const config = require('../config/config'); //

// Aapke bot ka signature box design style
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯`;
};

module.exports = {
  name: 'gemini', //
  aliases: ['geminiai', 'geminichat', 'ai2'], //
  category: 'ai', //
  description: '💎 Chat with Gemini AI', //
  usage: '.gemini <your question>', //

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra; //
    const query = args ? args.join(' ').trim() : ''; //
    
    // Check if query is provided
    if (!query) {
      const noQueryText = `❌ Please provide a question.\n\n💡 Example: .gemini What is coding?`;
      return reply(makeBox('USAGE', noQueryText));
    }

    try {
      try { await react('💎'); } catch (e) {} //
      
      let result;
      // Main API Request
      try {
        const baseUrl = config.apis?.geminiProxy?.baseUrl || 'https://ymd-ai.onrender.com'; //
        const res = await axios.get(`${baseUrl}/api/gemini`, { params: { q: query }, timeout: 30000 }); //
        result = res.data?.data; //
      } catch (e) {
        // Fallback to Prince API if main server fails
        const baseUrl = config.apis?.princetech?.baseUrl || 'https://api.princetechn.com/api'; //
        const apikey = config.apis?.princetech?.apiKey || 'prince'; //
        const res = await axios.get(`${baseUrl}/ai/ai`, { params: { apikey, q: query }, timeout: 30000 }); //
        result = res.data?.result; //
      }

      if (!result) {
        return reply(makeBox('AI ERROR', '❌ No response received from the AI servers.'));
      }

      // Format response beautifully inside your signature box layout
      const aiResponseContent = `💬 Q: ${query}\n\n🤖 ANSWER:\n${result}`;
      await reply(makeBox('GEMINI AI', aiResponseContent));
      
      try { await react('✅'); } catch (e) {} //
    } catch (e) {
      console.error(e); //
      await reply(makeBox('CRITICAL ERROR', `❌ Error: ${e.message}`)); //
      try { await react('❌'); } catch (e) {} //
    }
  }
};

