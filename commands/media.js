// ============================================
//      UZAIR  MD BOT — COMMANDS/MEDIA.JS
//      Media Commands (Instant Metadata Version)
// ============================================

'use strict';

const axios  = require('axios');
const yts    = require('yt-search'); 
const { toSmallCaps } = require('../utils/fonts');
const logger = require('../utils/logger');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ─── Helper: Smart Query Sanitizer ──────────
const cleanQuery = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/(please|find|search|for|me|play|this|song|lyrics|video|official|audio|full|hd|mp3|download|can|you|the|want|to|listen|online)/gi, '') 
    .replace(/\s+/g, ' ') 
    .trim();
};

// ─── Helper: Extreme YouTube Search ──────────
const searchYT = async (query) => {
  try {
    const sanitized = cleanQuery(query);
    const r = await yts(sanitized || query);
    const video = r.videos[0];
    
    if (video) {
      return { 
        id: video.videoId, 
        title: video.title, 
        url: video.url,
        author: video.author.name,
        thumbnail: video.thumbnail,
        duration: video.timestamp,
        views: video.views.toLocaleString()
      };
    }

    const apiSearch = await axios.get(`https://api.agatz.xyz/api/ytsearch?message=${encodeURIComponent(sanitized || query)}`, { timeout: 15000 }).catch(() => null);
    if (apiSearch?.data?.data?.[0]) {
      const first = apiSearch.data.data[0];
      return {
        id: first.videoId,
        title: first.title,
        url: first.url,
        author: 'YouTube',
        thumbnail: first.thumbnail,
        duration: '---',
        views: '---'
      };
    }

    return null;
  } catch (e) {
    logger.error('Search Logic Error:', e.message);
    return null;
  }
};

// ─── .play / .song — Search & download audio ──
const play = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const query = args.join(' ');
  if (!query) return ctx.reply(`❌ *${toSmallCaps('provide a song name')}!*`);

  try {
    const result = await searchYT(query);
    if (!result) throw new Error('Search failed');

    const detailsText = 
`🎧 *${toSmallCaps('AMMAR MD music player')}*

🎵 *${toSmallCaps('title')}:* ${result.title}
🔗 *${toSmallCaps('link')}:* ${result.url}
⏱️ *${toSmallCaps('duration')}:* ${result.duration}
👀 *${toSmallCaps('views')}:* ${result.views}

> *${toSmallCaps('powered by AMMAR RAI')}*`;

    await sock.sendMessage(from, { 
      image: { url: result.thumbnail }, 
      caption: detailsText 
    }, { quoted: msg });

    let finalUrl = null;
    const rawUrl = result.url;

    const audioApis = [
      () => axios.get(`https://apiskeith.top/download/audio?url=${rawUrl}`, { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/mp3?url=${rawUrl}`,   { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/ytmp3?url=${rawUrl}`, { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/dlmp3?url=${rawUrl}`, { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/yta?url=${rawUrl}`,   { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/ytv?url=${rawUrl}`,   { timeout: 30000 })
    ];

    for (const callApi of audioApis) {
      try {
        const res  = await callApi();
        const data = res.data;
        const candidate = data?.result || data?.url || data?.download_url || data?.link;
        if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
          finalUrl = candidate;
          break;
        }
      } catch (e) { continue; }
    }

    if (!finalUrl) throw new Error('All download APIs failed');

    const buffer = await axios.get(finalUrl, { 
      responseType: 'arraybuffer', 
      timeout: 900000,
      maxRedirects: 10,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    await sock.sendMessage(from, {
      audio:    Buffer.from(buffer.data),
      mimetype: 'audio/mpeg',
      ptt:      false,
      fileName: `${result.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('play error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to play song')}!*`);
  }
};

// ─── .video — Search & download video ────────
const video = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const query = args.join(' ');
  if (!query) return ctx.reply(`❌ *${toSmallCaps('provide a video name')}!*`);

  try {
    const result = await searchYT(query);
    if (!result) throw new Error('No results found');

    const detailsText = 
`📽️ *${toSmallCaps('AMMAR MD video player')}*

🎬 *${toSmallCaps('title')}:* ${result.title}
🔗 *${toSmallCaps('link')}:* ${result.url}
⏱️ *${toSmallCaps('duration')}:* ${result.duration}
👀 *${toSmallCaps('views')}:* ${result.views}

> *${toSmallCaps('powered by AMMAR RAI ')}*`;

    await sock.sendMessage(from, { image: { url: result.thumbnail }, caption: detailsText }, { quoted: msg });

    let finalDlUrl = null;
    const rawUrl = result.url;

    const videoApis = [
      () => axios.get(`https://apiskeith.top/download/video?url=${rawUrl}`, { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/mp4?url=${rawUrl}`,   { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/ytmp4?url=${rawUrl}`, { timeout: 30000 }),
      () => axios.get(`https://apiskeith.top/download/dlmp4?url=${rawUrl}`, { timeout: 30000 })
    ];

    for (const callApi of videoApis) {
      try {
        const res  = await callApi();
        const data = res.data;
        const candidate = data?.result || data?.url || data?.download_url || data?.link;
        if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
          finalDlUrl = candidate;
          break;
        }
      } catch (e) { continue; }
    }

    if (!finalDlUrl) throw new Error('All download APIs failed');

    const response = await axios.get(finalDlUrl, { 
      responseType: 'arraybuffer', 
      maxRedirects: 10,
      timeout: 900000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    await sock.sendMessage(from, {
      video: Buffer.from(response.data),
      mimetype: 'video/mp4',
      caption: `✅ *${result.title}*\n_ʙʏ ${toSmallCaps('AMMAR MD')}_`
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('video error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download video')}!*`);
  }
};

// ─── .gif — Search & send GIF ─────────────────
const gif = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const query = args.join(' ') || 'funny';

  try {
    const res = await axios.get(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=10`,
      { timeout: 10000 }
    );

    const results = res.data?.results;
    if (!results?.length) throw new Error('No GIFs found');

    const random  = results[Math.floor(Math.random() * results.length)];
    const gifUrl  = random.media_formats?.mp4?.url || random.url;
    const buffer  = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 15000 });

    await sock.sendMessage(from, {
      video:    Buffer.from(buffer.data),
      mimetype: 'video/mp4',
      gifPlayback: true,
      caption:  `🎬 *${toSmallCaps('gif')}: ${query}*\n_ʙʏ ${toSmallCaps('AMMAR MD')}_`,
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('gif error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to get gif')}!*`);
  }
};

// ─── .tomp3 — Convert video to audio ─────────
const tomp3 = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  await react('⏳');

  try {
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const msgToDownload = quoted ? { message: quoted } : msg;
    const isVideo = !!msgToDownload.message?.videoMessage;

    if (!isVideo) {
      await react('❌');
      return ctx.reply(`❌ *${toSmallCaps('quote a video to convert to audio')}!*`);
    }

    const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {});

    await sock.sendMessage(from, {
      audio:    buffer,
      mimetype: 'audio/mpeg',
      ptt:      false,
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('tomp3 error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('conversion failed')}!*`);
  }
};

module.exports = { play, song: play, video, gif, tomp3 };