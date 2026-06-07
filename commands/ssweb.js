/**
 * SSWeb - Screenshot Website Command
 * COMMAND: .ssweb <url>
 * EXAMPLE: .ssweb https://github.com
 */

'use strict';

const axios = require('axios');

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

// Screenshot API function
async function screenshotWebsite(url) {
  try {
    // Using multiple APIs for redundancy
    const apis = [
      `https://api.popcat.xyz/screenshot?url=${encodeURIComponent(url)}`,
      `https://image.thum.io/get/width/1920/crop/800/${encodeURIComponent(url)}`,
      `https://mini.s-shot.ru/1920x1080/PNG/?${encodeURIComponent(url)}`
    ];
    
    for (const api of apis) {
      try {
        const response = await axios.get(api, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.length > 1000) {
          return Buffer.from(response.data);
        }
      } catch (e) {
        console.log(`API failed: ${api}`);
        continue;
      }
    }
    
    throw new Error('All screenshot APIs failed');
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  }
}

module.exports = {
  name: 'ssweb',
  aliases: ['screenshot', 'ss', 'webss'],
  category: 'utility',
  description: 'Take a screenshot of a website',
  usage: '.ssweb <url>\n📌 Example: .ssweb https://github.com',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(makeBox('SCREENSHOT', `❌ Please provide a website URL!
┃
┃ 📌 Example: .ssweb https://github.com
┃ 📌 Example: .ssweb https://google.com`));
      }
      
      const url = args.join(' ');
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return extra.reply(makeBox('ERROR', `❌ Please provide a valid URL starting with http:// or https://`));
      }
      
      await extra.react('📸');
      
      await extra.reply(makeBox('SCREENSHOT', `📸 Taking screenshot of:
┃ 🔗 ${url}
┃ ⏳ Please wait...`));
      
      const screenshotBuffer = await screenshotWebsite(url);
      
      if (!screenshotBuffer || screenshotBuffer.length < 100) {
        throw new Error('Failed to capture screenshot');
      }
      
      await sock.sendMessage(extra.from, {
        image: screenshotBuffer,
        caption: makeBox('SCREENSHOT', `🔗 ${url}
┃ 📸 Screenshot captured successfully!`)
      }, { quoted: msg });
      
      await extra.react('✅');
      
    } catch (error) {
      console.error('SSWeb command error:', error);
      await extra.reply(makeBox('ERROR', `❌ Failed to screenshot website: ${error.message}
┃
┃ 💡 Tips:
┃ • Make sure the URL is accessible
┃ • Try a different website
┃ • Example: .ssweb https://google.com`));
      await extra.react('❌');
    }
  }
};