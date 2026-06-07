/**
 * Phone Info Plugin - Get detailed smartphone specifications
 * COMMAND: .phoneinfo <phone_name>
 * EXAMPLE: .phoneinfo poco f5
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
  name: 'phoneinfo',
  aliases: ['phone', 'phonespecs', 'specs', 'deviceinfo', 'mobileinfo', 'hp'],
  category: 'utility',
  description: 'Get detailed smartphone specifications',
  usage: '.phoneinfo <phone_name>\n📌 Example: .phoneinfo poco f5',
  
  async execute(sock, msg, args, extra) {
    try {
      if (!args || args.length === 0) {
        const helpMsg = makeBox('PHONE INFO', `📝 Usage: .phoneinfo <phone_name>
┃
┃ 📌 Examples:
┃ • .phoneinfo poco f5
┃ • .phoneinfo iphone 14
┃ • .phoneinfo samsung s23
┃
┃ 👨‍💻 Developer By UZAIR  Rai`);
        await extra.reply(helpMsg);
        return;
      }

      await extra.react('📱');
      
      const query = args.join(' ');
      
      await extra.reply(makeBox('PHONE INFO', `🔍 Searching: "${query}"
┃ ⏳ Please wait...`));
      
      let data = null;
      let error = null;
      
      const endpoints = [
        `https://api.yabes-desu.workers.dev/tools/phone-info?query=${encodeURIComponent(query)}`,
        `https://api.yabes-desu.workers.dev/tools/phone-info?query=${encodeURIComponent(query.toLowerCase())}`,
        `https://api.yabes-desu.workers.dev/tools/phone-info?query=${encodeURIComponent(query.replace(/ /g, '%20'))}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.data && response.data.success === true && response.data.phoneName) {
            data = response.data;
            console.log('API Success:', data.phoneName);
            break;
          }
        } catch (err) {
          console.log(`Endpoint failed: ${err.message}`);
          error = err;
        }
      }
      
      if (!data || !data.phoneName) {
        try {
          const altResponse = await axios.get(`https://api.yabes-desu.workers.dev/tools/phone-info?query=${encodeURIComponent(query)}`, {
            timeout: 15000
          });
          if (altResponse.data && altResponse.data.phoneName) {
            data = altResponse.data;
          }
        } catch (altErr) {
          console.log('Alternative API also failed');
        }
      }
      
      if (!data || !data.phoneName) {
        const notFoundMsg = makeBox('NOT FOUND', `🔍 Phone: "${query}"
┃
┃ ⚠️ Could not find specifications!
┃
┃ 💡 Try these formats:
┃ • .phoneinfo poco f5
┃ • .phoneinfo "iphone 14"
┃ • .phoneinfo samsung galaxy s23
┃
┃ 👨‍💻 Developer By UZAIR  Rai`);
        await extra.reply(notFoundMsg);
        await extra.react('❌');
        return;
      }
      
      const specs = data.specs || {};
      
      let infoText = `╭━ 📱 ${data.phoneName || 'Phone Specs'} ━╮\n┃\n`;
      
      if (specs.Launch) {
        infoText += `┃ 📅 Launched: ${specs.Launch.Announced || 'N/A'}\n`;
        infoText += `┃ ✅ Status: ${specs.Launch.Status || 'N/A'}\n┃\n`;
      }
      
      if (specs.Network && specs.Network.Technology) {
        infoText += `┃ 🌐 NETWORK\n`;
        infoText += `┃ • ${specs.Network.Technology}\n`;
        if (specs.Network['5G bands']) {
          let bands = specs.Network['5G bands'];
          if (bands.length > 40) bands = bands.substring(0, 40) + '...';
          infoText += `┃ • 5G: ${bands}\n`;
        }
        infoText += `┃\n`;
      }
      
      if (specs.Body) {
        infoText += `┃ 📏 BODY\n`;
        if (specs.Body.Dimensions) infoText += `┃ • Size: ${specs.Body.Dimensions}\n`;
        if (specs.Body.Weight) infoText += `┃ • Weight: ${specs.Body.Weight}\n`;
        if (specs.Body.Build && specs.Body.Build.length < 50) infoText += `┃ • Build: ${specs.Body.Build}\n`;
        infoText += `┃\n`;
      }
      
      if (specs.Display) {
        infoText += `┃ 📺 DISPLAY\n`;
        if (specs.Display.Type) {
          let displayType = specs.Display.Type;
          if (displayType.length > 45) displayType = displayType.substring(0, 42) + '...';
          infoText += `┃ • Type: ${displayType}\n`;
        }
        if (specs.Display.Size) infoText += `┃ • Size: ${specs.Display.Size}\n`;
        if (specs.Display.Resolution) infoText += `┃ • Resolution: ${specs.Display.Resolution}\n`;
        infoText += `┃\n`;
      }
      
      if (specs.Platform) {
        infoText += `┃ ⚙️ PLATFORM\n`;
        if (specs.Platform.OS) infoText += `┃ • OS: ${specs.Platform.OS}\n`;
        if (specs.Platform.Chipset) {
          let chipset = specs.Platform.Chipset;
          if (chipset.length > 45) chipset = chipset.substring(0, 42) + '...';
          infoText += `┃ • Chipset: ${chipset}\n`;
        }
        if (specs.Platform.CPU) {
          let cpu = specs.Platform.CPU;
          if (cpu.length > 45) cpu = cpu.substring(0, 42) + '...';
          infoText += `┃ • CPU: ${cpu}\n`;
        }
        infoText += `┃\n`;
      }
      
      if (specs.Memory) {
        infoText += `┃ 💾 MEMORY\n`;
        if (specs.Memory.Internal) {
          let internal = Array.isArray(specs.Memory.Internal) ? specs.Memory.Internal[0] : specs.Memory.Internal;
          if (internal && internal.length > 40) internal = internal.substring(0, 37) + '...';
          infoText += `┃ • Storage: ${internal}\n`;
        }
        if (specs.Memory['Card slot'] && specs.Memory['Card slot'] !== 'No') {
          infoText += `┃ • Card: ${specs.Memory['Card slot']}\n`;
        }
        infoText += `┃\n`;
      }
      
      if (specs['Main Camera']) {
        infoText += `┃ 📸 MAIN CAMERA\n`;
        if (specs['Main Camera'].Modules) {
          let cam = Array.isArray(specs['Main Camera'].Modules) ? specs['Main Camera'].Modules[0] : specs['Main Camera'].Modules;
          if (cam && cam.length > 45) cam = cam.substring(0, 42) + '...';
          infoText += `┃ • ${cam}\n`;
        }
        if (specs['Main Camera'].Video) {
          let video = specs['Main Camera'].Video;
          if (video.length > 45) video = video.substring(0, 42) + '...';
          infoText += `┃ • Video: ${video}\n`;
        }
        infoText += `┃\n`;
      }
      
      if (specs['Selfie Camera'] && specs['Selfie Camera'].Modules) {
        infoText += `┃ 🤳 SELFIE\n`;
        infoText += `┃ • ${specs['Selfie Camera'].Modules}\n┃\n`;
      }
      
      if (specs.Battery) {
        infoText += `┃ 🔋 BATTERY\n`;
        if (specs.Battery.Type) infoText += `┃ • ${specs.Battery.Type}\n`;
        if (specs.Battery.Charging) {
          let charging = specs.Battery.Charging;
          if (charging.length > 45) charging = charging.substring(0, 42) + '...';
          infoText += `┃ • Charging: ${charging}\n`;
        }
        infoText += `┃\n`;
      }
      
      if (specs.Misc && specs.Misc.Colors) {
        infoText += `┃ 🎨 COLORS\n`;
        infoText += `┃ • ${specs.Misc.Colors}\n┃\n`;
      }
      
      infoText += `╰━━━━━━━━━━━━━━━╯\n\n👨‍💻 Developer By UZAIR  Rai`;
      
      if (data.imageUrl && data.imageUrl !== "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f5-2.jpg") {
        try {
          await sock.sendMessage(extra.from, {
            image: { url: data.imageUrl },
            caption: infoText
          }, { quoted: msg });
        } catch (imgError) {
          await extra.reply(infoText);
        }
      } else {
        await extra.reply(infoText);
      }
      
      await extra.react('✅');
      console.log('Phone Info Sent Successfully');
      
    } catch (error) {
      console.error('Phone Info Error:', error);
      
      const errorMsg = makeBox('ERROR', `📛 Error: ${error.message || 'Unknown'}
┃
┃ 💡 Try these:
┃ • .phoneinfo iphone 14
┃ • .phoneinfo samsung s23
┃ • .phoneinfo poco f5
┃
┃ 👨‍💻 Developer By UZAIR  Rai`);
      
      await extra.reply(errorMsg);
      await extra.react('❌');
    }
  }
};