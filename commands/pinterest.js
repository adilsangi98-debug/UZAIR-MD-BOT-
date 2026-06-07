/**
 * Pinterest Downloader Plugin
 * COMMAND: .pinterest <url or search>
 * EXAMPLE: .pinterest https://pin.it/xxxxx
 * EXAMPLE: .pinterest beautiful nature
 */

'use strict';

const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

async function fetchWithRetry(url, maxRetries = 3, timeout = 15000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
        headers: { 'User-Agent': userAgent }
      });
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  throw lastError;
}

function isPinterestUrl(input) {
  const patterns = [
    /pin\.it\//i,
    /pinterest\.com\/pin\//i,
    /pinterest\.com\/[^/]+\/[^/]+\/?/i
  ];
  return patterns.some(p => p.test(input));
}

function getBestImageUrl(pin) {
  if (pin.image) return pin.image;
  if (pin.images?.orig?.url) return pin.images.orig.url;
  if (pin.images?.original?.url) return pin.images.original.url;
  if (pin.images) {
    const sizes = ['736x', '564x', '474x', '236x', '170x', '136x', '60x60'];
    for (const size of sizes) {
      if (pin.images[size]?.url) return pin.images[size].url;
    }
  }
  return null;
}

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  category: 'downloader',
  description: '📌 Download images from Pinterest (URL or search)',
  usage: '.pinterest <url or search query>\n📌 Example: .pinterest https://pin.it/xxxxx\n📌 Example: .pinterest beautiful nature',

  async execute(sock, msg, args, extra) {
    const { from, reply, react } = extra;
    const input = args.join(' ').trim();

    if (!input) {
      return reply(makeBox('PINTEREST DOWNLOADER', `❌ Please provide a Pinterest URL or search query.
┃
┃ 📌 Example: .pinterest https://pin.it/xxxxx
┃ 📌 Example: .pinterest beautiful nature`));
    }

    try {
      await react('⏳');

      const apiUrl = `https://backend1.tioo.eu.org/pinterest?url=${encodeURIComponent(input)}`;
      const response = await fetchWithRetry(apiUrl, 3, 15000);
      const data = response.data;

      if (!data?.success || !data?.result) {
        throw new Error(data?.message || 'Invalid API response');
      }

      const result = data.result;
      const isUrl = isPinterestUrl(input);

      if (isUrl) {
        const imageUrl = getBestImageUrl(result);
        if (!imageUrl) throw new Error('No image URL found');

        const username = result.user?.username || result.user?.full_name || 'Unknown';
        const caption = makeBox('PINTEREST IMAGE', `👤 User: ${username}`);

        await sock.sendMessage(from, {
          image: { url: imageUrl },
          caption: caption
        }, { quoted: msg });

        await react('✅');
      } else {
        const pins = result.result;
        if (!Array.isArray(pins) || pins.length === 0) {
          throw new Error('No results found');
        }

        const limited = pins.slice(0, 10);
        let sentCount = 0;

        for (const pin of limited) {
          const imageUrl = getBestImageUrl(pin);
          if (!imageUrl) continue;

          const username = pin.user?.username || pin.user?.full_name || 'Unknown';
          const caption = makeBox('PINTEREST RESULT', `👤 User: ${username}`);

          await sock.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
          }, { quoted: msg });

          sentCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (sentCount === 0) {
          await reply(makeBox('ERROR', `❌ No downloadable images found.`));
        } else {
          await reply(makeBox('PINTEREST', `✅ Sent ${sentCount} images.`));
        }
        await react('✅');
      }
    } catch (error) {
      console.error('Pinterest error:', error);
      let errorMsg = '❌ Failed to process.';
      if (error.code === 'ECONNABORTED') errorMsg += ' Request timed out.';
      else errorMsg += ` ${error.message}`;
      await reply(makeBox('ERROR', errorMsg));
      await react('❌');
    }
  }
};