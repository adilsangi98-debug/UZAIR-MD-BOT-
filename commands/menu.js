// ============================================
//      UZAIR  MD BOT — COMMANDS/MENU.JS
//      .menu Command — Full Command List
// ============================================

'use strict';

const fs      = require('fs'); //
const path    = require('path'); //
const config  = require('../config/config'); //
const db      = require('../database/db');  //

const run = async (ctx) => {
  const { sock, msg, from, botNum, isGroup, react, sender } = ctx; //

  await react('⏳'); //

  // Animation
  if (isGroup) { //
    const { key } = await sock.sendMessage(from, { text: 'UZAIR  MD IS STARTING...' }, { quoted: msg }); //
    
    const frames = [
      { p: '25%',  b: '▰▱▱▱▱▱▱▱▱▱', s: 'CONNECTING...' },
      { p: '50%',  b: '▰▰▰▰▰▱▱▱▱▱', s: 'DOWNLOADING DATA...' },
      { p: '75%',  b: '▰▰▰▰▰▰▰▰▱▱', s: 'PROCESSING...' },
      { p: '100%', b: '▰▰▰▰▰▰▰▰▰▰', s: 'DONE!' }
    ]; //

    for (const frame of frames) { //
      let loadingText = `╭━ UZAIR  MD BOT ━╮\n┃ ${frame.b} ${frame.p}\n┃ ${frame.s}\n╰━━━━━━━━━━━━━━━╯`; //
      await sock.sendMessage(from, { edit: key, text: loadingText }); //
      await new Promise(resolve => setTimeout(resolve, 250));  //
    }
  }

  const prefix = config.prefix; //
  const time = new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' }); //
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); //
  const userName = msg.pushName || 'User'; //
  const botMode = db.getBotMode(botNum.replace(/[^0-9]/g,'')); //
  const telegramLink = "https://t.me/UZAIRMDbot"; //
  
  // Get real user number
  let userNumber = ''; //
  if (sender) { //
    let rawNumber = sender.split('@')[0]; //
    rawNumber = rawNumber.replace(/[^0-9]/g, ''); //
    if (rawNumber) { //
      if (rawNumber.startsWith('92') && rawNumber.length === 12) { //
        userNumber = '0' + rawNumber.slice(2); //
      } else if (rawNumber.length === 11 && rawNumber.startsWith('03')) { //
        userNumber = rawNumber; //
      } else if (rawNumber.length === 10 && rawNumber.startsWith('3')) { //
        userNumber = '0' + rawNumber; //
      } else {
        userNumber = rawNumber; //
      }
    }
  }
  const displayNumber = userNumber || 'Unknown'; //

  const menuText =
