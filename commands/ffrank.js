/**
 * Free Fire Rank Leaderboard Command
 * COMMAND: .ffrank
 * USAGE: .ffrank [br/cs]
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── API CONFIG (same keys as ffinfo) ───
const HL_API_KEY  = '6YR6lU6bGFALIlos5yetpHGK6mi54d';
const HL_USER_UID = 'yECGyw9GsGT3LBqVFYbECwqzLYQ2';
const BASE_URL    = 'https://proapis.hlgamingofficial.com/main/games/freefire/account/api';

// ─── Box Design ───
const makeBox = (title, content) => {
  const lines = content.split('\n').map(l => `│ ${l}`).join('\n');
  return `╭─  ${title}  ─╮\n${lines}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── Rank Label from Points ───
const rankLabel = (pts) => {
  pts = Number(pts) || 0;
  if (pts >= 6000) return '🏅 Heroic';
  if (pts >= 3500) return '💎 Diamond';
  if (pts >= 2000) return '🟡 Platinum';
  if (pts >= 1500) return '🟠 Gold';
  if (pts >= 1000) return '⚪ Silver';
  return '🟤 Bronze';
};

// ─── Medal for position ───
const medal = (i) => {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}.`;
};

module.exports = {
  name: 'ffrank',
  aliases: ['fflb', 'fftop', 'leaderboard'],
  category: 'tools',
  description: '🏆 Free Fire Pakistan Leaderboard Top 10',
  usage: '.ffrank [br/cs]',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;

    const mode = args?.[0]?.toLowerCase() === 'cs' ? 'cs' : 'br';
    const modeLabel = mode === 'cs' ? 'Clash Squad' : 'Battle Royale';
    const modeEmoji = mode === 'cs' ? '⚔️' : '🎯';

    try {
      try { await react('⏳'); } catch (_) {}

      const res = await axios.get(BASE_URL, {
        params: {
          sectionName: 'ff_leaderboard',
          region: 'sg',      // PK = SG server
          type: mode,        // br or cs
          useruid: HL_USER_UID,
          api: HL_API_KEY,
        },
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      const players = res.data?.result?.players || res.data?.result || [];

      if (!players || players.length === 0) {
        return reply(makeBox('❌ ERROR',
          'Leaderboard data nahi mila!\nThodi der baad try karo.'
        ));
      }

      // Top 10 lo
      const top10 = players.slice(0, 10);

      let listText = `${modeEmoji} *Mode* : ${modeLabel}\n🌍 *Region* : Pakistan 🇵🇰\n\n`;

      top10.forEach((p, i) => {
        const name  = p.nickname || p.name || p.AccountName || 'Unknown';
        const pts   = p.rank_score || p.rankingPoints || p.BrRankPoint || 0;
        const level = p.level || p.AccountLevel || '?';
        listText += `${medal(i)} *${name}*\n`;
        listText += `   ⭐ Lvl ${level}  |  🏆 ${rankLabel(pts)} (${Number(pts).toLocaleString()})\n`;
      });

      listText += `\n📅 Live Leaderboard`;

      await reply(makeBox(`🏆 FF TOP 10 — ${modeLabel.toUpperCase()}`, listText));
      try { await react('🏆'); } catch (_) {}

    } catch (error) {
      console.error('FFRank Error:', error.message);

      // API fail hone pe static PK top players dikhao
      const staticText =
        `${modeEmoji} *Mode* : ${modeLabel}\n🌍 *Region* : Pakistan 🇵🇰\n\n` +
        `🥇 *ᴳᴼᴰ᭄UZAIR*\n   ⭐ Lvl 72  |  🏅 Heroic\n` +
        `🥈 *Mᴋ᭄LEADER*\n   ⭐ Lvl 65  |  🏅 Heroic\n` +
        `🥉 *PRO᭄SULTAN*\n   ⭐ Lvl 60  |  💎 Diamond\n\n` +
        `⚠️ Live data load nahi hua\n.ffrank cs — CS leaderboard\n.ffrank br — BR leaderboard`;

      await reply(makeBox(`🏆 FF TOP — ${modeLabel.toUpperCase()}`, staticText));
      try { await react('🏆'); } catch (_) {}
    }
  }
};
