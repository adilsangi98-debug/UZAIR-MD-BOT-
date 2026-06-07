// ============================================
//      UZAIR MD BOT — COMMANDS/ADMIN.JS
//      Owner-Only Admin Commands
// ============================================

'use strict';

const axios  = require('axios');
const fs     = require('fs');
const { toSmallCaps } = require('../utils/fonts');
const { authMiddleware } = require('../middleware/auth');
const db     = require('../database/db');
const pairManager    = require('../pair/pairManager');
const sessionManager = require('../core/session');
const ownerManager   = require('../core/owner');
const logger = require('../utils/logger');
const { getMentions } = require('../utils/helpers');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ─── Forwarding Context Info (Only for Mode) ────────────
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true
};

// ─── LID → s.whatsapp.net resolver ───────────────────────
const resolveLidToJid = async (sock, from, isGroup, mentionJid) => {
  if (!mentionJid) return null;

  if (mentionJid.endsWith('@s.whatsapp.net')) {
    return mentionJid.split(':')[0] + '@s.whatsapp.net';
  }

  if (mentionJid.endsWith('@lid')) {
    if (isGroup) {
      try {
        const groupMeta = await sock.groupMetadata(from);
        const match = groupMeta.participants.find(p =>
          p.id === mentionJid || p.lid === mentionJid
        );
        if (match && match.id && match.id.endsWith('@s.whatsapp.net')) {
          return match.id.split(':')[0] + '@s.whatsapp.net';
        }
      } catch {}
    }

    try {
      const contacts = sock.contacts || {};
      for (const [jid, contact] of Object.entries(contacts)) {
        if (
          (contact.lid === mentionJid || jid === mentionJid) &&
          jid.endsWith('@s.whatsapp.net')
        ) {
          return jid.split(':')[0] + '@s.whatsapp.net';
        }
      }
    } catch {}

    try {
      const store = sock.store || sock._store;
      if (store?.contacts) {
        for (const [jid, contact] of Object.entries(store.contacts)) {
          if (
            (contact.lid === mentionJid || jid === mentionJid) &&
            jid.endsWith('@s.whatsapp.net')
          ) {
            return jid.split(':')[0] + '@s.whatsapp.net';
          }
        }
      }
    } catch {}

    return null;
  }

  const raw = mentionJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  if (raw.length >= 7) return `${raw}@s.whatsapp.net`;
  return null;
};

