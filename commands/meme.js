/**
 * Meme Command - Send random memes
 */

/**
 * Meme Command - Send random memes
 * Fixed By UZAIR — apisaqib API
 */

/**
 * Meme Command - Send random memes
 * Fixed By UZAIR — Multi API Fallback
 */

/**
 * Meme Command - Trending & Funny Memes
 * Fixed By UZAIR
 */

/**
 * Meme Command - Hindi/Urdu Funny Memes (AI Generated)
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── Box Design ───
const makeBox = (title, content) => {
  return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── Funny Hindi/Urdu Meme Templates ───
const MEME_TEMPLATES = [
  // Exam memes
  { setup: '📚 Teacher: Kal exam hai, ghar ja ke padho', punchline: '🛌 Main ghar ja ke: Netflix aur so gaya 😂' },
  { setup: '😤 Exam se ek raat pehle:', punchline: '🃏 "Allah pe bharosa hai, padhai ki zaroorat nahi" 😭' },
  { setup: '📝 Exam mein question: "Explain in detail"', punchline: '✏️ Main: Haan toh yeh hua... aur phir woh hua... bas 😅' },
  { setup: '🎓 Papa: Beta kitna padh liya?', punchline: '😇 Main: "Bahut zyada" (Phone haath mein tha poora din) 💀' },
  { setup: '⏰ Subah 3 baje padh raha hoon', punchline: '😴 Subah 3:01 baje: so gaya 💤' },

  // Roti/Ghar memes
  { setup: '🍳 Ammi: Khana khaya?', punchline: '😂 Main: Haan (Chips ka packet khaya tha) 🍟' },
  { setup: '🌙 Raat 12 baje bhook lagi', punchline: '🧟 Fridge ki taraf jaate waqt main:' + '\n│ "Kuch nahi hai" kehte hue sab kha liya 😭' },
  { setup: '😤 Ammi ne roti banane ko kaha', punchline: '🔥 Meri roti: Pizza jaisi shape, coal jaisi color 💀😂' },

  // Dost/Friendship memes
  { setup: '🤙 Dost: Bhai paisa de, kal wapas karunga', punchline: '⏳ 3 saal baad dost: "Woh paisa?" 😂 Konsa paisa? 😭' },
  { setup: '📱 Dost 2 minute mein aata hoon kehta hai', punchline: '🕐 2 ghante baad: "Bhai bas aa raha hoon" 💀' },
  { setup: '😎 Dost: Teri bhabhi se milwa', punchline: '🤣 Woh bhabhi: Meri sister nikli 😭😭' },

  // Sleep memes
  { setup: '⏰ Alarm: 6 baje', punchline: '😴 Main: 5 minute aur... \n│ (Agli baar uthta hoon: 11 baj gaye) 💀' },
  { setup: '🌙 "Aaj jaldi so jaunga"', punchline: '📱 Main raat 3 baje: Random videos dekh raha hoon 😂' },
  { setup: '😤 Nahi soonga raat bhar', punchline: '⚡ Light gai aur andhera hua:\n│ Seedha so gaya 3 second mein 😴💀' },

  // Pakistani/Desi memes
  { setup: '🇵🇰 Pakistan mein bijli gayi', punchline: '🕯️ Poora mohalla: "YAAR PHIR SE!" 😂\n│ Hum log expect hi nahi karte thi 💀' },
  { setup: '🚗 Karachi mein traffic jam', punchline: '⏰ Google Maps: "5 minute mein pahunch jaoge"\n│ Reality: 2 ghante baad bhi wahan hoon 😭' },
  { setup: '☕ Chai peene baitha hoon', punchline: '📺 4 ghante baad:\n│ 5th cup, drama still on, kuch kaam nahi hua 😂' },
  { setup: '💸 Month start: "Is baar save karunga"', punchline: '📅 Month end: Wallet mein cobwebs hain 😭💀' },
  { setup: '🛒 Bazaar gaya ek cheez lene', punchline: '🛍️ Wapas aya: 10 cheezein le aaya\n│ Woh ek cheez bhool gaya 😂' },

  // WhatsApp memes
  { setup: '📲 "Seen" kiya message, reply nahi kiya', punchline: '😂 Phir khud message kiya:\n│ "Bhai kahan ho?" 💀' },
  { setup: '👥 Family WhatsApp group mein koi photo bheja', punchline: '📸 Chachoo ne Good Morning sticker bheja\n│ Phir 50 "MashaAllah" replies 😭😂' },
  { setup: '🔕 "Main group mute karunga"', punchline: '📳 Phir bhi dekh raha hoon poora din 😂💀' },
];

// ─── Desi Reactions ───
const REACTIONS = ['😂💀', '🤣😭', '💀😂', '😭🤣', '😂🔥', '💀💀', '🤣🤣', '😂😂'];

module.exports = {
  name: 'meme',
  aliases: ['memes', 'funny', 'mazak', 'lol'],
  category: 'fun',
  description: '😂 Hindi/Urdu funny memes',
  usage: '.meme',

  async execute(sock, msg, args, extra) {
    const { from, reply, react } = extra;

    try {
      try { await react('⏳'); } catch (e) {}

      // Random meme pick karo
      const meme = MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];
      const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];

      // ─── Text meme format ───
      const memeText =
        `${meme.setup}\n` +
        `│\n` +
        `${meme.punchline}\n` +
        `│\n` +
        `│ ${reaction}`;

      const fullMsg =
        `╭─  😂 DESI MEME  ─╮\n` +
        `${memeText.split('\n').map(l => l.startsWith('│') ? l : `│ ${l}`).join('\n')}\n` +
        `╰──────────────╯\n\n` +
        `        *BY UZAIR*`;

      await reply(fullMsg);
      try { await react('😂'); } catch (e) {}

    } catch (error) {
      console.error('Meme Error:', error.message);
      await reply(makeBox('❌ ERROR', `${error.message}\n\nDobara try karo!`));
      try { await react('❌'); } catch (e) {}
    }
  }
};





