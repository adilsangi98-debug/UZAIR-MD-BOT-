// ============================================
//      BASDHAH MD BOT – COMMANDS/GROUP.JS
//      Group Management Commands
// ============================================

'use strict';

const safeOpts = (ctx, extra = {}) => {
  if (ctx.isGroup || ctx.msg?.key?.fromMe) {
    return { quoted: ctx.msg, ...extra };
  }
  return { ...extra };
};

const { authMiddleware } = require('../middleware/auth');
const { toSmallCaps }    = require('../utils/fonts');
const { getMentions, jidToNumber } = require('../utils/helpers');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const db = require('../database/db');

const setppgc = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup()) return;
  if (!await auth.requireAdmin()) return;
  if (!await auth.requireBotAdmin()) return;

  const quotedInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg  = quotedInfo?.quotedMessage;
  const mediaMsg   = quotedMsg || msg.message;
  const innerMsg   = mediaMsg?.imageMessage;
  if (!innerMsg) return await ctx.reply(`❌ *${toSmallCaps('please reply to an image')}!*`);

  await react('⏳');
  try {
    const fakeMsg = quotedMsg
      ? { key: { remoteJid: from, id: quotedInfo.stanzaId || msg.key.id, participant: quotedInfo.participant || msg.key.participant, fromMe: false }, message: quotedMsg }
      : msg;
    const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
    await sock.updateProfilePicture(from, buffer);
    await ctx.reply(`✅ *${toSmallCaps('group icon updated')}*`);
    await react('✅');
  } catch (err) {
    console.error('SetPPGC Error:', err);
    await ctx.reply(`❌ *${toSmallCaps('failed')}:* ${err.message}`);
    await react('❌');
  }
};

// ─── .kick ────────────────────────────────────────────
const kick = async (ctx) => {
  const { sock, from, msg, args, react, botNum } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  const mentions = getMentions(msg.message);
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
  
  const target = mentions[0] || quotedParticipant || (args[0] ? (args[0].includes('@') ? args[0] : `${args[0].replace(/[^0-9]/g,'')}@s.whatsapp.net`) : null);

  if (!target) return ctx.reply(`❌ *${toSmallCaps('tag reply or provide a number to kick')}!*`);
  
  if (target.includes(botNum.split('@')[0].split(':')[0])) {
    return ctx.reply(`❌ *${toSmallCaps('i cannot kick myself')}*`);
  }

  await react('⏳');
  try {
    await sock.groupParticipantsUpdate(from, [target], 'remove');
    const displayId = target.split('@')[0].split(':')[0];
    await sock.sendMessage(from, {
      text: `✅ @${displayId} *${toSmallCaps('kicked successfully')}*`,
      mentions: [target],
    }, { quoted: msg });
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to kick make sure i am admin')}*`);
    await react('❌');
  }
};

// ─── .add ─────────────────────────────────────────────
const add = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  let rawNum = args[0]?.replace(/[^0-9]/g, '') || '';
  if (!rawNum) return ctx.reply(`❌ *${toSmallCaps('provide a number to add')}!*`);

  if (rawNum.startsWith('0') && rawNum.length <= 11) {
    rawNum = '92' + rawNum.slice(1);
  }
  
  if (rawNum.length < 9) {
    return ctx.reply(`❌ *${toSmallCaps('invalid number include country code')}*`);
  }

  await react('⏳');
  try {
    const jid = `${rawNum}@s.whatsapp.net`;

    // WhatsApp pe check karo pehle ke number exist karta hai
    const [result] = await sock.onWhatsApp(rawNum);
    if (!result?.exists) {
      await react('❌');
      return ctx.reply(`❌ *${toSmallCaps('this number is not on whatsapp')}*`);
    }

    // Actual JID use karo jo WhatsApp ne diya (LID safe)
    const actualJid = result.jid || jid;

    await sock.groupParticipantsUpdate(from, [actualJid], 'add');
    await sock.sendMessage(from, {
        text: `✅ @${rawNum} *${toSmallCaps('added successfully')}*`,
        mentions: [actualJid]
    }, { quoted: msg });
    await react('✅');
  } catch (err) {
    console.error('Add Error:', err);
    // Ban error specifically handle karo
    const errMsg = err?.message || '';
    if (errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
      await ctx.reply(`❌ *${toSmallCaps('cannot add – user may have restricted group invites')}*`);
    } else {
      await ctx.reply(`❌ *${toSmallCaps('failed to add user')}*: ${errMsg}`);
    }
    await react('❌');
  }
};

// ─── .promote ─────────────────────────────────────────
const promote = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  const mentions = getMentions(msg.message);
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
  const target = mentions[0] || quotedParticipant || (args[0] ? (args[0].includes('@') ? args[0] : `${args[0].replace(/[^0-9]/g,'')}@s.whatsapp.net`) : null);

  if (!target) return ctx.reply(`❌ *${toSmallCaps('tag someone to promote')}!*`);

  const displayId = target.split('@')[0].split(':')[0];

  await react('⏳');
  try {
    await sock.groupParticipantsUpdate(from, [target], 'promote');
    await sock.sendMessage(from, {
      text: `⭐ @${displayId} *${toSmallCaps('promoted to admin successfully')}*`,
      mentions: [target],
    }, { quoted: msg });
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to promote')}*`);
    await react('❌');
  }
};

