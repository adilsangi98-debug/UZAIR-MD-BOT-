/**
 * APK Download Plugin
 * Downloads APK files using PrinceTech APK download API
 * COMMAND: .apk <app name>
 * EXAMPLE: .apk WhatsApp
 */

'use strict';

const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'okhttp/4.9.3'
];

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

async function fetchWithRetry(url, maxRetries = 3, timeout = 30000, responseType = 'json') {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
        responseType,
        headers: { 'User-Agent': userAgent }
      });
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function isValidAppName(name) {
  return name && name.trim().length > 0;
}

module.exports = {
  name: 'apk',
  aliases: ['apkdownload', 'getapk', 'downloadapk'],
  category: 'downloader',
  description: '📱 Download APK files for Android apps',
  usage: '.apk <app name>\n📌 Example: .apk WhatsApp',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;

    try {
      if (!args.length) {
        return reply(makeBox('APK DOWNLOADER', `❌ Please provide an app name.
┃
┃ 📌 Example: .apk WhatsApp
┃ 📌 Example: .apk TikTok`));
      }

      const appName = args.join(' ').trim();

      if (!isValidAppName(appName)) {
        return reply(makeBox('ERROR', `❌ Invalid app name.`));
      }

      await react('📥');

      const statusMsg = await sock.sendMessage(from, { text: makeBox('APK DOWNLOADER', `⏳ Fetching APK details for *${appName}*...`) }, { quoted: msg });
      const msgKey = statusMsg.key;

      const infoUrl = `https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(appName)}`;

      let infoResponse;
      try {
        infoResponse = await fetchWithRetry(infoUrl, 3, 15000);
      } catch (err) {
        await sock.sendMessage(from, {
          text: makeBox('ERROR', `❌ Failed to fetch APK info.
┃ API may be down.`),
          edit: msgKey
        });
        await react('❌');
        return;
      }

      const infoData = infoResponse.data;

      if (!infoData || !infoData.success || !infoData.result) {
        await sock.sendMessage(from, {
          text: makeBox('NOT FOUND', `❌ No APK found for *${appName}*.`),
          edit: msgKey
        });
        await react('❌');
        return;
      }

      const { appname, appicon, developer, download_url } = infoData.result;

      if (!download_url) {
        await sock.sendMessage(from, {
          text: makeBox('ERROR', `❌ APK download URL not available for *${appname}*.`),
          edit: msgKey
        });
        await react('❌');
        return;
      }

      await sock.sendMessage(from, {
        text: makeBox('APK DOWNLOADER', `📥 Downloading APK: *${appname}*...`),
        edit: msgKey
      });

      let apkBuffer;
      try {
        const apkResponse = await fetchWithRetry(download_url, 2, 60000, 'arraybuffer');
        apkBuffer = Buffer.from(apkResponse.data);
      } catch (err) {
        await sock.sendMessage(from, {
          text: makeBox('ERROR', `❌ Failed to download APK file.`),
          edit: msgKey
        });
        await react('❌');
        return;
      }

      let iconBuffer = null;
      if (appicon) {
        try {
          const iconResponse = await axios.get(appicon, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': USER_AGENTS[0] }
          });
          iconBuffer = Buffer.from(iconResponse.data);
        } catch (err) {
          console.log('Icon download failed');
        }
      }

      const fileName = `${appname.replace(/[^a-zA-Z0-9]/g, '_')}.apk`;

      const caption = makeBox('APK FILE', `📦 App: ${appname}
┃ 👤 Developer: ${developer || 'Unknown'}
┃ 🔗 Source: ${download_url}`);

      const messageOptions = {
        document: apkBuffer,
        fileName: fileName,
        mimetype: 'application/vnd.android.package-archive',
        caption: caption
      };

      if (iconBuffer) {
        messageOptions.thumbnail = iconBuffer;
      }

      await sock.sendMessage(from, messageOptions, { quoted: msg });

      try { await sock.sendMessage(from, { delete: msgKey }); } catch {}

      await react('✅');
    } catch (error) {
      console.error('APK download error:', error);
      await reply(makeBox('ERROR', `❌ Unexpected error: ${error.message}`));
      await react('❌');
    }
  }
};