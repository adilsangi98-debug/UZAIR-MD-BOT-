/**
 * Get WhatsApp Channel ID (Newsletter JID) from invite link
 * COMMAND: .getcid <channel-invite-link>
 * EXAMPLE: .getcid https://whatsapp.com/channel/xxxxx
 */

'use strict';

const makeBox = (title, content) => {
  return `╭━ ${title} ━╮
┃
${content.split('\n').map(line => `┃ ${line}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━╯`;
};

module.exports = {
  name: 'getcid',
  aliases: ['getchannelid', 'cid', 'channelid'],
  category: 'utility',
  description: '📢 Get WhatsApp Channel ID from invite link',
  usage: '.getcid <channel-invite-link>\n📌 Example: .getcid https://whatsapp.com/channel/xxxxx',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;

    const link = args[0];
    if (!link) {
      return reply(makeBox('GET CHANNEL ID', `❌ Please provide a channel invite link.
┃
┃ 📌 Example: .getcid https://whatsapp.com/channel/xxxxx`));
    }

    let inviteCode = null;
    if (link.includes('whatsapp.com/channel/')) {
      const parts = link.split('/');
      inviteCode = parts[parts.length - 1];
    } else {
      return reply(makeBox('ERROR', `❌ Invalid link.
┃ Provide a valid WhatsApp Channel invite link.`));
    }

    if (!inviteCode || inviteCode.length < 10) {
      return reply(makeBox('ERROR', `❌ Could not extract invite code from the link.`));
    }

    try {
      await react('⏳');

      const channelInfo = await sock.newsletterMetadata('invite', inviteCode);

      if (!channelInfo || !channelInfo.id) {
        throw new Error('No channel information found.');
      }

      const name = channelInfo.name || 'Unknown Channel';
      const channelId = channelInfo.id;
      const description = channelInfo.description || 'No description';
      const subscribers = channelInfo.subscribers || '?';
      const state = channelInfo.state || 'ACTIVE';

      const resultText = makeBox('CHANNEL ID', `📢 Name: ${name}
┃ 🆔 ID: ${channelId}
┃ 📝 Description: ${description}
┃ 👥 Subscribers: ${subscribers}
┃ 🔗 Invite Link: ${link}`);

      await reply(resultText);
      await react('✅');
    } catch (error) {
      console.error('Get channel ID error:', error);
      await reply(makeBox('ERROR', `❌ Failed to get channel ID: ${error.message}`));
      await react('❌');
    }
  }
};