// ============================================
//    UZAIR  MD BOT — COMMANDS/DOWNLOADER.JS
// ============================================

'use strict';

const axios  = require('axios');
const { toSmallCaps } = require('../utils/fonts');
const logger = require('../utils/logger');

const safeFetch = async (url, params = {}, timeout = 20000) => {
  const res = await axios.get(url, { params, timeout });
  return res.data;
};

// ─── .ytmp3 ───────────────────────────────────
const ytmp3 = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || !url.includes('youtu')) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide a youtube link!')}*\n${toSmallCaps('usage')}: \`.ytmp3 <youtube_url>\``);
  }

  try {
    await ctx.reply(`🎵 *${toSmallCaps('downloading audio... please wait')}*`);

    let dlUrl = null;
    let title = 'audio';

    const audioApis = [
      `https://apiskeith.top/download/audio?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/ytmp3?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/dlmp3?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/mp3?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/yta?url=${encodeURIComponent(url)}`,
    ];

    for (const apiUrl of audioApis) {
      if (dlUrl) break;
      try {
        const res = await axios.get(apiUrl, { timeout: 30000 });
        if (res.data && res.data.status === true && res.data.result) {
          dlUrl = res.data.result;
          title = res.data.title || title;
        }
      } catch {}
    }

    if (!dlUrl) throw new Error('All APIs failed');

    const buffer = await axios.get(dlUrl, { 
      responseType: 'arraybuffer', 
      timeout: 90000,
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });

    await sock.sendMessage(from, {
      audio:    Buffer.from(buffer.data),
      mimetype: 'audio/mpeg',
      ptt:      false,
      fileName: `${title}.mp3`,
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('ytmp3 error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download audio!')}*`);
  }
};

// ─── .ytmp4 ───────────────────────────────────
const ytmp4 = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || !url.includes('youtu')) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide a youtube link!')}*`);
  }

  try {
    await ctx.reply(`🎬 *${toSmallCaps('downloading video... please wait')}*`);

    let dlUrl = null;
    let title = 'video';

    const videoApis = [
      `https://apiskeith.top/download/video?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/ytmp4?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/dlmp4?url=${encodeURIComponent(url)}`,
      `https://apiskeith.top/download/mp4?url=${encodeURIComponent(url)}`,
    ];

    for (const apiUrl of videoApis) {
      if (dlUrl) break;
      try {
        const res = await axios.get(apiUrl, { timeout: 30000 });
        if (res.data && res.data.status === true && res.data.result) {
          dlUrl = res.data.result;
          title = res.data.title || title;
        }
      } catch {}
    }

    if (!dlUrl) throw new Error('All APIs failed');

    const buffer = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 120000 });

    await sock.sendMessage(from, {
      video:    Buffer.from(buffer.data),
      mimetype: 'video/mp4',
      caption:  `🎬 *${title}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
    });

    await react('✅');
  } catch (err) {
    logger.error('ytmp4 error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download video!')}*`);
  }
};

// ─── .video ───────────────────────────────────
const video = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const url = args[0];
  if (!url || !url.includes('youtu')) return ctx.reply(`❌ *Provide a YouTube link!*`);

  await react('⏳');
  try {
    // 1. Get Redirect Link from API
    const res = await axios.get(`https://api.vidssave.com/api/contentsite_api/media/download_redirect?request=${encodeURIComponent(url)}`);
    const finalDlUrl = res.request.res.responseUrl; // Redirected URL

    // 2. Notify User (Thumbnail + Title info)
    await ctx.reply(`📽️ *Video found, downloading...*`);

    // 3. Download Buffer
    const response = await axios.get(finalDlUrl, { 
      responseType: 'arraybuffer', 
      maxRedirects: 5,
      timeout: 120000 
    });

    // 4. Send Video
    await sock.sendMessage(from, {
      video: Buffer.from(response.data),
      mimetype: 'video/mp4',
      caption: `✅ *Downloaded by shehryar MD*`
    }, { quoted: msg });

    await react('✅');
  } catch (err) {
    logger.error('video error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *Failed to download video!*`);
  }
};

// ─── .tiktok ──────────────────────────────────
const tiktok = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || !url.includes('tiktok')) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide a tiktok link!')}*`);
  }

  try {
    await ctx.reply(`🎵 *${toSmallCaps('downloading tiktok... please wait')}*`);

    let dlUrl = null;

    try {
      const res = await axios.post('https://api.cobalt.tools/api/json', { url },
        { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 });
      dlUrl = res.data?.url;
    } catch {}

    if (!dlUrl) {
      const d = await safeFetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
      dlUrl = d?.data?.play || d?.data?.wmplay;
    }

    if (!dlUrl) throw new Error('No video URL');

    const buffer = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 });

    await sock.sendMessage(from, {
      video:    Buffer.from(buffer.data),
      mimetype: 'video/mp4',
      caption:  `🎵 *${toSmallCaps('tiktok video')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
    });

    await react('✅');
  } catch (err) {
    logger.error('tiktok error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download tiktok!')}*`);
  }
};

