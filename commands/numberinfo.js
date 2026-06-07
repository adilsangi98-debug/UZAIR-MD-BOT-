/**
 * NUMBER INFO COMMAND - Get SIM/Number Information
 * COMMAND: .numberinfo <phone-number>
 * EXAMPLE: .numberinfo 923001234567
 */

'use strict';

const axios = require('axios');

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

module.exports = {
    name: 'numberinfo',
    aliases: ['numinfo', 'whonumber', 'phonedata'],
    category: 'utility',
    description: 'Get information about any phone number',
    usage: '.numberinfo <phone-number>\n📌 Example: .numberinfo 923001234567',

    async execute(sock, msg, args, extra) {
        try {
            if (!args.length) {
                return extra.reply(makeBox('NUMBER INFO', `❌ Please provide a phone number!
┃
┃ 📝 Usage: .numberinfo 923018787786
┃
┃ 📌 Example: .numberinfo 923001234567
┃
┃ 👨‍💻 Developer By Ammar Rai`));
            }

            let phoneNumber = args[0];
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

            if (phoneNumber.startsWith('0')) {
                phoneNumber = '92' + phoneNumber.substring(1);
            } else if (!phoneNumber.startsWith('92')) {
                if (phoneNumber.startsWith('+92')) {
                    phoneNumber = phoneNumber.substring(1);
                } else if (phoneNumber.length === 10) {
                    phoneNumber = '92' + phoneNumber;
                }
            }

            if (phoneNumber.length < 11 || phoneNumber.length > 12) {
                return extra.reply(makeBox('ERROR', `❌ Invalid phone number!
┃
┃ Please enter a valid number.
┃
┃ 📝 Example: 923001234567
┃
┃ 👨‍💻 Developer By Ammar Rai`));
            }

            await extra.react('⏳');

            const apiUrl = `https://ammar-all-international-number-sim.vercel.app/${phoneNumber}`;
            const response = await axios.get(apiUrl, { timeout: 15000 });

            if (!response.data ||
                !response.data.SYSTEM_LOG ||
                response.data.SYSTEM_LOG.status !== 'Success') {
                throw new Error('Number not found or API error');
            }

            const resultData = response.data.SEARCH_RESULT;
            const fullName = resultData.full_name || 'N/A';
            const formattedNumber = resultData.phone_number || phoneNumber;

            const outputMessage = makeBox('NUMBER INFORMATION', `👤 NAME: ${fullName}
┃
┃ 📞 NUMBER: ${formattedNumber}
┃
┃ 👨‍💻 DEVELOPER BY AMMAR RAI`);

            await extra.reply(outputMessage);
            await extra.react('✅');

        } catch (error) {
            console.error('Number Info Error:', error);

            let errorMessage = makeBox('ERROR', `❌ FAILED TO GET NUMBER INFO
┃
┃ ⚠️ `);

            if (error.response) {
                errorMessage += `Server error. Please try again later.`;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage += `Server timeout. Please try again.`;
            } else if (error.message === 'Number not found or API error') {
                errorMessage += `Number not found in database.`;
            } else {
                errorMessage += `Network error. Check your connection.`;
            }

            errorMessage += `
┃
┃ 📝 Usage: .numberinfo 923001234567
┃
┃ 👨‍💻 DEVELOPER BY AMMAR RAI`;

            await extra.reply(errorMessage);
            await extra.react('❌');
        }
    }
};