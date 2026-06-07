// commands/owner/install.js
// commands/owner/install.js
// commands/owner/install.js
// commands/owner/install.js
'use strict';
// ─────────────────────────────────────────────────────────
//  commands/install.js
//  Bot root: /home/container/
//  This file: /home/container/commands/install.js
//  Plugins saved to: /home/container/commands/<name>.js
// ─────────────────────────────────────────────────────────

const axios        = require('axios');
const fs           = require('fs');
const path         = require('path');
const { exec }     = require('child_process');
const config       = require('../config/config');

// ── COMMANDS DIR — always /home/container/commands/ ──────
// __dirname = /home/container/commands  (where install.js lives)
// We explicitly use path.join(__dirname, '..', 'commands') so
// it works correctly no matter where the file is called from.
const COMMANDS_DIR = path.resolve(__dirname, '..', 'commands');

const PRIMARY_OWNER = config.ownerNumber || '';

// ── Gist URL → Raw URL ────────────────────────────────────
function gistToRawUrl(gistUrl) {
  try {
    const url   = new URL(gistUrl);
    if (url.hostname === 'gist.github.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `https://gist.githubusercontent.com/${parts[0]}/${parts[1]}/raw`;
      }
    }
    return gistUrl;
  } catch {
    return gistUrl;
  }
}