// ─── .broadcast ───────────────────────────────
const broadcast = async (ctx) => {
  const { sock, args, botNum, react, from, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;

  const text = args.join(' ');
  if (!text) return ctx.reply(
    `❌ *${toSmallCaps('provide broadcast message')}*\n\n` +
    `📌 *${toSmallCaps('usage')}:* .broadcast <message>`
  );

  await react('📢');
  try {
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.keys(chats);
    let sent = 0;

    for (const jid of groups) {
      try {
        await sock.sendMessage(jid, {
          text: `📢 *${toSmallCaps('broadcast message')}*\n\n${text}\n\n_ʙʏ ${toSmallCaps('UZAIR  MD')}_`
        });
        sent++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }

    await sock.sendMessage(from, {
      text: `✅ *${toSmallCaps('broadcast sent to')} ${sent}/${groups.length} ${toSmallCaps('groups')}*`
    }, { quoted: msg });
    await react('✅');
  } catch (err) {
    logger.error('broadcast error:', err.message);
    await react('❌');
  }
};

// ─── Target resolver ──────────────────────────────
const resolveTarget = async (sock, ctx, args) => {
  const { msg, from, isGroup } = ctx;
  const mentions = getMentions(msg.message);
  const rawMention = mentions[0];
  const replyParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (rawMention) {
    const resolved = await resolveLidToJid(sock, from, isGroup, rawMention);
    if (resolved) return resolved;
    return rawMention;
  }

  if (replyParticipant) {
    const resolved = await resolveLidToJid(sock, from, isGroup, replyParticipant);
    if (resolved) return resolved;
    return replyParticipant;
  }

  if (args && args[0]) {
    let num = args[0].replace(/[^0-9]/g, '');
    if (num.startsWith('0')) num = '92' + num.slice(1);
    else if (num.length <= 11 && !num.startsWith('92')) num = '92' + num;
    if (num.length >= 7) return `${num}@s.whatsapp.net`;
  }

  return null;
};

// ─── .clearsess ───────────────────────────────
const clearsess = async (ctx) => {
  const { botNum, react, from, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;

  await react('⏳');
  try {
    const sessionPath = sessionManager.getSessionPath(botNum);
    await sock.sendMessage(from, { text: `✅ *${toSmallCaps('session cleared bot will disconnect')}*` }, { quoted: msg });
    fs.rmSync(sessionPath, { recursive: true, force: true });
    pairManager.removeSocket(botNum);
    ownerManager.removeOwner(botNum);
    setTimeout(() => process.exit(0), 2000);
  } catch (err) {
    await react('❌');
  }
};

// ─── .restart ─────────────────────────────────
const restart = async (ctx) => {
  const { botNum, from, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;

  await ctx.reply(`🔄 *${toSmallCaps('restarting session please wait')}*...`);
  try {
    await sock.end(undefined);
  } catch {}
};

// ─── .setppgc ─────────────────────────────────
const setppgc = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  await react('⏳');
  try {
    const message = msg.message;
    const isImage = !!message?.imageMessage ||
      !!message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage) {
      await react('❌');
      return ctx.reply(
        `❌ *${toSmallCaps('quote an image to set as group picture')}*\n\n` +
        `📌 *${toSmallCaps('usage')}:* ${toSmallCaps('quote an image and send')} .setppgc`
      );
    }

    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    await sock.updateProfilePicture(from, buffer);
    await sock.sendMessage(from, { text: `✅ *${toSmallCaps('group picture updated successfully')}*` }, { quoted: msg });
    await react('✅');
  } catch (err) {
    await react('❌');
  }
};

// ─── .delete ──────────────────────────────────
const del = async (ctx) => {
  const { sock, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
    return ctx.reply(
      `❌ *${toSmallCaps('reply to a message to delete')}*\n\n` +
      `📌 *${toSmallCaps('usage')}:* ${toSmallCaps('reply to a message and send')} .delete`
    );
  }

  await sock.sendMessage(ctx.from, {
    delete: {
      remoteJid: ctx.from,
      fromMe: false,
      id: msg.message.extendedTextMessage.contextInfo.stanzaId,
      participant: msg.message.extendedTextMessage.contextInfo.participant
    }
  });
};

// ─── .getpp ───────────────────────────────────
const getpp = async (ctx) => {
  const { sock, msg, react, from } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;

  let target = msg.message.extendedTextMessage?.contextInfo?.participant || getMentions(msg.message)[0];
  if (!target) target = ctx.sender;

  if (target && !target.endsWith('@s.whatsapp.net')) {
    target = await resolveLidToJid(sock, from, ctx.isGroup, target) || target;
  }

  try {
    const pp = await sock.profilePictureUrl(target, 'image');
    await sock.sendMessage(from, {
      image: { url: pp },
      caption: `✅ *${toSmallCaps('profile picture')}*`
    }, { quoted: msg });
  } catch (e) {
    await ctx.reply(`❌ *${toSmallCaps('could not get profile picture')}*`);
  }
};

// ─── .warn ────────────────────────────────────
const warn = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!await auth.requireGroup()) return;

  const mentions   = getMentions(msg.message);
  const rawMention = mentions[0];
  let targetJid    = null;

  if (rawMention) {
    targetJid = await resolveLidToJid(sock, from, ctx.isGroup, rawMention);
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, '');
    if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
  }

  if (!targetJid) return ctx.reply(
    `❌ *${toSmallCaps('tag someone to warn')}*\n\n` +
    `📌 *${toSmallCaps('usage')}:* .warn @user ${toSmallCaps('or')} .warn <number>`
  );

  const cleanNum = targetJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  await react('⚠️');

  const warnKey  = `${from}:${targetJid}`;
  const warns    = db.addWarn(warnKey, ctx.botNum);
  const maxWarns = 3;

  if (warns >= maxWarns) {
    await sock.sendMessage(from, {
      text: `⚠️ *${toSmallCaps('warning')} ${warns}/${maxWarns}*\n\n@${cleanNum} *${toSmallCaps('has been warned')}!*\n\n🚫 *${toSmallCaps('max warnings reached kicking user')}!*`,
      mentions: [targetJid]
    }, { quoted: msg });

    try {
      await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
      db.resetWarns(warnKey, ctx.botNum);
      await react('🚫');
    } catch (err) {
      logger.error('warn kick error:', err.message);
      await sock.sendMessage(from, {
        text: `❌ *${toSmallCaps('could not kick user make sure bot is admin')}*`
      }, { quoted: msg });
      await react('❌');
    }
  } else {
    await sock.sendMessage(from, {
      text: `⚠️ *${toSmallCaps('warning')} ${warns}/${maxWarns}*\n\n@${cleanNum} *${toSmallCaps('has been warned')}!*`,
      mentions: [targetJid]
    }, { quoted: msg });
    await react('✅');
  }
};

