/**
 * QR Code Generator Plugin
 * COMMAND: .qr <url>
 * EXAMPLE: .qr https://google.com
 */

'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

module.exports = {
  name: 'qr',
  aliases: ['qrcode', 'generateqr', 'makeqr'],
  category: 'utility',
  description: 'Generate QR code from any link',
  usage: '.qr <url>\n📌 Example: .qr https://google.com',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length < 1) {
        return extra.reply(makeBox('QR GENERATOR', `📝 Usage: .qr <url>
┃
┃ 📌 Examples:
┃ • .qr https://google.com
┃ • .qr https://chat.whatsapp.com/invite/xxxx
┃ • .qr https://github.com`));
      }

      await extra.react('📱');

      let inputUrl = args.join(' ');
      
      if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        inputUrl = 'https://' + inputUrl;
      }
      
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(inputUrl)) {
        return extra.reply(makeBox('ERROR', `❌ Invalid URL!
┃
┃ 📌 Example: .qr https://google.com`));
      }

      if (inputUrl.length > 500) {
        return extra.reply(makeBox('ERROR', `❌ URL too long! Maximum 500 characters.`));
      }

      await extra.reply(makeBox('QR GENERATOR', `📱 Generating QR code...
┃ 🔗 Link: ${inputUrl}
┃ ⏳ Please wait.`));

      const encodedUrl = encodeURIComponent(inputUrl);
      const apiUrl = `https://r-gengpt-api.vercel.app/api/generate-qr?data=${encodedUrl}`;
      
      console.log('Generating QR for:', inputUrl);
      
      const response = await axios({
        method: 'get',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'AMMAR-MD-BOT/1.0',
          'Accept': 'image/png,image/jpeg,image/webp,*/*'
        }
      });

      if (!response.data || response.data.byteLength < 100) {
        throw new Error('QR code generation failed');
      }

      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp', { recursive: true });
      }
      
      const tempFile = `./temp/qr_${Date.now()}.png`;
      fs.writeFileSync(tempFile, Buffer.from(response.data));
      
      const stats = fs.statSync(tempFile);
      if (stats.size < 500) {
        fs.unlinkSync(tempFile);
        throw new Error('Generated QR code file is too small');
      }
      
      const caption = makeBox('QR CODE GENERATED', `🔗 Link: ${inputUrl}
┃ 📱 Scan to open`);

      await sock.sendMessage(extra.from, {
        image: { url: tempFile },
        caption: caption
      }, { quoted: msg });
      
      fs.unlinkSync(tempFile);
      await extra.react('✅');
      
    } catch (error) {
      console.error('QR Plugin Error:', error);
      
      let errorMessage = '❌ Failed to generate QR code!\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += '⏰ Timeout: Server took too long.';
      } else if (error.response?.status === 404) {
        errorMessage += '🔌 API Error: QR service unavailable.';
      } else if (error.response?.status === 400) {
        errorMessage += '📛 Invalid URL.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage += '🌐 Network Error: No internet connection.';
      } else {
        errorMessage += `📛 ${error.message}`;
      }
      
      await extra.reply(makeBox('ERROR', errorMessage));
      await extra.react('❌');
    }
  },
  
  async init(sock) {
    console.log('📱 QR Code Generator Plugin Loaded!');
    if (!fs.existsSync('./temp')) {
      fs.mkdirSync('./temp', { recursive: true });
    }
  }
};