'use strict';

const axios = require('axios');
const config = require('../config/config'); //

// Aapke bot ka signature box design style
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯`;
};

module.exports = {
  name: 'fatherday', // Main trigger command name aapke mutabiq .fatherday par set kiya
  aliases: ['fathersday', 'fatherdaywishes'], // Backup extra aliases
  category: 'fun', //
  description: '👨 Get a random Father’s Day wish', //
  usage: '.fatherday', //

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra; //
    
    try {
      await react('👨'); //
      
      const baseUrl = config.apis?.princetech?.baseUrl || 'https://api.princetechn.com/api'; //
      const apikey = config.apis?.princetech?.apiKey || 'prince'; //
      
      // Axios request with 30 seconds network timeout protocol guard
      const res = await axios.get(`${baseUrl}/fun/fathersday`, { params: { apikey }, timeout: 30000 }); //
      
      if (res.data?.result) { //
        const fatherWish = res.data.result.trim(); //
        
        // Output result wrapped beautifully inside your signature framework
        await reply(makeBox('👨 FATHER\'S DAY WISH 👨', fatherWish));
      } else {
        await reply(makeBox('SYSTEM LOG', '❌ No wishes found inside the server core database.')); //
      }
      
      await react('✅'); //
    } catch (e) {
      console.error('Fatherday Command Error:', e);
      await reply(makeBox('CRITICAL ERROR', `❌ Error: ${e.message}`)); //
      await react('❌'); //
    }
  }
};