// ─── .demote ──────────────────────────────────────────
const demote = async (ctx) => {
  const { sock, from, msg, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  const mentions = getMentions(msg.message);
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
  const target = mentions[0] || quotedParticipant || (args[0] ? (args[0].includes('@') ? args[0] : `${args[0].replace(/[^0-9]/g,'')}@s.whatsapp.net`) : null);

  if (!target) return ctx.reply(`❌ *${toSmallCaps('tag someone to demote')}!*`);

  const displayId = target.split('@')[0].split(':')[0];

  await react('⏳');
  try {
    await sock.groupParticipantsUpdate(from, [target], 'demote');
    await sock.sendMessage(from, {
      text: `🔻 @${displayId} *${toSmallCaps('demoted from admin successfully')}*`,
      mentions: [target],
    }, { quoted: msg });
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to demote')}*`);
    await react('❌');
  }
};

// ─── .mute ────────────────────────────────────────────
const mute = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  await react('⏳');
  try {
    await sock.groupSettingUpdate(from, 'announcement');
    db.setMute(from, true);
    await ctx.reply(`🔇 *${toSmallCaps('group has been muted only admins can message')}*`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to mute group')}*`);
    await react('❌');
  }
};

// ─── .unmute ──────────────────────────────────────────
const unmute = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  await react('⏳');
  try {
    await sock.groupSettingUpdate(from, 'not_announcement');
    db.setMute(from, false);
    await ctx.reply(`🔊 *${toSmallCaps('group has been unmuted everyone can message')}*`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to unmute group')}*`);
    await react('❌');
  }
};

// ─── .tagall ──────────────────────────────────────────
// Owner: admin na ho tab bhi chala sakta hai
// Admin: normal flow
// Regular users: block
const tagall = async (ctx) => {
  const { sock, from, msg, args, react, isOwner } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup()) return;

  // Owner bypass – agar owner hai to admin check skip
  if (!isOwner) {
    if (!await auth.requireAdmin()) return;
  }

  await react('📢');
  try {
    const meta    = await sock.groupMetadata(from);
    const members = meta.participants.map(p => p.id);
    const text    = args.join(' ') || `${toSmallCaps('attention everyone')}`;
    const tagText = `📢 *${text}*\n\n` + members.map(m => `@${m.split('@')[0]}`).join(' ');

    await sock.sendMessage(from, { text: tagText, mentions: members }, { quoted: msg });
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to tag all')}*`);
    await react('❌');
  }
};

// ─── .hidetag ─────────────────────────────────────────
// Owner: admin na ho tab bhi chala sakta hai
// Admin: normal flow
// Regular users: block
const hidetag = async (ctx) => {
  const { sock, from, msg, args, react, isOwner } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup()) return;

  // Owner bypass – agar owner hai to admin check skip
  if (!isOwner) {
    if (!await auth.requireAdmin()) return;
  }

  await react('📢');
  try {
    const meta       = await sock.groupMetadata(from);
    const members    = meta.participants.map(p => p.id);
    const quotedInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg  = quotedInfo?.quotedMessage;

    if (quotedMsg) {
      const msgType = Object.keys(quotedMsg)[0];

      let sendPayload;
      if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
        const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
        sendPayload = { text, mentions: members };
      } else if (msgType === 'imageMessage') {
        const fakeMsg = { key: { remoteJid: from, id: quotedInfo.stanzaId || msg.key.id, participant: quotedInfo.participant || msg.key.participant, fromMe: false }, message: quotedMsg };
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
        sendPayload = { image: buffer, caption: quotedMsg.imageMessage?.caption || '', mentions: members };
      } else if (msgType === 'videoMessage') {
        const fakeMsg = { key: { remoteJid: from, id: quotedInfo.stanzaId || msg.key.id, participant: quotedInfo.participant || msg.key.participant, fromMe: false }, message: quotedMsg };
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
        sendPayload = { video: buffer, caption: quotedMsg.videoMessage?.caption || '', mentions: members };
      } else if (msgType === 'audioMessage') {
        const fakeMsg = { key: { remoteJid: from, id: quotedInfo.stanzaId || msg.key.id, participant: quotedInfo.participant || msg.key.participant, fromMe: false }, message: quotedMsg };
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
        sendPayload = { audio: buffer, mimetype: 'audio/mp4', mentions: members };
      } else if (msgType === 'stickerMessage') {
        const fakeMsg = { key: { remoteJid: from, id: quotedInfo.stanzaId || msg.key.id, participant: quotedInfo.participant || msg.key.participant, fromMe: false }, message: quotedMsg };
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer');
        sendPayload = { sticker: buffer };
      } else {
        const text = args.join(' ') || `${toSmallCaps('hidden tag notification')}`;
        sendPayload = { text, mentions: members };
      }

      await sock.sendMessage(from, sendPayload, { quoted: msg });
    } else {
      const text = args.join(' ') || `${toSmallCaps('hidden tag notification')}`;
      await sock.sendMessage(from, { text, mentions: members }, { quoted: msg });
    }

    await react('✅');
  } catch (err) {
    console.error('Hidetag Error:', err);
    await ctx.reply(`❌ *${toSmallCaps('failed to send hidetag')}*`);
    await react('❌');
  }
};

