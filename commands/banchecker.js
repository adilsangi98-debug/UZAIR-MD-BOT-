/**
 * WhatsApp Ban Checker Command
 * COMMAND: .banchecker
 * USAGE: .banchecker <number>
 */

'use strict';

const axios = require('axios');

const makeBox = (title, content) => {
  return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

module.exports = {
  name: 'banchecker',
  aliases: ['bancheck', 'checkban', 'wacheck', 'isban'],
  category: 'utility',
  description: '🔍 Check karo koi number WhatsApp par ban hai ya nahi',
  usage: '.banchecker <number>',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;

    let number = args ? args.join('').trim() : '';
    if (!number) {
      return reply(makeBox('USAGE', '❌ Number do!\n\n💡 Example:\n.banchecker 923001234567'));
    }

    number = number.replace(/[^0-9]/g, '');
    if (number.startsWith('0')) number = '92' + number.substring(1);

    try {
      await react('🔍');
      await reply(makeBox('⏳ CHECKING', `🔍 Checking +${number}...`));

      // ─── BEHTAR LOGIC ───
      let isBanned = true; // Default maan lo ban hai
      try {
        const res = await axios.get(`https://wa.me/${number}`, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        // Agar "send_message" ya "phone_number" text mil jaye, toh active hai
        const html = res.data;
        if (html.includes('send_message') || html.includes('phone_number')) {
          isBanned = false;
        }
      } catch (e) {
        // Agar error 404 aaye toh iska matlab number exist nahi karta ya BANNED hai
        if (e.response && e.response.status === 404) {
          isBanned = true;
        }
      }

      if (isBanned) {
        await reply(makeBox('❌ STATUS', `📱 *Number:* +${number}\n\n🚫 *Result:* This number was FUCKED BY ALONE X UZAIR HACKER`));
        await react('🚫');
      } else {
        await reply(makeBox('✅ STATUS', `📱 *Number:* +${number}\n\n✅ *Result:* This number was safe`));
        await react('✅');
      }

    } catch (e) {
      await reply(makeBox('❌ ERROR', 'Kuch gadbad ho gayi!'));
      await react('❌');
    }
  }
};


