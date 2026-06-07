'use strict';

// ─── Core Imports ───────────────────────────────────────────────
const fs     = require('fs');
const path   = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const { checkRateLimit } = require('../middleware/auth');

// ─── Fixed Command Imports (ye hamesha load honge) ─────────────
const menuCmd        = require('../commands/menu');
const generalCmd     = require('../commands/general');
const groupCmd       = require('../commands/group');
const stickerCmd     = require('../commands/sticker');
const downloaderCmd  = require('../commands/downloader');
const funCmd         = require('../commands/fun');
const ccgenCmd       = require('../commands/ccgen');
const utilityCmd     = require('../commands/utility');
const searchCmd      = require('../commands/search');
const mediaCmd       = require('../commands/media');
const adminCmd       = require('../commands/admin');
const restrictCmd    = require('../commands/restrict');
const installCmd     = require('../commands/install');
const wormgptCmd     = require('../commands/wormgpt');
const chatbotCmd     = require('../commands/chatbot');
const wallpaperCmd   = require('../commands/wallpaper');
const claudeCmd      = require('../commands/claude');
const jidCmd         = require('../commands/jid');
const hdCmd          = require('../commands/hd');
const sstatusCmd     = require('../commands/sstatus');
const antikeywordCmd = require('../commands/antikeyword');
const boomCmd        = require('../commands/boom');
const hackCmd        = require('../commands/hack');
const apkCmd         = require('../commands/apk');
const capcutCmd      = require('../commands/capcut');
const gdriveCmd      = require('../commands/gdrive');
const mediafireCmd   = require('../commands/mediafire');
const pinterestCmd   = require('../commands/pinterest');
const qrCmd          = require('../commands/qr');
const getcidCmd      = require('../commands/getcid');
const phoneinfoCmd   = require('../commands/phoneinfo');
const sswebCmd       = require('../commands/ssweb');
const numberinfoCmd  = require('../commands/numberinfo');

const { checkAntiLink }    = require('../utils/antilink');
const { checkAntiKeyword } = require('../utils/antikeyword');
const { handleChatbot }    = require('../commands/chatbot');
const db                   = require('../database/db');
const { storeMessageForAntidelete, handleDeletedMessage, antidelete } = require('../commands/antidelete');
const { vv }               = require('../commands/viewonce');

// ─── Dynamic Plugin Loader (Map) ────────────────────────────────
// Ye Map installed plugins ko store karta hai
// Key: command name/alias, Value: { module, execute }
const pluginMap = new Map();

// Ye files dynamic loader skip karega (already switch mein hain)
const STATIC_COMMANDS = new Set([
  'menu','help','start','ping','info','alive','speed','uptime','owner','pair',
  'kick','add','promote','demote','mute','unmute','tagall','hidetag','groupinfo',
  'setname','setdesc','linkgc','revokegc','antilink','antikeyword',
  'sticker','s','toimg','stickerinfo','emojimix',
  'play','song','video','gif','tomp3',
  'ytmp3','ytmp4','tiktok','tt','instagram','ig','facebook','fb','twitter','tw',
  'install','inst','apk','apkdownload','getapk','downloadapk',
  'capcut','cc','capcuttemplate','gdrive','gd','googledrive',
  'mediafire','mf','mfdl','pinterest','pin','pindl','qr','qrcode','generateqr','makeqr',
  'joke','quote','fact','8ball','dare','truth','ship','rate','son',
  'boom','repeat','spam','unlimited','hack',
  'wormgpt','wgpt','claude','hd',
  'tts','translate','tr','calc','shorturl','reverse','fancy','wiki','jid','sstatus',
  'getcid','getchannelid','cid','channelid',
  'phoneinfo','phone','phonespecs','specs','deviceinfo','mobileinfo','hp',
  'ssweb','screenshot','ss','webss',
  'numberinfo','numinfo','whonumber','phonedata',
  'google','search','image','img','lyrics','weather','wallpaper','wp','siminfo',
  'broadcast','bc','restart','setppgc','delete','del','getpp','warn','resetwarn',
  'afk','mode','gen','addowner','removeowner','welcome','bye','pnotify','dnotify',
  'restrict','unrestrict','vv','viewonce','antidelete','ad','chatbotgc','chatbotdm',
]);

