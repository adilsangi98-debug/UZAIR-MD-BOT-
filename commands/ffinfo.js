/**
 * Free Fire Player Info Command
 * COMMAND: .ffinfo
 * USAGE: .ffinfo <UID>
 * Fixed By UZAIR
 */

/**
 * Free Fire Player Info Command
 * COMMAND: .ffinfo
 * USAGE: .ffinfo <UID>
 * Fixed By UZAIR
 */

/**
 * Free Fire Player Info Command
 * COMMAND: .ffinfo
 * USAGE: .ffinfo <UID>
 * Fixed By UZAIR
 * API: freefireinfo-zy9l.onrender.com (FREE - No Key Required)
 */

/**
 * Free Fire Player Info Command
 * COMMAND: .ffinfo
 * USAGE: .ffinfo <UID>
 * Fixed By UZAIR
 */

/**
 * Free Fire Player Info Command
 * COMMAND: .ffinfo
 * USAGE: .ffinfo <UID>
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── API CONFIG ───
const HL_API_KEY  = '6YR6lU6bGFALIlos5yetpHGK6mi54d';
const HL_USER_UID = 'yECGyw9GsGT3LBqVFYbECwqzLYQ2';
const BASE_URL    = 'https://proapis.hlgamingofficial.com/main/games/freefire/account/api';

// ─── Box Design ───
const makeBox = (title, content) => {
  const lines = content.split('\n').map(l => `│ ${l}`).join('\n');
  return `╭─  ${title}  ─╮\n${lines}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── BR Rank Label ───
const rankLabel = (pts) => {
  pts = Number(pts) || 0;
  if (pts >= 6000) return `🏅 Heroic (${pts})`;
  if (pts >= 3500) return `💎 Diamond (${pts})`;
  if (pts >= 2000) return `🟡 Platinum (${pts})`;
  if (pts >= 1500) return `🟠 Gold (${pts})`;
  if (pts >= 1000) return `⚪ Silver (${pts})`;
  return `🟤 Bronze (${pts})`;
};

module.exports = {
  name: 'ffinfo',
  aliases: ['freefire', 'ff', 'ffplayer'],
  category: 'tools',
  description: '🎮 Free Fire player info by UID',
  usage: '.ffinfo <UID>',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;

    const uid = args?.join('').trim() || '';

    if (!uid) {
      return reply(makeBox('📌 USAGE', '❌ UID do!\n\n💡 Example:\n.ffinfo 6984888313'));
    }

    if (!/^\d{9,12}$/.test(uid)) {
      return reply(makeBox('❌ INVALID UID',
        'UID sirf numbers hoti hai!\n9 se 12 digits\n\n💡 Example: .ffinfo 6984888313'
      ));
    }

    try {
      try { await react('⏳'); } catch (_) {}

      // Regions try karo — PK SG ke under hai
      const regions = ['sg', 'pk', 'ind', 'br'];
      let result = null;
      let usedRegion = '';

      for (const region of regions) {
        try {
          const res = await axios.get(BASE_URL, {
            params: {
              sectionName: 'AllData',
              PlayerUid: uid,
              region: region,
              useruid: HL_USER_UID,
              api: HL_API_KEY,
            },
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });

          const r = res.data?.result;
          if (r && (r.AccountInfo?.AccountName || r.captainBasicInfo?.nickname)) {
            result = r;
            usedRegion = region.toUpperCase();
            break;
          }
        } catch (e) {
          console.log(`Region ${region} failed:`, e.message);
        }
      }

      if (!result) {
        return reply(makeBox('❌ NOT FOUND',
          `UID: ${uid}\n\nPlayer nahi mila!\n\nCheck karo:\n• UID sahi hai?\n• Account exist karta hai?`
        ));
      }

      const ai   = result.AccountInfo      || {};
      const cb   = result.captainBasicInfo || {};
      const gi   = result.GuildInfo        || {};
      const si   = result.socialinfo       || {};

      const name    = ai.AccountName       || cb.nickname    || 'Unknown';
      const level   = ai.AccountLevel      || cb.level       || 'N/A';
      const exp     = Number(ai.AccountEXP || cb.exp         || 0).toLocaleString();
      const likes   = Number(ai.AccountLikes || cb.liked     || 0).toLocaleString();
      const brPts   = ai.BrRankPoint       || cb.rankingPoints || 0;
      const badges  = ai.AccountBPBadges   || cb.badgeCnt    || 0;
      const region  = ai.AccountRegion     || cb.region      || usedRegion;
      const guild   = gi.GuildName         || 'No Guild';
      const gLvl    = gi.GuildLevel        || '';
      const sig     = si.AccountSignature  || '';
      const version = ai.ReleaseVersion    || cb.releaseVersion || '';
      const lastLogin = cb.lastLoginAt
        ? new Date(Number(cb.lastLoginAt) * 1000).toLocaleDateString('en-PK')
        : 'N/A';

      const infoText =
        `👤 *Name*      : ${name}\n` +
        `🆔 *UID*       : ${uid}\n` +
        `🌍 *Region*    : ${region} 🇵🇰\n` +
        `⭐ *Level*     : ${level}\n` +
        `💫 *EXP*       : ${exp}\n` +
        `❤️ *Likes*     : ${likes}\n` +
        `🏆 *BR Rank*   : ${rankLabel(brPts)}\n` +
        `🛡️ *Guild*     : ${guild}${gLvl ? ` (Lvl ${gLvl})` : ''}\n` +
        `🎖️ *Badges*    : ${badges}\n` +
        `🕐 *Last Seen* : ${lastLogin}\n` +
        `📱 *Version*   : ${version}` +
        (sig ? `\n📝 *Bio*       : ${sig.slice(0, 40)}` : '');

      await reply(makeBox('🎮 FF PLAYER INFO 🇵🇰', infoText));
      try { await react('✅'); } catch (_) {}

    } catch (error) {
      console.error('FF Info Error:', error.message);
      await reply(makeBox('❌ ERROR', `${error.message}\n\nDobara try karo!`));
      try { await react('❌'); } catch (_) {}
    }
  }
};




