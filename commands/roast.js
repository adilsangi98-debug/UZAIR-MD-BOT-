/**
 * Roast Command - Funny harmless roasts
 * COMMAND: .roast
 * USAGE: .roast OR .roast @mention
 * By UZAIR
 */

'use strict';

// ─── Box Design ───
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

// ─── 50+ Funny Roasts (Urdu/Hindi) ───
const roasts = [
  "Teri selfie dekh ke camera ne complaint file ki hai! 📸",
  "Tu itna slow hai ke tortoise bhi tujhe dekh ke hansता hai! 🐢",
  "Tere jokes itne boring hain ke log so jaate hain sunne se pehle! 😴",
  "Tera hairstyle dekh ke bijli bhi seedhi ho jaati hai! ⚡",
  "Tu itna bhoolta hai ke apna naam yaad karne ke liye ID card rakhta hai! 🪪",
  "Tere baal itne ulajhe hain ke GPS bhi rasta bhool jaaye! 🗺️",
  "Tu itna late aata hai ke log teri birthday party agle saal celebrate karte hain! 🎂",
  "Teri awaaz sun ke parinde bhi darawahanay le jaate hain! 🐦",
  "Tu itna drama karta hai ke Netflix ne usse reject kar diya! 🎬",
  "Teri cooking itni buri hai ke chips bhi paka deta hai! 🍟",
  "Tu itna sota hai ke neend bhi thak jaati hai! 😪",
  "Tera phone itna purana hai ke WhatsApp pe fax aata hai! 📠",
  "Tu itna aata hai late ke sunrise bhi teri wait nahi karta! 🌅",
  "Tere jokes sun ke log serious ho jaate hain! 😐",
  "Tu itna ziada khata hai ke fridge ne lock laga liya! 🔒",
  "Teri planning itni achi hai ke rain mein chhata ghar pe chhod aata hai! ☔",
  "Tu itna confused hai ke Google bhi tujhe results nahi deta! 🔍",
  "Tere shoes itne purane hain ke sole ne resign de di! 👟",
  "Tu itna ziada sochta hai ke calculator hang ho jaata hai! 🔢",
  "Teri speed itni slow hai ke sloth bhi tujhse aage hai! 🦥",
  "Tu itna ziada bolata hai ke dictionary bhi thak jaati hai! 📖",
  "Tere jokes itne purane hain ke dinosaurs bhi jaante the! 🦕",
  "Tu itna bhookha rehta hai ke menu dekh ke pyar ho jaata hai! 🍽️",
  "Teri smile dekh ke dentist ne new car kharidi! 😁",
  "Tu itna ziada game khelta hai ke reality ne unfollow kar diya! 🎮",
  "Tere bahanay itne creative hain ke Hollywood script likhni chahiye! 🎥",
  "Tu itna ziada so jaata hai ke alarm ne bhi umeed chhod di! ⏰",
  "Teri fashion sense dekh ke clothes ne protest kiya! 👗",
  "Tu itna ziada chai peeta hai ke blood group C+ hai! ☕",
  "Tere sawal itne mushkil hain ke teacher bhi Google karta hai! 👩‍🏫",
  "Tu itna ziada muskurata hai ke photo mein bhi aankhein band hoti hain! 😄",
  "Teri running speed dekh ke tortoise ne medal le liya! 🏅",
  "Tu itna ziada series dekhta hai ke characters tujhe personally jaante hain! 📺",
  "Tere excuses itne creative hain ke novel likhni chahiye! 📝",
  "Tu itna ziada positive hai ke negative number bhi seedha ho jaata hai! ➕",
  "Teri drawing dekh ke pencil ne break le li! ✏️",
  "Tu itna ziada late sona hai ke owls bhi sone chale jaate hain! 🦉",
  "Tere baal dekh ke wind bhi maafi maangti hai! 💨",
  "Tu itna ziada gata hai ke neighbors ne earplugs khareed liye! 🎤",
  "Teri typing speed itni slow hai ke snail ne tujhe overtake kiya! 🐌",
  "Tu itna ziada hansa ke abs aane wale the, phir ruk gaye! 😂",
  "Teri yadasht itni achi hai ke kal ki baat aaj bhool jaata hai! 🧠",
  "Tu itna ziada online rehta hai ke WiFi ne personal space maangi! 📶",
  "Tere kapde dekh ke rainbow ne copyright claim kiya! 🌈",
  "Tu itna ziada advice deta hai ke Google jealous ho gaya! 💡",
  "Teri neend itni gehra hai ke earthquake bhi wake nahi kar sakti! 🌍",
  "Tu itna ziada bahas karta hai ke dictionary ne surrender kar diya! 📚",
  "Tere plans itne achay hain ke sirf plans hi rehte hain! 📋",
  "Tu itna ziada mitha khata hai ke sugar bhi teri parwah karta hai! 🍭",
  "Teri punctuality dekh ke clock ne time change kar liya! 🕐",
];

const getRandomRoast = () => roasts[Math.floor(Math.random() * roasts.length)];

module.exports = {
  name: 'roast',
  aliases: ['roastme', 'funny', 'mazak'],
  category: 'fun',
  description: '🔥 Get a funny roast',
  usage: '.roast',

  async execute(sock, msg, args, extra) {
    const { from, reply, react } = extra;

    try {
      try { await react('🔥'); } catch (e) {}

      const roast = getRandomRoast();

      const text = `🔥 *ROAST OF THE DAY* 🔥\n\n${roast}`;
      await reply(makeBox('🔥 ROAST TIME', text));

      try { await react('😂'); } catch (e) {}

    } catch (error) {
      console.error('Roast Error:', error.message);
      await reply(makeBox('❌ ERROR', 'Roast laane mein masla hua!\nDobara try karo!'));
      try { await react('❌'); } catch (e) {}
    }
  }
};
