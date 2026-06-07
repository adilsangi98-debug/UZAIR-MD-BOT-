/**
 * Hack Command - Hacking prank animation
 * COMMAND: .hack
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
  name: 'hack',
  aliases: [],
  category: 'fun',
  description: '💻 Hacking prank animation',
  usage: '.hack',
  
  async execute(sock, msg, args, extra) {
    const { from } = extra;
    
    await extra.react('💻');
    
    const steps = [
      'Injecting Malware',
      '█ 10%',
      '██ 20%',
      '███ 30%',
      '████ 40%',
      '█████ 50%',
      '██████ 60%',
      '███████ 70%',
      '████████ 80%',
      '█████████ 90%',
      '██████████ 100%',
      'System hijacking in process...',
      'Connecting to server...',
      'Device successfully connected!',
      'Receiving data...',
      'Data hijacked 100% completed',
      'Killing all evidence...',
      'HACKING COMPLETED!',
      'Sending logs...',
      'SUCCESSFULLY SENT DATA',
      'Connection disconnected',
      'BACKLOGS CLEARED'
    ];
    
    for (const line of steps) {
      await sock.sendMessage(from, { 
        text: makeBox('HACKING', line)
      }, { quoted: msg });
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    await extra.react('✅');
  }
};