// ── Fix wrong require paths inside plugin content ─────────
// Plugins written for a different folder structure often have
// paths like ../../config  →  we patch them to ../config/config
function patchPluginPaths(content) {
  return content
    // ../../config  or  ../../config/config  →  ../config/config
    .replace(/require\(['"]\.\.\/\.\.\/config(?:\/config)?['"]\)/g, "require('../config/config')")
    // ../../utils/X  →  ../utils/X
    .replace(/require\(['"]\.\.\/\.\.\/utils\//g, "require('../utils/")
    // ../../database/X  →  ../database/X
    .replace(/require\(['"]\.\.\/\.\.\/database\//g, "require('../database/")
    // ../../core/X  →  ../core/X
    .replace(/require\(['"]\.\.\/\.\.\/core\//g, "require('../core/")
    // ../../handlers/X  →  ../handlers/X
    .replace(/require\(['"]\.\.\/\.\.\/handlers\//g, "require('../handlers/")
    // ../../middleware/X  →  ../middleware/X
    .replace(/require\(['"]\.\.\/\.\.\/middleware\//g, "require('../middleware/");
}

// ── Bot Restart ───────────────────────────────────────────
function restartBot() {
  exec('pm2 restart all', (err) => {
    if (err) {
      console.log('[Install] PM2 not found, exiting process...');
      setTimeout(() => process.exit(0), 1000);
    }
  });
}

// ── Notify Primary Owner ──────────────────────────────────
async function notifyPrimaryOwner(sock, pluginInfo, installerJid) {
  try {
    if (!PRIMARY_OWNER) return;
    const who  = String(installerJid || '').split('@')[0] || 'unknown';
    const text = [
      '🧩 *Plugin Installed*',
      '',
      `👤 By: ${who}`,
      `🧾 Name: ${pluginInfo?.name || 'unknown'}`,
      pluginInfo?.description ? `📝 ${pluginInfo.description}` : null,
      '',
      `🕒 ${new Date().toLocaleString()}`
    ].filter(Boolean).join('\n');
    await sock.sendMessage(`${PRIMARY_OWNER}@s.whatsapp.net`, { text });
  } catch { /* ignore */ }
}

// ── Parse Plugin Metadata ─────────────────────────────────
function parsePlugin(content) {
  const info = {};
  const exportMatch = content.match(/module\.exports\s*=\s*({[\s\S]*?})/);
  if (!exportMatch) return info;
  const objStr = exportMatch[1];

  const extractString = (key) => {
    const m = objStr.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`));
    return m ? m[1] : null;
  };
  const extractBoolean = (key) => {
    const m = objStr.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
    return m ? m[1] === 'true' : false;
  };
  const extractArray = (key) => {
    const m = objStr.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
    if (!m) return [];
    const items = [];
    const re = /['"]([^'"]+)['"]/g;
    let mm;
    while ((mm = re.exec(m[1])) !== null) items.push(mm[1]);
    return items;
  };

  info.name           = extractString('name');
  info.description    = extractString('description');
  info.usage          = extractString('usage');
  info.aliases        = extractArray('aliases');
  info.ownerOnly      = extractBoolean('ownerOnly');
  info.adminOnly      = extractBoolean('adminOnly');
  info.groupOnly      = extractBoolean('groupOnly');
  info.privateOnly    = extractBoolean('privateOnly');
  info.botAdminNeeded = extractBoolean('botAdminNeeded');
  return info;
}

// ── Main Command ──────────────────────────────────────────
module.exports = {
  name: 'install',
  aliases: ['plugin', 'addplugin'],
  category: 'owner',
  description: 'Install a plugin from GitHub Gist URL or by replying to a .js file',
  usage: '.install [-r] <gist_url>  OR  reply to a .js file with .install',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      // Owner check
      if (!extra.isOwner) {
        return extra.reply('❌ Sirf Owner use kar sakta hai!');
      }

      // Restart flag
      let autoRestart = false;
      const filteredArgs = args.filter(arg => {
        if (arg === '-r' || arg === '--restart') { autoRestart = true; return false; }
        return true;
      });

      let content = null;

      // ── Method 1: Gist / Raw URL ──────────────────────
      if (filteredArgs.length > 0) {
        const rawUrl = gistToRawUrl(filteredArgs[0].trim());
        await extra.react('⏳');
        const res = await axios.get(rawUrl, {
          timeout: 15000,
          responseType: 'text',
          headers: { 'User-Agent': 'WhatsApp-Bot-Installer' }
        });
        content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      }

      // ── Method 2: Reply to .js file ───────────────────
      else {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
          return extra.reply(
            '❌ Gist URL do ya kisi `.js` file ko reply karke `.install` likho.\n' +
            '📌 Usage: ' + this.usage
          );
        }
        const doc = quoted.documentMessage;
        if (!doc) return extra.reply('❌ Reply mein .js file honi chahiye.');
        if (!(doc.fileName || '').endsWith('.js')) {
          return extra.reply('❌ Sirf `.js` JavaScript files install ho sakti hain.');
        }

        await extra.react('⏳');

        // Baileys require — CommonJS safe
        let downloadMediaMessage;
        try {
          downloadMediaMessage = require('@whiskeysockets/baileys').downloadMediaMessage;
        } catch (e) {
          return extra.reply('❌ Baileys load nahi hua: ' + e.message);
        }

        const buffer = await downloadMediaMessage(
          { key: msg.key, message: quoted },
          'buffer',
          {},
          { logger: undefined, reuploadRequest: sock.updateMediaMessage }
        );
        content = buffer.toString('utf8');
      }

      if (!content || !content.trim()) {
        throw new Error('Plugin content nahi mila ya file empty hai.');
      }

      // ── Fix wrong paths inside plugin ─────────────────
      content = patchPluginPaths(content);

      // ── Parse metadata ─────────────────────────────────
      const pluginInfo = parsePlugin(content);
      if (!pluginInfo.name) {
        throw new Error(
          'Plugin ka naam nahi mila.\n' +
          'Plugin mein `name:` field honi chahiye module.exports mein.\n' +
          'Example: module.exports = { name: "myplugin", execute: async () => {} }'
        );
      }

      // ── Save to /home/container/commands/<name>.js ─────
      // ALWAYS flat — koi subfolder nahi
      const fileName   = `${pluginInfo.name}.js`;
      const targetFile = path.join(COMMANDS_DIR, fileName);

      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`[Install] Saved: ${targetFile}`);

      // ── Test load — agar fail ho to file delete karo ──
      try {
        delete require.cache[require.resolve(targetFile)];
        require(targetFile);
      } catch (loadErr) {
        try { fs.unlinkSync(targetFile); } catch {}
        throw new Error(`Plugin save hua lekin load nahi hua:\n${loadErr.message}`);
      }

      // ── Hot reload (messageHandler ka dynamic loader) ──
      try {
        if (typeof global.reloadCommands === 'function') {
          global.reloadCommands();
          console.log('[Install] Hot-reload complete.');
        }
      } catch (e) {
        console.log('[Install] Hot-reload skip:', e.message);
      }

      // ── Build success message ──────────────────────────
      const prefix = config.prefix || '.';
      const details = [
        '╔══════════════════════╗',
        '║  ✅ Plugin Installed  ║',
        '╚══════════════════════╝',
        '',
        `📄 *File:* ${fileName}`,
        `📁 *Saved to:* commands/${fileName}`,
        `🔖 *Command:* ${prefix}${pluginInfo.name}`,
      ];

      if (pluginInfo.aliases?.length) {
        details.push(
          `🔁 *Aliases:* ${pluginInfo.aliases.map(a => `${prefix}${a}`).join(', ')}`
        );
      }
      if (pluginInfo.description) details.push(`📝 *Info:* ${pluginInfo.description}`);
      if (pluginInfo.usage)       details.push(`⚙️ *Usage:* ${pluginInfo.usage}`);

      const flags = [];
      if (pluginInfo.ownerOnly)      flags.push('👑 Owner only');
      if (pluginInfo.adminOnly)      flags.push('🛡️ Admin only');
      if (pluginInfo.groupOnly)      flags.push('👥 Group only');
      if (pluginInfo.privateOnly)    flags.push('💬 Private only');
      if (pluginInfo.botAdminNeeded) flags.push('🤖 Bot admin needed');
      if (flags.length) details.push(`🚩 *Flags:* ${flags.join(' · ')}`);

      if (autoRestart) {
        details.push('', '♻️ *Auto-restarting bot...*');
        details.push(`🕒 ${new Date().toLocaleString()}`);
        await sock.sendMessage(extra.from, { text: details.join('\n') }, { quoted: msg });
        await extra.react('✅');
        await notifyPrimaryOwner(sock, pluginInfo, extra.sender);
        restartBot();
      } else {
        const hotLoaded = typeof global.reloadCommands === 'function';
        details.push('', hotLoaded
          ? '⚡ *Loaded instantly — no restart needed!*'
          : '🔄 *Restart required to activate.*'
        );
        details.push(`🕒 ${new Date().toLocaleString()}`);
        await sock.sendMessage(extra.from, { text: details.join('\n') }, { quoted: msg });
        await extra.react('✅');
        await notifyPrimaryOwner(sock, pluginInfo, extra.sender);
      }

    } catch (error) {
      console.error('[Install] Error:', error);
      const errMsg = error.response
        ? `HTTP ${error.response.status} — ${error.response.statusText}`
        : error.message;
      await extra.reply(`❌ *Installation failed:*\n\n${errMsg}`);
      await extra.react('❌');
    }
  }
};