// ─── .groupinfo ───────────────────────────────────────
const groupinfo = async (ctx) => {
  const { sock, from, msg, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup()) return;

  await react('ℹ️');
  try {
    const meta    = await sock.groupMetadata(from);
    const admins  = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`).join(', ');
    const created = new Date(meta.creation * 1000).toLocaleDateString();

    const text =
`👥 *${toSmallCaps('group information')}*

━━━━━━━━━━━━━━━━━━━━
📛 *${toSmallCaps('name')}:* ${meta.subject}
📝 *${toSmallCaps('description')}:* ${meta.desc || 'None'}
👤 *${toSmallCaps('members')}:* ${meta.participants.length}
👑 *${toSmallCaps('admins')}:* ${admins || 'None'}
📅 *${toSmallCaps('created')}:* ${created}
🆔 *${toSmallCaps('jid')}:* ${from}
━━━━━━━━━━━━━━━━━━━━`;

    await sock.sendMessage(from, { text, mentions: meta.participants.map(p => p.id) }, { quoted: msg });
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to fetch group info')}*`);
  }
};

// ─── .setname ─────────────────────────────────────────
const setname = async (ctx) => {
  const { sock, from, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  const name = args.join(' ');
  if (!name) return ctx.reply(`❌ *${toSmallCaps('provide a new group name')}!*`);

  await react('⏳');
  try {
    await sock.groupUpdateSubject(from, name);
    await ctx.reply(`✅ *${toSmallCaps('group name changed successfully')}*`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to change group name')}*`);
    await react('❌');
  }
};

// ─── .setdesc ─────────────────────────────────────────
const setdesc = async (ctx) => {
  const { sock, from, args, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  const desc = args.join(' ');
  if (!desc) return ctx.reply(`❌ *${toSmallCaps('provide a new description')}!*`);

  await react('⏳');
  try {
    await sock.groupUpdateDescription(from, desc);
    await ctx.reply(`✅ *${toSmallCaps('group description updated successfully')}*`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to update description')}*`);
    await react('❌');
  }
};

// ─── .linkgc ──────────────────────────────────────────
const linkgc = async (ctx) => {
  const { sock, from, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())  return;
  if (!await auth.requireAdmin())  return;

  await react('🔗');
  try {
    const link = await sock.groupInviteCode(from);
    await ctx.reply(`🔗 *${toSmallCaps('group invite link')}*:\nhttps://chat.whatsapp.com/${link}`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to get invite link')}*`);
    await react('❌');
  }
};

// ─── .revokegc ────────────────────────────────────────
const revokegc = async (ctx) => {
  const { sock, from, react } = ctx;
  const auth = authMiddleware(ctx);
  if (!await auth.requireGroup())    return;
  if (!await auth.requireAdmin())    return;
  if (!await auth.requireBotAdmin()) return;

  await react('⏳');
  try {
    await sock.groupRevokeInvite(from);
    await ctx.reply(`✅ *${toSmallCaps('group invite link has been reset')}*`);
    await react('✅');
  } catch {
    await ctx.reply(`❌ *${toSmallCaps('failed to reset invite link')}*`);
    await react('❌');
  }
};

// ─── .antilink ────────────────────────────────────────
const antilink = async (ctx) => {
  const { from, args, react, botNum } = ctx;
  const auth = authMiddleware(ctx);
  
  if (!await auth.requireGroup())    return;
  if (!await auth.requireOwner())    return;

  const toggle = args[0]?.toLowerCase();
  const cleanBot = botNum.replace(/[^0-9]/g, '');

  if (!toggle || !['on','off'].includes(toggle)) {
    const current = db.isAntiLink(from, cleanBot);
    return ctx.reply(`🔗 *${toSmallCaps('antilink status')}:* ${current ? '✅ ᴏɴ' : '❌ ᴏꜰꜰ'}`);
  }

  const value = toggle === 'on';
  db.setAntiLink(from, value, cleanBot);
  await ctx.reply(`🔗 *${toSmallCaps('antilink system')}* ${value ? '✅ ᴇɴᴀʙʟᴇᴅ' : '❌ ᴅɪsᴀʙʟᴇᴅ'}`);
  await react('✅');
};

module.exports = {
  kick, add, promote, demote, mute, unmute,
  tagall, hidetag, groupinfo, setname, setdesc,
  linkgc, revokegc, antilink, setppgc,
};