/**
 * Commands folder se naye plugins load karo
 * Ye sirf un files ko load karta hai jo STATIC_COMMANDS mein nahi hain
 */
const loadDynamicPlugins = () => {
  pluginMap.clear();
  const commandsDir = path.join(__dirname, '../commands');

  let loaded = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(commandsDir, file);
      try {
        // Cache clear karo taaki fresh load ho
        delete require.cache[require.resolve(filePath)];
        const mod = require(filePath);

        // module.exports mein name hona chahiye
        if (!mod || !mod.name || typeof mod.execute !== 'function') {
          skipped++;
          continue;
        }

        const cmdName = mod.name.toLowerCase();

        // Static commands skip karo
        if (STATIC_COMMANDS.has(cmdName)) {
          skipped++;
          continue;
        }

        // Main name register karo
        pluginMap.set(cmdName, mod);

        // Aliases bhi register karo
        if (Array.isArray(mod.aliases)) {
          for (const alias of mod.aliases) {
            if (!STATIC_COMMANDS.has(alias.toLowerCase())) {
              pluginMap.set(alias.toLowerCase(), mod);
            }
          }
        }

        loaded++;
      } catch (err) {
        failed++;
        logger.error(`[PluginLoader] Failed to load ${file}: ${err.message}`);
      }
    }

    logger.info(`[PluginLoader] ✅ Loaded: ${loaded} | ⏭ Skipped: ${skipped} | ❌ Failed: ${failed}`);
  } catch (err) {
    logger.error(`[PluginLoader] Cannot read commands dir: ${err.message}`);
  }
};

// Startup pe load karo
loadDynamicPlugins();

// Ye function install.js use kar sakta hai hot-reload ke liye
const reloadCommands = () => {
  logger.info('[PluginLoader] Reloading dynamic plugins...');
  loadDynamicPlugins();
};

// Global expose karo taaki install.js access kar sake
global.reloadCommands = reloadCommands;

// ─── ID Tracking ────────────────────────────────────────────────
const botProcessedIds = new Map();
const MAX_PROCESSED   = 2000;
const BOT_START_TIME  = Math.floor(Date.now() / 1000) - 30;

// ─── Owner Map ───────────────────────────────────────────────────
const ownerMap  = new Map();
const botNames  = new Map();

const setBotName = (botNum, name) => botNames.set(botNum.replace(/[^0-9]/g, ''), name);
const getBotName = (botNum)       => botNames.get(botNum.replace(/[^0-9]/g, '')) || 'AMMAR MD';

const addOwner = (botNum, identifier) => {
  const b = botNum.replace(/[^0-9]/g, '');
  const i = identifier.replace(/[^0-9]/g, '');
  if (!b || !i) return;
  if (!ownerMap.has(b)) ownerMap.set(b, new Set());
  ownerMap.get(b).add(i);
};
const setOwner          = (botNum, ownerNum) => addOwner(botNum, ownerNum);
const addOwnerLID       = (botNum, lid)      => addOwner(botNum, lid);
const removeSecondOwner = (botNum, identifier) => {
  const b = botNum.replace(/[^0-9]/g, '');
  const i = identifier.replace(/[^0-9]/g, '');
  if (ownerMap.has(b)) ownerMap.get(b).delete(i);
};