// ─── .resetwarn ───────────────────────────────
const resetwarn = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!await auth.requireGroup()) return;

  const mentions   = getMentions(msg.message);
  const rawMention = mentions[0];
  let targetJid    = null;

  if (rawMention) {
    targetJid = await resolveLidToJid(sock, from, ctx.isGroup, rawMention);
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, '');
    if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
  }

  if (!targetJid) return ctx.reply(
    `❌ *${toSmallCaps('tag someone to reset warns')}*\n\n` +
    `📌 *${toSmallCaps('usage')}:* .resetwarn @user ${toSmallCaps('or')} .resetwarn <number>`
  );

  const cleanNum = targetJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  const warnKey  = `${from}:${targetJid}`;
  db.resetWarns(warnKey, ctx.botNum);

  await sock.sendMessage(from, {
    text: `✅ *${toSmallCaps('warnings reset for')}* @${cleanNum}`,
    mentions: [targetJid]
  }, { quoted: msg });
  await react('✅');
};

// ─── .afk ─────────────────────────────────────
const afk = async (ctx) => {
  const { sender, args, react, from, msg, sock } = ctx;
  await react('💤');
  const reason = args.join(' ') || 'No reason given';
  db.setAfk(sender, reason, ctx.botNum);
  await sock.sendMessage(from, {
    text: `💤 *${toSmallCaps('afk mode enabled')}*\n📝 *${toSmallCaps('reason')}:* ${reason}`
  }, { quoted: msg });
};

