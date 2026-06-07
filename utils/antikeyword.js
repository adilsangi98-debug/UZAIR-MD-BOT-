'use strict';
const db = require('../database/db');

const checkAntiKeyword = async (sock, msg, from, sender, body, botNum, isOwner) => {
    // Agar owner ka msg hai ya group nahi hai, toh check mat karo
    if (isOwner || !from.endsWith('@g.us')) return;

    const keywords = db.getAntiKeywords(from, botNum);
    if (!keywords || keywords.length === 0) return;

    // Body ka text lo
    const text = (body || '').toLowerCase();

    // Check karo kya koi keyword message mein hai
    const found = keywords.find(k => text.includes(k.toLowerCase()));

    if (found) {
        try {
            // Message delete karo (Edit hone par bhi ye trigger hoga)
            await sock.sendMessage(from, { delete: msg.key });
        } catch (err) {
            console.error('AntiKeyword Error:', err);
        }
    }
};

module.exports = { checkAntiKeyword };