// ─── .instagram ───────────────────────────────
const instagram = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || !url.includes('instagram')) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide an instagram link!')}*`);
  }

  try {
    await ctx.reply(`📸 *${toSmallCaps('downloading... please wait')}*`);

    let dlUrl  = null;
    let isVideo = false;

    try {
      const res = await axios.get(`https://igdownloader-five.vercel.app/download?url=${encodeURIComponent(url)}&key=tlz.vercel.app`, { timeout: 20000 });
      dlUrl   = res.data?.video_url || res.data?.thumbnail_url;
      isVideo = res.data?.video_url ? true : false;
    } catch {}

    if (!dlUrl) {
      try {
        const res = await axios.post('https://api.cobalt.tools/api/json', { url },
          { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 });
        dlUrl   = res.data?.url;
        isVideo = res.data?.type === 'video' || (dlUrl && dlUrl.includes('.mp4'));
      } catch {}
    }

    if (!dlUrl) throw new Error('No media found');

    const buffer = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 });

    if (isVideo) {
      await sock.sendMessage(from, {
        video:    Buffer.from(buffer.data),
        mimetype: 'video/mp4',
        caption:  `📸 *${toSmallCaps('instagram video')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, {
        image:   Buffer.from(buffer.data),
        caption: `📸 *${toSmallCaps('instagram photo')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
      }, { quoted: msg });
    }

    await react('✅');
  } catch (err) {
    logger.error('instagram error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed!')}* ${toSmallCaps('make sure the post is public.')}`);
  }
};

// ─── .facebook ────────────────────────────────
const facebook = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || (!url.includes('facebook') && !url.includes('fb.watch'))) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide a facebook video link!')}*`);
  }

  try {
    await ctx.reply(`📘 *${toSmallCaps('downloading facebook video... please wait')}*`);

    let dlUrl = null;

    try {
      const res = await axios.post('https://api.cobalt.tools/api/json', { url },
        { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 });
      dlUrl = res.data?.url;
    } catch {}

    if (!dlUrl) {
      const d = await safeFetch(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`);
      dlUrl = d?.hd || d?.sd || d?.url;
    }

    if (!dlUrl) throw new Error('No video URL');

    const buffer = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 120000 });

    await sock.sendMessage(from, {
      video:    Buffer.from(buffer.data),
      mimetype: 'video/mp4',
      caption:  `📘 *${toSmallCaps('facebook video')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
    });

    await react('✅');
  } catch (err) {
    logger.error('facebook error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download facebook video!')}*`);
  }
};

// ─── .twitter ─────────────────────────────────
const twitter = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  await react('⏳');

  const url = args[0];
  if (!url || (!url.includes('twitter') && !url.includes('x.com'))) {
    await react('❌');
    return ctx.reply(`❌ *${toSmallCaps('provide a twitter/x link!')}*`);
  }

  try {
    await ctx.reply(`🐦 *${toSmallCaps('downloading twitter media... please wait')}*`);

    let dlUrl = null;
    let isVideo = true;

    try {
      const res = await axios.post('https://api.cobalt.tools/api/json', { url },
        { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 });
      dlUrl   = res.data?.url;
      isVideo = res.data?.type !== 'photo';
    } catch {}

    if (!dlUrl) {
      const d = await safeFetch(`https://api.ryzendesu.vip/api/downloader/twitter?url=${encodeURIComponent(url)}`);
      dlUrl   = d?.url || d?.data?.[0]?.url;
      isVideo = dlUrl?.includes('.mp4');
    }

    if (!dlUrl) throw new Error('No media URL');

    const buffer = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 });

    if (isVideo) {
      await sock.sendMessage(from, {
        video:    Buffer.from(buffer.data),
        mimetype: 'video/mp4',
        caption:  `🐦 *${toSmallCaps('twitter video')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
      });
    } else {
      await sock.sendMessage(from, {
        image:   Buffer.from(buffer.data),
        caption: `🐦 *${toSmallCaps('twitter media')}*\n_${toSmallCaps('downloaded by UZAIR  MD')}_`,
      });
    }

    await react('✅');
  } catch (err) {
    logger.error('twitter error:', err.message);
    await react('❌');
    await ctx.reply(`❌ *${toSmallCaps('failed to download twitter media!')}*`);
  }
};

module.exports = { ytmp3, ytmp4, tiktok, instagram, facebook, twitter, video };