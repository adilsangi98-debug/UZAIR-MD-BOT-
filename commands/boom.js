/**
 * Boom Command - Unlimited message repeater
 * COMMAND: .boom <message,count[,number]>
 * EXAMPLE: .boom hello,100
 * EXAMPLE: .boom hey,500,923001234567
 * ⚠️ OWNER ONLY COMMAND
 */

'use strict';

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

function normalizeNumber(num) {
  return String(num || '').replace(/[^0-9]/g, '');
}

function toJid(num) {
  const n = normalizeNumber(num);
  return n ? `${n}@s.whatsapp.net` : null;
}

module.exports = {
  name: 'boom',
  aliases: ['repeat', 'spam', 'unlimited'],
  category: 'fun',
  description: 'Unlimited message repeater. Send multiple messages to any number.',
  usage: '.boom <message,count[,number]>\n📌 Example: .boom hello,100\n📌 Example: .boom hey,500,923001234567',

  ownerOnly: true,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(makeBox('BOOM COMMAND', `🔥 Unlimited Mode 🔥
┃
┃ • .boom hello,100 (100 times in current chat)
┃ • .boom hey,500,923027598023 (500 times to that number)
┃
┃ ⚠️ Warning: No limit! Use responsibly.
┃ ⏱️ Delay: 300ms between messages`));
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const num = parts[2] || '';

      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(makeBox('ERROR', `❌ Invalid format
┃
┃ Use: .boom message,count[,number]
┃ Example: .boom Hello,1000,923001234567
┃
┃ Count must be a positive number (unlimited)`));
      }

      let targetJid;
      if (num) {
        targetJid = toJid(num);
        if (!targetJid) {
          return extra.reply(makeBox('ERROR', `❌ Invalid number
┃ Use format: 923001234567 (with country code)`));
        }
      } else {
        targetJid = extra.from;
      }

      await extra.react('⏳');
      await extra.reply(makeBox('BOOM STARTED', `🚀 Starting boom!
┃ 📨 Sending: ${count} messages
┃ 🎯 Target: ${num ? '+' + num : 'current chat'}
┃ ⏱️ Delay: 300ms between messages`));

      let successCount = 0;
      let failCount = 0;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        try {
          await sock.sendMessage(targetJid, { text: message });
          successCount++;
          
          if ((i + 1) % 100 === 0) {
            await extra.reply(makeBox('PROGRESS', `📊 Progress: ${i + 1}/${count} messages sent`));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed to send message ${i + 1}:`, err);
          
          if (failCount > 10) {
            await extra.reply(makeBox('STOPPED', `❌ Stopped due to too many failures (${failCount})`));
            break;
          }
        }
        
        const delay = count > 500 ? 500 : (count > 200 ? 400 : 300);
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);

      await extra.react('✅');
      await extra.reply(makeBox('BOOM COMPLETE', `✅ Boom Complete!
┃
┃ 📨 Sent: ${successCount}/${count}
┃ ❌ Failed: ${failCount}
┃ ⏱️ Time: ${duration} seconds
┃ 🎯 Target: ${num ? '+' + num : 'Current chat'}`));
      
    } catch (error) {
      console.error('Boom command error:', error);
      await extra.reply(makeBox('ERROR', `❌ An error occurred: ${error.message}`));
      await extra.react('❌');
    }
  }
};