/**
 * SIM Database Lookup Command
 * COMMAND: .siminfo
 * USAGE: .siminfo <mobile number or CNIC>
 * EXAMPLES: .siminfo 03018787786 | .siminfo 3520112345678
 */

'use strict';

const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

async function fetchWithRetry(url, maxRetries = 3, timeout = 20000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
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

const siminfo = async (ctx) => {
  const { sock, args, react, from, msg } = ctx;

  try {
    await react('⚠️');

    if (!args.length) {
      return ctx.reply(`❌ *Provide mobile number or CNIC*\n\n📌 *Examples:*\n.siminfo 03018787786\n.siminfo 3520112345678`);
    }

    await react('⏳');

    const raw = args.join('').replace(/\D/g, '');
    if (!raw) {
      return ctx.reply('❌ *Only digits allowed*\n📌 *Example:* .siminfo 03018787786');
    }

    let query = null;

    // Pakistani mobile number detection
    if (raw.length === 11 && raw.startsWith('03')) {
      query = raw;
    }
    else if (raw.length === 10 && raw.startsWith('3')) {
      query = '0' + raw;
    }
    else if (raw.length === 12 && raw.startsWith('92')) {
      query = '0' + raw.slice(2);
    }
    // CNIC detection (13 digits)
    else if (raw.length === 13) {
      query = raw;
    } else {
      return ctx.reply(`❌ *Invalid format*\n\n✅ *Valid formats:*\n• 03018787786 (11 digits)\n• 923018787786 (12 digits)\n• 3123456789 (10 digits)\n• 3520112345678 (13 digits CNIC)`);
    }

    const apiUrl = `https://ammar-sim-database-api-786.vercel.app/api/database?number=${encodeURIComponent(query)}`;
    
    let response;
    try {
      response = await fetchWithRetry(apiUrl, 3, 20000);
    } catch (err) {
      return ctx.reply(`❌ *API unreachable*\n📌 *Try again later*\n\nExample: .siminfo 03018787786`);
    }

    const result = response.data;

    if (!result || result.status === false || !result.data || result.data.length === 0) {
      return ctx.reply(`╭━ ❌ SIM INFO ━╮
┃
┃ 🚫 *NO RECORD FOUND*
┃
┃ 📞 Input: ${query}
┃
┃ 📌 Try: .siminfo 03018787786
┃
╰━━━━━━━━━━━━━━━╯`);
    }

    // Get all records (multiple SIMs on same CNIC)
    const records = result.data;
    let replyText = `╭━ 📡 SIM DATABASE ━╮
┃
┃ 🔍 *TOTAL RECORDS:* ${records.length}
┃
`;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const simNumber = record.sim_number || record.number || query;
      const name = record.full_name || record.name || 'N/A';
      const cnic = record.cnic || 'N/A';
      const address = record.address || 'N/A';
      
      replyText += `┃ 📌 *RECORD ${i + 1}*
┃
┃ 📞 *Number* : ${simNumber}
┃ 👤 *Name*   : ${name}
┃ 🆔 *CNIC*   : ${cnic}
┃ 🏠 *Address*: ${address}
┃
`;
    }

    replyText += `╰━━━━━━━━━━━━━━━╯
⚠️ *Use at your own risk.*`;

    await sock.sendMessage(from, { text: replyText }, { quoted: msg });
    await react('✅');
    
  } catch (error) {
    console.error('SIM command error:', error.message);
    await ctx.reply(`╭━ ❌ ERROR ━╮
┃
┃ ❌ *Error:* ${error.message}
┃
┃ 📌 *Try:* .siminfo 03018787786
┃
╰━━━━━━━━━━━━━━━╯`);
    await react('❌');
  }
};

module.exports = { siminfo };