`╭━ UZAIR  MD BOT ━╮
┃ BOT NAME : UZAIR  MD BOT
┃ USER : ${userName}
┃ NUMBER : ${displayNumber}
┃ DEV : UZAIR 
┃ MODE : ${botMode === 'public' ? 'PUBLIC' : 'PRIVATE'}
┃ PREFIX : [ ${prefix} ]
┃ TIME : ${time}
┃ DATE : ${date}
╰━━━━━━━━━━━━━━━╯

  HEY ${userName}
  UZAIR  MD BOT AT YOUR SERVICE

╭━ GENERAL COMMANDS ━╮
┃➜ .menu
┃➜ .ping
┃➜ .alive
┃➜ .info
┃➜ .uptime
┃➜ .speed
┃➜ .owner
┃➜ .pair
╰━━━━━━━━━━━━━━━╯

╭━ OWNER COMMANDS ━╮
┃➜ .mode
┃➜ .addowner
┃➜ .removeowner
┃➜ .antidelete
┃➜ .chatbotdm
┃➜ .chatbotgroup
┃➜ .broadcast
┃➜ .block
┃➜ .unblock
┃➜ .restart
┃➜ .afk
┃➜ .pnotify
┃➜ .dnotify
┃➜ .restrict
┃➜ .unrestrict
╰━━━━━━━━━━━━━━━╯

╭━ GROUP COMMANDS ━╮
┃➜ .kick
┃➜ .add
┃➜ .promote
┃➜ .demote
┃➜ .mute
┃➜ .unmute
┃➜ .tagall
┃➜ .hidetag
┃➜ .groupinfo
┃➜ .setname
┃➜ .setdesc
┃➜ .setppgc
┃➜ .linkgc
┃➜ .revokegc
┃➜ .antilink
┃➜ .warn
┃➜ .resetwarn
┃➜ .welcome
┃➜ .bye
╰━━━━━━━━━━━━━━━╯

╭━ MEDIA COMMANDS ━╮
┃➜ .play
┃➜ .video
┃➜ .song
┃➜ .gif
┃➜ .tomp3
╰━━━━━━━━━━━━━━━╯

╭━ STICKER COMMANDS ━╮
┃➜ .sticker
┃➜ .toimg
┃➜ .stickerinfo
┃➜ .emojimix
╰━━━━━━━━━━━━━━━╯

╭━ DOWNLOADER COMMANDS ━╮
┃➜ .ytmp3
┃➜ .ytmp4
┃➜ .tiktok
┃➜ .instagram
┃➜ .facebook
┃➜ .twitter
┃➜ .terabox
┃➜ .apk
┃➜ .capcut
┃➜ .gdrive
┃➜ .mediafire
┃➜ .pinterest
┃➜ .qr
╰━━━━━━━━━━━━━━━╯

╭━ SEARCH COMMANDS ━╮
┃➜ .google
┃➜ .weather
┃➜ .wiki
┃➜ .lyrics
┃➜ .image
┃➜ .wallpaper
┃➜ .siminfo
╰━━━━━━━━━━━━━━━╯

╭━ FUN COMMANDS ━╮
┃➜ .joke
┃➜ .quote
┃➜ .fact
┃➜ .8ball
┃➜ .dare
┃➜ .truth
┃➜ .ship
┃➜ .rate
┃➜ .boom
┃➜ .hack
┃➜ .shayari       
┃➜ .meme         
┃➜ .fatherday     
┃➜ .mothersday    
┃➜ .memesearch    
╰━━━━━━━━━━━━━━━╯

╭━ UTILITY COMMANDS ━╮
┃➜ .tts
┃➜ .translate
┃➜ .qr
┃➜ .ffinfo free fire id information 
┃➜ .shorturl
┃➜ .reverse
┃➜ .fancy
┃➜ .viewonce
┃➜ .getcid
┃➜ .phoneinfo
┃➜ .ssweb
┃➜ .jid
┃➜ .sstatus
┃➜ .numberinfo
╰━━━━━━━━━━━━━━━╯

╭━ AI COMMANDS ━╮
┃➜ .wormgpt
┃➜ .claude
┃➜ .hd
┃➜ .chatgpt      
┃➜ .imagine      
┃➜ .meta          
┃➜ .gemini     
╰━━━━━━━━━━━━━━━╯

╭━ TELEGRAM ━╮
┃➜ ${telegramLink}
╰━━━━━━━━━━━━━━━╯

> DEVELOPER BY UZAIR `; //

  const contextInfo = {
    forwardingScore: 999, //
    isForwarded: true //
  }; //

  const menuImagePath = path.resolve(config.assets.menuImage); //
  const menuAudioPath = path.resolve(config.assets.menuAudio); //

  if (fs.existsSync(menuImagePath)) { //
    await sock.sendMessage(from, {
      image: fs.readFileSync(menuImagePath), //
      caption: menuText, //
      contextInfo: contextInfo //
    }, { quoted: msg }); //
  } else {
    await sock.sendMessage(from, { 
      text: menuText, //
      contextInfo: contextInfo //
    }, { quoted: msg }); //
  }

  if (fs.existsSync(menuAudioPath)) { //
    await sock.sendMessage(from, {
      audio: fs.readFileSync(menuAudioPath), //
      mimetype: 'audio/mp4', //
      ptt: false, //
    }, { quoted: msg }); //
  }

  await react('✅'); //
};

module.exports = { run }; //
