'use strict';
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

module.exports = {
    antikeyword: async (ctx) => {
        const { args, from, botNum, reply } = ctx;
        const auth = authMiddleware(ctx);
        if (!await auth.requireOwner()) return;

        const action = args[0]?.toLowerCase();
        const keyword = args.slice(1).join(' ');

        if (action === 'add' && keyword) {
            db.addAntiKeyword(from, keyword, botNum);
            return reply(`✅ Keyword *${keyword}* has been added to the anti-keyword list.`);
        } else if (action === 'remove' && keyword) {
            db.removeAntiKeyword(from, keyword, botNum);
            return reply(`✅ Keyword *${keyword}* has been removed.`);
        } else if (action === 'list') {
            const list = db.getAntiKeywords(from, botNum);
            return reply(`📜 *Anti-Keywords List:*\n${list.length > 0 ? list.join(', ') : 'No keywords set.'}`);
        } else {
            return reply(`❌ *Usage:*\n.antikeyword add [word]\n.antikeyword remove [word]\n.antikeyword list`);
        }
    }
};