// ─── Main Message Handler ────────────────────────────────────────
const handleMessage = async (sock, m, botNum) => {
  const msg = m.messages?.[0];
  if (!msg || !msg.message) return;

  // ── Duplicate check ──
  if (!botProcessedIds.has(botNum)) botProcessedIds.set(botNum, new Set());
  const processedMsgIds = botProcessedIds.get(botNum);
  const msgId     = msg.key?.id;
  const remoteJid = msg.key?.remoteJid;
  const uniqueKey = `${remoteJid}:${msgId}`;
  if (uniqueKey) {
    if (processedMsgIds.has(uniqueKey)) return;
    processedMsgIds.add(uniqueKey);
    if (processedMsgIds.size > MAX_PROCESSED) {
      const first = processedMsgIds.values().next().value;
      processedMsgIds.delete(first);
    }
  }

  // ── Timestamp check ──
  const msgTimestamp = msg.messageTimestamp
    ? (typeof msg.messageTimestamp === 'object' ? msg.messageTimestamp.low : msg.messageTimestamp)
    : null;
  if (msgTimestamp && msgTimestamp < BOT_START_TIME) return;

  // ── Message type ──
  const type = Object.keys(msg.message)[0];
  if (['senderKeyDistributionMessage', 'reactionMessage', 'ephemeralSettingControl'].includes(type)) return;
  if (type === 'protocolMessage') {
    const subType = msg.message.protocolMessage?.type;
    if (subType === 0 || subType === 5) {
      await handleDeletedMessage(sock, msg, botNum).catch(() => {});
    }
    return;
  }

  const from    = msg.key.remoteJid;
  const isGroup = from?.endsWith('@g.us');

  if (isGroup && msg.key.fromMe) return;
  if (!isGroup && msg.key.fromMe) {
    const rb = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!rb.startsWith(config.prefix)) return;
  }

  // ── Body ──
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    msg.message?.buttonsResponseMessage?.selectedDisplayText ||
    msg.message?.listResponseMessage?.title || '';

  if (!body && !['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'].includes(type)) return;

  // ── Sender ──
  let sender;
  if (isGroup) {
    sender = msg.key.participant || msg.key.remoteJid;
  } else {
    sender = msg.key.fromMe ? `${botNum}@s.whatsapp.net` : msg.key.remoteJid;
  }

  const cleanBotNum = botNum.replace(/[^0-9]/g, '');
  const toDigits    = (val) => (val || '').toString().replace(/[^0-9]/g, '');

  const senderDigits      = toDigits(sender);
  const participantDigits = toDigits(msg.key.participant);
  const fromDigits        = toDigits(from);

  const mainOwner    = toDigits(db.getMainOwner(cleanBotNum));
  const secondOwners = (db.getSecondOwners(cleanBotNum) || []).map(toDigits);

  const ownerMapEntries = ownerMap.get(cleanBotNum) || new Set();
  const isMapOwner = [...ownerMapEntries].some(o => {
    const d = toDigits(o);
    return d === senderDigits || d === participantDigits;
  });

  const isOwner = msg.key.fromMe === true ||
    senderDigits === mainOwner || participantDigits === mainOwner || fromDigits === mainOwner ||
    secondOwners.includes(senderDigits) || secondOwners.includes(participantDigits) ||
    secondOwners.includes(fromDigits) || isMapOwner;

  let isContactOwner = false;
  if (!isOwner && isGroup && msg.key.participant) {
    try {
      const meta = await sock.groupMetadata(from).catch(() => null);
      if (meta?.participants) {
        for (const p of meta.participants) {
          const pDigits = toDigits(p.id);
          const pLid    = toDigits(p.lid || '');
          if (
            (pDigits === senderDigits || pLid === senderDigits) &&
            (pDigits === mainOwner || pLid === mainOwner ||
             secondOwners.includes(pDigits) || secondOwners.includes(pLid))
          ) { isContactOwner = true; break; }
        }
      }
    } catch {}
  }

  const finalIsOwner = isOwner || isContactOwner;
  const isRestricted = db.isRestricted(sender, cleanBotNum) || db.isRestricted(senderDigits, cleanBotNum);
  const mode         = db.getBotMode(cleanBotNum);

  storeMessageForAntidelete(sock, msg, botNum).catch(() => {});

  // ── Non-command messages ──
  if (!body.startsWith(config.prefix)) {
    if (isGroup && body) {
      await checkAntiLink(sock, msg, from, sender, body, botNum, finalIsOwner).catch(() => {});
      await checkAntiKeyword(sock, msg, from, sender, body, botNum, finalIsOwner).catch(() => {});
    }
    await handleChatbot(sock, msg, from, sender, body, botNum, isGroup, finalIsOwner).catch(() => {});
    return;
  }

  if (mode === 'private' && !finalIsOwner) return;
  if (isRestricted && !finalIsOwner)       return;

  const args    = body.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // ── ctx object ──
  const ctx = {
    sock, msg, from, sender, senderDigits,
    isGroup, isOwner: finalIsOwner, body, botNum, cleanBotNum, type, args,
    config,
    reply: (text, opts) => sock.sendMessage(from, { text: String(text) }, isGroup ? { quoted: msg, ...opts } : { ...opts }),
    react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
  };

  if (!finalIsOwner && !checkRateLimit(senderDigits)) {
    return ctx.reply('⏳ Too many commands. Wait a moment.');
  }

  logger.cmd(senderDigits, command, args);

  try {
    // ════════════════════════════════════════════════
    // STEP 1: Static switch case (existing commands)
    // ════════════════════════════════════════════════
    let handled = true;

    switch (command) {
      // General
      case 'menu': case 'help': case 'start': await menuCmd.run(ctx); break;
      case 'ping':   await generalCmd.ping(ctx);   break;
      case 'info':   await generalCmd.info(ctx);   break;
      case 'alive':  await generalCmd.alive(ctx);  break;
      case 'speed':  await generalCmd.speed(ctx);  break;
      case 'uptime': await generalCmd.uptime(ctx); break;
      case 'owner':  await generalCmd.owner(ctx);  break;
      case 'pair':   await generalCmd.pair(ctx);   break;

      // Group
      case 'kick':      await groupCmd.kick(ctx);      break;
      case 'add':       await groupCmd.add(ctx);       break;
      case 'promote':   await groupCmd.promote(ctx);   break;
      case 'demote':    await groupCmd.demote(ctx);    break;
      case 'mute':      await groupCmd.mute(ctx);      break;
      case 'unmute':    await groupCmd.unmute(ctx);    break;
      case 'tagall':    await groupCmd.tagall(ctx);    break;
      case 'hidetag':   await groupCmd.hidetag(ctx);   break;
      case 'groupinfo': await groupCmd.groupinfo(ctx); break;
      case 'setname':   await groupCmd.setname(ctx);   break;
      case 'setdesc':   await groupCmd.setdesc(ctx);   break;
      case 'linkgc':    await groupCmd.linkgc(ctx);    break;
      case 'revokegc':  await groupCmd.revokegc(ctx);  break;
      case 'antilink':  await groupCmd.antilink(ctx);  break;
      case 'antikeyword': await antikeywordCmd.antikeyword(ctx); break;

      // Sticker
      case 'sticker': case 's': await stickerCmd.sticker(ctx); break;
      case 'toimg':       await stickerCmd.toimg(ctx);       break;
      case 'stickerinfo': await stickerCmd.stickerinfo(ctx); break;
      case 'emojimix':    await stickerCmd.emojimix(ctx);    break;

      // Media
      case 'play': case 'song': await mediaCmd.play(ctx);  break;
      case 'video':             await mediaCmd.video(ctx);  break;
      case 'gif':               await mediaCmd.gif(ctx);    break;
      case 'tomp3':             await mediaCmd.tomp3(ctx);  break;

      // Downloader
      case 'ytmp3':                    await downloaderCmd.ytmp3(ctx);      break;
      case 'ytmp4':                    await downloaderCmd.ytmp4(ctx);      break;
      case 'tiktok': case 'tt':        await downloaderCmd.tiktok(ctx);     break;
      case 'instagram': case 'ig':     await downloaderCmd.instagram(ctx);  break;
      case 'facebook': case 'fb':      await downloaderCmd.facebook(ctx);   break;
      case 'twitter': case 'tw':       await downloaderCmd.twitter(ctx);    break;

      // Install — Owner only
      case 'install': case 'inst':
        if (!finalIsOwner) return ctx.reply('❌ Ye command sirf Owner use kar sakta hai!');
        await installCmd.execute(sock, msg, args, ctx); break;

      // Downloader Plugins
      case 'apk': case 'apkdownload': case 'getapk': case 'downloadapk':
        await apkCmd.execute(sock, msg, args, ctx); break;
      case 'capcut': case 'capcuttemplate':
        await capcutCmd.execute(sock, msg, args, ctx); break;
      case 'gdrive': case 'gd': case 'googledrive':
        await gdriveCmd.execute(sock, msg, args, ctx); break;
      case 'mediafire': case 'mf': case 'mfdl':
        await mediafireCmd.execute(sock, msg, args, ctx); break;
      case 'pinterest': case 'pin': case 'pindl':
        await pinterestCmd.execute(sock, msg, args, ctx); break;
      case 'qr': case 'qrcode': case 'generateqr': case 'makeqr':
        await qrCmd.execute(sock, msg, args, ctx); break;

      // Fun
      case 'joke':   await funCmd.joke(ctx);      break;
      case 'quote':  await funCmd.quote(ctx);     break;
      case 'fact':   await funCmd.fact(ctx);      break;
      case '8ball':  await funCmd.eightball(ctx); break;
      case 'dare':   await funCmd.dare(ctx);      break;
      case 'truth':  await funCmd.truth(ctx);     break;
      case 'ship':   await funCmd.ship(ctx);      break;
      case 'rate':   await funCmd.rate(ctx);      break;
      case 'son':    await funCmd.son(ctx);       break;

      // Fun Plugins
      case 'boom': case 'repeat': case 'spam': case 'unlimited':
        await boomCmd.execute(sock, msg, args, ctx); break;
      case 'hack':
        await hackCmd.execute(sock, msg, args, ctx); break;

      // AI
      case 'wormgpt': case 'wgpt': await wormgptCmd.wormgpt(ctx); break;
      case 'claude':              await claudeCmd.claude(ctx);    break;
      case 'hd':                  await hdCmd.hd(ctx);            break;

      // Utility
      case 'tts':                 await utilityCmd.tts(ctx);       break;
      case 'translate': case 'tr': await utilityCmd.translate(ctx); break;
      case 'calc':                await utilityCmd.calc(ctx);      break;
      case 'shorturl':            await utilityCmd.shorturl(ctx);  break;
      case 'reverse':             await utilityCmd.reverse(ctx);   break;
      case 'fancy':               await utilityCmd.fancy(ctx);     break;
      case 'wiki':                await utilityCmd.wiki(ctx);      break;
      case 'jid':                 await jidCmd.jid(ctx);           break;
      case 'sstatus':             await sstatusCmd.sstatus(ctx);   break;

      // Utility Plugins
      case 'getcid': case 'getchannelid': case 'cid': case 'channelid':
        await getcidCmd.execute(sock, msg, args, ctx); break;
      case 'phoneinfo': case 'phone': case 'phonespecs': case 'specs':
      case 'deviceinfo': case 'mobileinfo': case 'hp':
        await phoneinfoCmd.execute(sock, msg, args, ctx); break;
      case 'ssweb': case 'screenshot': case 'ss': case 'webss':
        await sswebCmd.execute(sock, msg, args, ctx); break;
      case 'numberinfo': case 'numinfo': case 'whonumber': case 'phonedata':
        await numberinfoCmd.execute(sock, msg, args, ctx); break;

      // Search
      case 'google': case 'search': await searchCmd.google(ctx); break;
      case 'image': case 'img':     await searchCmd.image(ctx);  break;
      case 'lyrics':                await searchCmd.lyrics(ctx); break;
      case 'weather':               await searchCmd.weather(ctx); break;
      case 'wallpaper': case 'wp':  await wallpaperCmd.wallpaper(ctx); break;
      case 'siminfo': {
        const siminfoModule = require('../commands/siminfo');
        await siminfoModule.siminfo(ctx); break;
      }

      // Admin / Owner
      case 'broadcast': case 'bc': await adminCmd.broadcast(ctx);     break;
      case 'restart':              await adminCmd.restart(ctx);        break;
      case 'setppgc':              await adminCmd.setppgc(ctx);        break;
      case 'delete': case 'del':   await adminCmd.del(ctx);            break;
      case 'getpp':                await adminCmd.getpp(ctx);          break;
      case 'warn':                 await adminCmd.warn(ctx);           break;
      case 'resetwarn':            await adminCmd.resetwarn(ctx);      break;
      case 'afk':                  await adminCmd.afk(ctx);            break;
      case 'mode':                 await adminCmd.mode(ctx);           break;
      case 'gen':                  await ccgenCmd.ccgen(ctx);          break;
      case 'addowner':             await adminCmd.addowner(ctx);       break;
      case 'removeowner':          await adminCmd.removeowner(ctx);    break;
      case 'welcome':              await adminCmd.welcome(ctx);        break;
      case 'bye':                  await adminCmd.bye(ctx);            break;
      case 'pnotify':              await adminCmd.pnotify(ctx);        break;
      case 'dnotify':              await adminCmd.dnotify(ctx);        break;
      case 'restrict':             await restrictCmd.restrict(ctx);    break;
      case 'unrestrict':           await restrictCmd.unrestrict(ctx);  break;
      case 'vv': case 'viewonce':  await vv(ctx);                      break;
      case 'antidelete': case 'ad': await antidelete(ctx);             break;
      case 'chatbotgc':            await chatbotCmd.chatbotgc(ctx);    break;
      case 'chatbotdm':            await chatbotCmd.chatbotdm(ctx);    break;

      default:
        handled = false;
        break;
    }

    // ════════════════════════════════════════════════
    // STEP 2: Agar switch mein nahi mila — Dynamic Plugin Map check karo
    // Ye .install se naye commands handle karta hai
    // ════════════════════════════════════════════════
    if (!handled) {
      const plugin = pluginMap.get(command);
      if (plugin) {
        // ownerOnly check
        if (plugin.ownerOnly && !finalIsOwner) {
          return ctx.reply('❌ Ye command sirf Owner use kar sakta hai!');
        }
        // groupOnly check
        if (plugin.groupOnly && !isGroup) {
          return ctx.reply('❌ Ye command sirf group mein use ho sakta hai!');
        }
        // privateOnly check
        if (plugin.privateOnly && isGroup) {
          return ctx.reply('❌ Ye command sirf private chat mein use ho sakta hai!');
        }
        await plugin.execute(sock, msg, args, ctx);
      }
      // Koi command nahi mila — khamoshi se ignore karo
    }

  } catch (err) {
    if (err.message?.includes('Bad MAC') || err.message?.includes('decryption')) {
      logger.error('Session Error: Decryption failed. Please re-scan QR.');
      return;
    }
    if (err.message?.includes('not-acceptable')) return;
    logger.error(`Command error [${command}]:`, err.message);
    await ctx.reply(`❌ *Error!*\n\n${err.message}`);
  }
};

module.exports = {
  handleMessage,
  setOwner,
  addOwnerLID,
  removeSecondOwner,
  setBotName,
  getBotName,
  reloadCommands,   // install.js hot-reload ke liye
  pluginMap,        // debugging ke liye
};