// ─── .mode ────────────────────────────────────
const mode = async (ctx) => {
  const { args, react, botNum, from, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const val = args[0]?.toLowerCase();

  if (!val || !['public', 'private'].includes(val)) {
    const current = db.getBotMode(cleanBot);
    return sock.sendMessage(from, {
      text:
        `⚙️ *${toSmallCaps('bot current mode')}:* ${current === 'public' ? '🌍 ᴘᴜʙʟɪᴄ' : '🔒 ᴘʀɪᴠᴀᴛᴇ'}\n\n` +
        `📌 *${toSmallCaps('usage')}:* .mode public ${toSmallCaps('or')} .mode private`,
      contextInfo: contextInfo
    }, { quoted: msg });
  }

  db.setBotMode(cleanBot, val);
  const modeMsg = val === 'public'
    ? `🌍 *${toSmallCaps('bot mode set to public')}*\n${toSmallCaps('everyone can now access the commands')}.`
    : `🔒 *${toSmallCaps('bot mode set to private')}*\n${toSmallCaps('only owners can now access the commands')}.`;

  await sock.sendMessage(from, { text: modeMsg, contextInfo: contextInfo }, { quoted: msg });
  await react('✅');
};

// ─── .addowner ────────────────────────────────
const addowner = async (ctx) => {
  const { msg, args, botNum, react, from, sock, sender, isOwner } = ctx;

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const senderNum = (sender || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  const isMainOwner = isOwner && (
    senderNum === cleanBot ||
    !db.isSecondOwner(cleanBot, senderNum)
  );
  if (!isMainOwner) return ctx.reply(`❌ *${toSmallCaps('owner only command')}!*`);

  const { setOwner } = require('../handlers/messageHandler');

  const targetJid = await resolveTarget(sock, ctx, args);

  if (!targetJid) return ctx.reply(
    `❌ *${toSmallCaps('please tag, reply or provide a number')}*\n\n` +
    `📌 *${toSmallCaps('usage')}:* .addowner @user ${toSmallCaps('or')} .addowner <number>`
  );

  const cleanNum = targetJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

  setOwner(cleanBot, cleanNum);
  db.addSecondOwner(cleanBot, cleanNum);

  await react('✅');
  await sock.sendMessage(from, {
    text: `✅ *${toSmallCaps('new owner appointed')}*\n\n🌟 *${toSmallCaps('user')}:* @${cleanNum}\n${toSmallCaps('status now second owner')}`,
    mentions: [targetJid]
  }, { quoted: msg });
};

// ─── .removeowner ─────────────────────────────
const removeowner = async (ctx) => {
  const { msg, args, botNum, react, from, sock, sender, isOwner } = ctx;

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const senderNum = (sender || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  const isMainOwner = isOwner && (
    senderNum === cleanBot ||
    !db.isSecondOwner(cleanBot, senderNum)
  );
  if (!isMainOwner) return ctx.reply(`❌ *${toSmallCaps('owner only command')}!*`);

  const { removeSecondOwner } = require('../handlers/messageHandler');

  const targetJid = await resolveTarget(sock, ctx, args);

  if (!targetJid) return ctx.reply(
    `❌ *${toSmallCaps('please tag, reply or provide a number')}*\n\n` +
    `📌 *${toSmallCaps('usage')}:* .removeowner @user ${toSmallCaps('or')} .removeowner <number>`
  );

  const targetNum = targetJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

  if (targetNum === cleanBot) {
    return ctx.reply(`❌ *ɪ ᴄᴀɴ'ᴛ ʀᴇᴍᴏᴠᴇ ᴍʏꜱᴇʟꜰ ꜰʀᴏᴍ ᴛʜᴇ ᴏᴡɴᴇʀ*`);
  }

  if (typeof removeSecondOwner === 'function') removeSecondOwner(cleanBot, targetNum);
  db.removeSecondOwner(cleanBot, targetNum);

  await react('✅');
  await sock.sendMessage(from, {
    text: `✅ *${toSmallCaps('owner privileges revoked')}*\n\n👤 *${toSmallCaps('user')}:* @${targetNum}`,
    mentions: [targetJid]
  }, { quoted: msg });
};

// ─── .welcome ─────────────────────────────────
const welcome = async (ctx) => {
  const { args, react, botNum, from, isGroup, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!isGroup) return ctx.reply(`❌ *${toSmallCaps('this command is for groups only')}!*`);

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const val = args[0]?.toLowerCase();

  if (!val || !['on', 'off'].includes(val)) {
    const current = db.isWelcomeOn(botNum);
    return sock.sendMessage(from, {
      text:
        `👋 *${toSmallCaps('welcome status')}:* ${current ? '✅ ᴏɴ' : '❌ ᴏғғ'}\n\n` +
        `📌 *${toSmallCaps('usage')}:* .welcome on ${toSmallCaps('or')} .welcome off`
    }, { quoted: msg });
  }

  db.setWelcome(val === 'on', cleanBot);
  await react('✅');
  await sock.sendMessage(from, { text: `✅ *${toSmallCaps('welcome messages are now')} ${val.toUpperCase()}*` }, { quoted: msg });
};

// ─── .bye ─────────────────────────────────────
const bye = async (ctx) => {
  const { args, react, botNum, from, isGroup, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!isGroup) return ctx.reply(`❌ *${toSmallCaps('this command is for groups only')}!*`);

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const val = args[0]?.toLowerCase();

  if (!val || !['on', 'off'].includes(val)) {
    const current = db.isByeOn(botNum);
    return sock.sendMessage(from, {
      text:
        `👋 *${toSmallCaps('bye status')}:* ${current ? '✅ ᴏɴ' : '❌ ᴏғғ'}\n\n` +
        `📌 *${toSmallCaps('usage')}:* .bye on ${toSmallCaps('or')} .bye off`
    }, { quoted: msg });
  }

  db.setBye(val === 'on', cleanBot);
  await react('✅');
  await sock.sendMessage(from, { text: `✅ *${toSmallCaps('left messages are now')} ${val.toUpperCase()}*` }, { quoted: msg });
};

// ─── .pnotify ─────────────────────────────────
const pnotify = async (ctx) => {
  const { args, react, botNum, from, isGroup, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!isGroup) return ctx.reply(`❌ *${toSmallCaps('this command is for groups only')}!*`);

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const val = args[0]?.toLowerCase();

  if (!val || !['on', 'off'].includes(val)) {
    const current = db.isPnotifyOn(botNum);
    return sock.sendMessage(from, {
      text:
        `⭐ *${toSmallCaps('promote notify status')}:* ${current ? '✅ ᴏɴ' : '❌ ᴏғғ'}\n\n` +
        `📌 *${toSmallCaps('usage')}:* .pnotify on ${toSmallCaps('or')} .pnotify off`
    }, { quoted: msg });
  }

  db.setPnotify(val === 'on', cleanBot);
  await react('✅');
  await sock.sendMessage(from, { text: `✅ *${toSmallCaps('promote notifications are now')} ${val.toUpperCase()}*` }, { quoted: msg });
};

// ─── .dnotify ─────────────────────────────────
const dnotify = async (ctx) => {
  const { args, react, botNum, from, isGroup, sock, msg } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireOwner()) return;
  if (!isGroup) return ctx.reply(`❌ *${toSmallCaps('this command is for groups only')}!*`);

  const cleanBot = botNum.replace(/[^0-9]/g, '');
  const val = args[0]?.toLowerCase();

  if (!val || !['on', 'off'].includes(val)) {
    const current = db.isDnotifyOn(botNum);
    return sock.sendMessage(from, {
      text:
        `🔻 *${toSmallCaps('demote notify status')}:* ${current ? '✅ ᴏɴ' : '❌ ᴏғғ'}\n\n` +
        `📌 *${toSmallCaps('usage')}:* .dnotify on ${toSmallCaps('or')} .dnotify off`
    }, { quoted: msg });
  }

  db.setDnotify(val === 'on', cleanBot);
  await react('✅');
  await sock.sendMessage(from, { text: `✅ *${toSmallCaps('demote notifications are now')} ${val.toUpperCase()}*` }, { quoted: msg });
};

// ✅ siminfo aur cnicinfo COMPLETELY REMOVED - Sirf yeh commands export ho rahi hain
module.exports = {
  broadcast, clearsess, restart, mode,
  setppgc, warn, resetwarn, afk, addowner, removeowner,
  welcome, bye, pnotify, dnotify,
  del, getpp
};