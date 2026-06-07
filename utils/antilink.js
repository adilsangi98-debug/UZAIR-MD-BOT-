// ============================================
//      BADSHAH MD BOT — UTILS/ANTILINK.JS
//      Anti-Link Detection & Action System
// ============================================

'use strict';

const db     = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// ─── URL / Link Patterns (Aggressive Mode) ───
const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /[a-zA-Z0-9-]+\.(com|net|org|edu|gov|mil|int|biz|info|io|co|me|xyz|site|online|store|tech|tv|blog)/gi,
  /chat\.whatsapp\.com\/[^\s]+/gi,
  /whatsapp\.com\/channel\/[^\s]+/gi, 
  /tiktok\.com\/[^\s]+/gi,            
  /facebook\.com\/[^\s]+/gi,          
  /fb\.watch\/[^\s]+/gi,              
  /instagram\.com\/[^\s]+/gi,         
  /wa\.me\/[^\s]+/gi,
  /t\.me\/[^\s]+/gi,
  /discord\.gg\/[^\s]+/gi,
  /bit\.ly\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
];

const WA_GROUP_PATTERN = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/gi;

/**
 * Check if text contains ANY kind of link (Fixed: Using match for better detection)
 */
const hasLink = (text) => {
  if (!text) return false;
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  
  // Har pattern ko check karein ke kya woh text mein kahi bhi exist karta hai
  for (const pattern of LINK_PATTERNS) {
    if (str.match(pattern)) return true;
  }
  return false;
};

const hasWAGroupLink = (text) => {
  if (!text) return false;
  return WA_GROUP_PATTERN.test(text);
};

const getBaseId = (jid) => {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
};

/**
 * Handle anti-link check for a message
 */
const checkAntiLink = async (sock, msg, from, sender, body, botNum, isOwner) => {
  if (!from.endsWith('@g.us')) return false;

  const cleanBot = botNum.replace(/[^0-9]/g, '');

  if (!db.isAntiLink(from, cleanBot)) return false;
  if (isOwner) return false;

  try {
    const meta = await sock.groupMetadata(from);
    const senderBase = getBaseId(sender);
    const isAdmin = meta.participants.some(p => 
      getBaseId(p.id) === senderBase && (p.admin === 'admin' || p.admin === 'superadmin')
    );
    if (isAdmin) return false;
  } catch {
    return false;
  }

  // 1. Detect all links (Ab ye text ke saath link ko bhi detect karega)
  const containsLink = hasLink(body);

  // 2. Detect Forwarded Content (Channel/Newsletter)
  const context = msg.message?.extendedTextMessage?.contextInfo || 
                  msg.message?.imageMessage?.contextInfo || 
                  msg.message?.videoMessage?.contextInfo || 
                  msg.message?.audioMessage?.contextInfo || 
                  msg.message?.documentMessage?.contextInfo;

  const isChannelForward = !!context?.forwardedNewsletterMessageInfo || !!context?.isForwarded;

  if (containsLink || isChannelForward) {
    logger.warn(`Anti-link triggered in ${from} by ${sender}`);

    try {
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: msg.key.id,
          participant: msg.key.participant || sender
        }
      });

      await sock.updateBlockStatus(sender, 'block');

      return true;
    } catch (err) {
      logger.error('Anti-link error:', err.message);
      return false;
    }
  }

  return false;
};

module.exports = { hasLink, hasWAGroupLink, checkAntiLink };