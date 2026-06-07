/**
 * Telegram/Number Info Command
 * COMMAND: .tginfo
 * USAGE: .tginfo <username OR number>
 */

/**
 * Telegram Username Info Command
 * COMMAND: .tginfo
 * Integration: RapidAPI Telegram Scraper
 */

'use strict';
const axios = require('axios');

module.exports = {
  name: 'tginfo',
  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;
    let username = args.join(' ').replace('@', '').trim();
    if (!username) return reply("❌ Username do!");

    await react('🔍');

    try {
      // Logic: Pehle Web Scraping try karo (sabse stable hai)
      const res = await axios.get(`https://t.me/${username}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const html = res.data;
      const name = html.match(/og:title" content="([^"]+)"/)?.[1] || "N/A";
      const desc = html.match(/og:description" content="([^"]+)"/)?.[1] || "N/A";
      const img = html.match(/og:image" content="([^"]+)"/)?.[1] || "";

      let resultText = `👤 *Name:* ${name}\n🔗 *Username:* @${username}\n📝 *Bio:* ${desc}`;
      
      await sock.sendMessage(extra.from, { 
        image: { url: img }, 
        caption: resultText 
      }, { quoted: msg });
      
      await react('✅');
    } catch (e) {
      reply("❌ Data nahi mila, ho sakta hai username galat ho.");
      await react('❌');
    }
  }
};




