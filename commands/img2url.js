/**
 * Image to URL Command
 * COMMAND: .img2url
 * USAGE: Image reply kar ke .img2url likho
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ─── Box Design ───
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── ImgBB Keys (multiple for fallback) ───
const IMGBB_KEYS = [
  '8db492efc937a635b90680a9a860dc85',
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', // backup slot
];

// ─── Upload to ImgBB ───
async function uploadToImgBB(buffer, keyIndex = 0) {
  if (keyIndex >= IMGBB_KEYS.length) return null;
  try {
    const form = new FormData();
    form.append('key', IMGBB_KEYS[keyIndex]);
    form.append('image', buffer.toString('base64'));
    form.append('name', `uzair_bot_${Date.now()}.jpg`);

    const res = await axios.post('https://api.imgbb.com/1/upload', form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    const url = res.data?.data?.url || res.data?.data?.display_url || null;
    if (!url) throw new Error('No URL returned');
    return url;
  } catch (e) {
    console.log(`ImgBB key ${keyIndex} failed:`, e.message);
    return await uploadToImgBB(buffer, keyIndex + 1);
  }
}

// ─── Upload to Catbox (free, no key needed) ───
async function uploadToCatbox(buffer) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, {
      filename: `image_${Date.now()}.jpg`,
      contentType: 'image/jpeg'
    });

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    const url = res.data?.trim();
    if (url && url.startsWith('https://')) return url;
    return null;
  } catch (e) {
    console.log('Catbox failed:', e.message);
    return null;
  }
}

// ─── Upload to Telegraph (free, no key needed) ───
async function uploadToTelegraph(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, {
      filename: `image_${Date.now()}.jpg`,
      contentType: 'image/jpeg'
    });

    const res = await axios.post('https://telegra.ph/upload', form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    const path = res.data?.[0]?.src;
    if (path) return `https://telegra.ph${path}`;
    return null;
  } catch (e) {
    console.log('Telegraph failed:', e.message);
    return null;
  }
}

// ─── Get Image Buffer from message ───
async function getImageBuffer(sock, msg) {
  try {
    // Replied image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
      return await downloadMediaMessage(
        { key: msg.key, message: quoted },
        'buffer', {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );
    }
    // Direct image
    if (msg.message?.imageMessage) {
      return await downloadMediaMessage(msg, 'buffer', {});
    }
    // ViewOnce image
    const viewOnce = msg.message?.viewOnceMessageV2?.message?.imageMessage;
    if (viewOnce) {
      return await downloadMediaMessage(
        { key: msg.key, message: { imageMessage: viewOnce } },
        'buffer', {}
      );
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'img2url',
  aliases: ['image2url', 'imgurl', 'uploadimg', 'imgbb'],
  category: 'utility',
  description: '🔗 Image ko URL mein convert karo',
  usage: '.img2url (image reply karo)',

  async execute(sock, msg, args, extra) {
    const { from, reply, react } = extra;

    try {
      try { await react('⏳'); } catch (e) {}

      // ─── Image Buffer lo ───
      const buffer = await getImageBuffer(sock, msg);
      if (!buffer) {
        return reply(makeBox('USAGE', '❌ Pehle koi image bhejo ya reply karo!\n\n💡 Example:\nImage bhejo aur caption mein .img2url likho\nYa kisi image pe reply kar ke .img2url likho'));
      }

      await reply(makeBox('⏳ UPLOADING', '📤 Image upload ho rahi hai...\nThoda wait karo!'));

      let imageUrl = null;
      let usedService = '';

      // ─── API 1: ImgBB ───
      imageUrl = await uploadToImgBB(buffer);
      if (imageUrl) usedService = 'ImgBB';

      // ─── API 2: Telegraph ───
      if (!imageUrl) {
        imageUrl = await uploadToTelegraph(buffer);
        if (imageUrl) usedService = 'Telegraph';
      }

      // ─── API 3: Catbox ───
      if (!imageUrl) {
        imageUrl = await uploadToCatbox(buffer);
        if (imageUrl) usedService = 'Catbox';
      }

      if (!imageUrl) {
        return reply(makeBox('❌ UPLOAD FAILED', 'Koi bhi server kaam nahi kar raha.\nThodi der baad try karo!'));
      }

      // ─── Result ───
      const resultText =
        `✅ *Upload Successful!*\n\n` +
        `🌐 *Service* : ${usedService}\n` +
        `🔗 *URL*     :\n${imageUrl}`;

      await reply(makeBox('🔗 IMAGE URL', resultText));

      try { await react('✅'); } catch (e) {}

    } catch (error) {
      console.error('img2url error:', error.message);
      await reply(makeBox('❌ ERROR', `${error.message}\n\nDobara try karo!`));
      try { await react('❌'); } catch (e) {}
    }
  }
};

