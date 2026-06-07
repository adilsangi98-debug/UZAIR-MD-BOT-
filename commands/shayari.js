/**
 * Shayari Command
 * COMMAND: .shayari
 * USAGE: .shayari or .shayari <type>
 * Made For UZAIR MD BOT
 */

'use strict';

const axios = require('axios');

// ─── Box Design ───
const makeBox = (title, content) => {
  return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── Local Shayari Collection (Fallback) ───
const shayariCollection = {
  sad: [
    "Dil ko sukoon nahi milta kisi baat se,\nTeri yaad aati hai har mulaqaat se.\nRoye hain hum akele raat bhar,\nKaun samjhe dard mera is baat se.",

    "Aankhon mein aansoo chhupa ke muskurata hoon,\nDard apna sab se chhupa ke jeeta hoon.\nLog kehte hain kitna khush rehta hai yeh,\nMai khud se bhi apna dard chhupata hoon.",

    "Woh mila tha mujhe ik khwaab ki tarah,\nAur bichhad gaya ik azaab ki tarah.\nAbhi tak yaad hai uski har baat mujhe,\nJo guzra woh tha ik kitaab ki tarah.",

    "Tanha baitha hoon is raat mein,\nKoi nahi mere saath is baat mein.\nDil dhoondta hai use har jagah,\nJo khud hi kho gaya mulaqaat mein."
  ],
  romantic: [
    "Teri aankhon mein jo jadoo hai,\nWoh kisi aur mein nahi milta.\nDil mera sirf tera hai,\nTujhse badhkar koi nahi milta.",

    "Chand sitare tere liye laata,\nAasman bhi tujhpe bikhar jaata.\nTu mili hai mujhe khuda ki den se,\nTujhe dekh ke dil mera sharma jaata.",

    "Teri muskaan pe dil haarne laga,\nTeri yaad mein khud ko paane laga.\nPehle akela tha main is duniya mein,\nTujhe dekh ke duniya banana laga.",

    "Ishq tera nasha ban gaya mujhe,\nTu hi meri dua ban gayi mujhe.\nJab se dekha hai tujhe pehli baar,\nZindagi mein teri wafa ban gayi mujhe."
  ],
  motivational: [
    "Haar ke baad bhi uthna seekh lo,\nGir ke phir se chalna seekh lo.\nZindagi imtihaan leti hai har kadam par,\nMushkilon mein bhi muskurana seekh lo.",

    "Toota hoon magar tuta nahi hoon,\nGira hoon magar chuta nahi hoon.\nHar raat ke baad sawera aata hai,\nMain haar ke bhi hara nahi hoon.",

    "Waqt badlega, halat badlegi,\nBand kismat ki qismat badlegi.\nSabr rakh aur koshish karta reh,\nEk din teri taqdeer badlegi.",

    "Mushkilein aati hain seekhane ke liye,\nDard milta hai pakne ke liye.\nJo uthta hai gir ke phir se woh,\nKamyab hota hai jeene ke liye."
  ],
  friendship: [
    "Dost wo hota hai jo dard baante,\nMusibat mein saath ho aur khushi baante.\nZindagi mein mil jaaye agar aisa koi,\nSamjho khuda ne tumhe har khushi baante.",

    "Yaarana hai mera tujhse aisa,\nJaise raat ka hai sitaron se waisa.\nTu hai to zindagi mein roshni hai,\nTere bina andhera hoga kaisa.",

    "Dost ki dosti ek niyamat hai,\nSacha dost milna ek karamat hai.\nJo saath de mushkil waqt mein,\nWoh insaan nahi woh ek rahmat hai."
  ]
};

const types = Object.keys(shayariCollection);

module.exports = {
  name: 'shayari',
  aliases: ['poetry', 'poem', 'sher'],
  category: 'fun',
  description: '📝 Urdu/Hindi Shayari bhejo',
  usage: '.shayari or .shayari sad/romantic/motivational/friendship',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;

    let type = args?.[0]?.toLowerCase()?.trim() || '';

    // Valid type check
    if (type && !types.includes(type)) {
      return reply(makeBox('USAGE', `❌ Galat type!\n\n✅ Available types:\n• sad\n• romantic\n• motivational\n• friendship\n\n💡 Example:\n.shayari sad\n.shayari romantic`));
    }

    // Random type agar koi specify na kare
    if (!type) {
      type = types[Math.floor(Math.random() * types.length)];
    }

    try {
      try { await react('📝'); } catch (e) {}

      let shayari = null;

      // ─── API 1: Shayari API ───
      try {
        const apiType = type === 'romantic' ? 'love' : type;
        const res = await axios.get(
          `https://api.samirxpikachu.workers.dev/shayari?type=${apiType}`,
          { timeout: 10000 }
        );
        const data = res.data;
        if (data?.shayari || data?.text || data?.data) {
          shayari = data?.shayari || data?.text || data?.data;
        }
      } catch (e) {
        console.log('Shayari API1 failed:', e.message);
      }

      // ─── API 2: Another Shayari API ───
      if (!shayari) {
        try {
          const res = await axios.get(
            `https://hindi-quotes.vercel.app/random/shayari`,
            { timeout: 10000 }
          );
          if (res.data?.quote || res.data?.text) {
            shayari = res.data?.quote || res.data?.text;
          }
        } catch (e) {
          console.log('Shayari API2 failed:', e.message);
        }
      }

      // ─── Fallback: Local Collection ───
      if (!shayari) {
        const collection = shayariCollection[type];
        shayari = collection[Math.floor(Math.random() * collection.length)];
      }

      // ─── Type Emoji ───
      const typeEmoji = {
        sad: '💔 Sad',
        romantic: '❤️ Romantic',
        motivational: '💪 Motivational',
        friendship: '🤝 Friendship'
      };

      const result = `${typeEmoji[type]} Shayari\n\n${shayari}\n\n✍️ UZAIR MD BOT`;

      await reply(makeBox('📝 SHAYARI', result));
      try { await react('❤️'); } catch (e) {}

    } catch (e) {
      console.error('Shayari Error:', e.message);
      await reply(makeBox('❌ ERROR', 'Shayari nahi aayi, dobara try karo!'));
      try { await react('❌'); } catch (e) {}
    }
  }
};



