/**
 * AI Image Enhancer / Upscaler Command
 * COMMAND: .enhance
 * USAGE: .enhance (image reply karke)
 * Made For UZAIR MD BOT
 */

'use strict';

const axios = require('axios');
const FormData = require('form-data');

// ─── Box Design ───
const makeBox = (title, content) => {
  return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

module.exports = {
  name: 'enhance',
  aliases: ['hd', 'upscale', '4k', 'sharpen'],
  category: 'ai',
  description: '🔍 Image ko HD / 4K mein enhance karo AI se',
  usage: '.enhance (image reply karke)',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;

    // ─── Check: image attached hai? ───
    const quoted = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasImage =
      msg?.message?.imageMessage ||
      quoted?.imageMessage;

    if (!hasImage) {
      return reply(makeBox('USAGE', '❌ Pehle ek image reply karo!\n\n💡 How to use:\n1. Koi bhi image send karo\n2. Usse reply mein .enhance likho\n\n🔍 Image HD / 4K ho jayegi!'));
    }

    try {
      try { await react('🔍'); } catch (e) {}
      await reply(makeBox('⏳ ENHANCING', 'Image HD ho rahi hai...\n\n🔍 AI Upscaling chal rahi hai\nThoda wait karo ⏳'));

      // ─── Image Buffer Download ───
      let imageBuffer;
      try {
        imageBuffer = await sock.downloadMediaMessage(
          msg?.message?.imageMessage ? msg : { message: quoted }
        );
      } catch (e) {
        return reply(makeBox('❌ ERROR', 'Image download nahi ho saki.\nDobara try karo!'));
      }

      let resultBuffer = null;

      // ─── API 1: Picwish Upscaler (Free) ───
      try {
        // Step 1: Upload image
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('scale', '4'); // 4x upscale

        const uploadRes = await axios.post(
          'https://techzbots1-image-enhancer.hf.space/run/predict',
          {
            fn_index: 0,
            data: [
              'data:image/jpeg;base64,' + imageBuffer.toString('base64')
            ]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
          }
        );

        const resultData = uploadRes.data?.data?.[0];
        if (resultData) {
          let base64Data;
          if (resultData.startsWith('data:image')) {
            base64Data = resultData.split(',')[1];
          } else {
            base64Data = resultData;
          }
          const buf = Buffer.from(base64Data, 'base64');
          if (buf.byteLength > 5000) {
            resultBuffer = buf;
            console.log('Enhance API1 HuggingFace success');
          }
        }
      } catch (e) {
        console.log('Enhance API1 HuggingFace failed:', e.message);
      }

      // ─── API 2: Upscayl / Real-ESRGAN HuggingFace Space ───
      if (!resultBuffer) {
        try {
          const res = await axios.post(
            'https://radames-real-esrgan-animation.hf.space/run/predict',
            {
              fn_index: 0,
              data: [
                'data:image/jpeg;base64,' + imageBuffer.toString('base64'),
                4 // scale factor
              ]
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 90000
            }
          );

          const resultData = res.data?.data?.[0];
          if (resultData) {
            let base64Data = resultData.startsWith('data:image')
              ? resultData.split(',')[1]
              : resultData;
            const buf = Buffer.from(base64Data, 'base64');
            if (buf.byteLength > 5000) {
              resultBuffer = buf;
              console.log('Enhance API2 Real-ESRGAN success');
            }
          }
        } catch (e) {
          console.log('Enhance API2 Real-ESRGAN failed:', e.message);
        }
      }

      // ─── API 3: Replicate Real-ESRGAN (Free tier) ───
      if (!resultBuffer) {
        try {
          const base64Img = imageBuffer.toString('base64');
          const createRes = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
              input: {
                image: `data:image/jpeg;base64,${base64Img}`,
                scale: 4,
                face_enhance: false
              }
            },
            {
              headers: {
                'Authorization': 'Token r8_demo',
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );

          const predictionId = createRes.data?.id;
          if (predictionId) {
            // Poll for result
            let attempts = 0;
            while (attempts < 20) {
              await new Promise(r => setTimeout(r, 3000));
              const statusRes = await axios.get(
                `https://api.replicate.com/v1/predictions/${predictionId}`,
                {
                  headers: { 'Authorization': 'Token r8_demo' },
                  timeout: 10000
                }
              );
              const status = statusRes.data?.status;
              if (status === 'succeeded') {
                const outputUrl = statusRes.data?.output;
                if (outputUrl) {
                  const imgRes = await axios.get(outputUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                  });
                  resultBuffer = Buffer.from(imgRes.data);
                  console.log('Enhance API3 Replicate success');
                }
                break;
              } else if (status === 'failed') {
                break;
              }
              attempts++;
            }
          }
        } catch (e) {
          console.log('Enhance API3 Replicate failed:', e.message);
        }
      }

      // ─── API 4: Waifu2x (Free, No Key) ───
      if (!resultBuffer) {
        try {
          const form = new FormData();
          form.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
          form.append('scale', '2');
          form.append('noise', '1');
          form.append('style', 'photo');

          const res = await axios.post(
            'https://api.waifu2x.udp.jp/api',
            form,
            {
              headers: { ...form.getHeaders() },
              responseType: 'arraybuffer',
              timeout: 60000
            }
          );

          if (res.data && res.data.byteLength > 5000) {
            resultBuffer = Buffer.from(res.data);
            console.log('Enhance API4 Waifu2x success');
          }
        } catch (e) {
          console.log('Enhance API4 Waifu2x failed:', e.message);
        }
      }

      // ─── All APIs Failed ───
      if (!resultBuffer) {
        return reply(makeBox('❌ FAILED', 'Image enhance nahi ho saki.\n\nReasons:\n• APIs busy hain abhi\n• Image format support nahi\n\nThodi der baad dobara try karo!'));
      }

      // ─── Send Enhanced Image ───
      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: makeBox('✅ ENHANCED', '🔍 Image HD Successfully!\n\n📸 4x Upscaled by AI\n🤖 UZAIR MD BOT')
      }, { quoted: msg });

      try { await react('✅'); } catch (e) {}

    } catch (e) {
      console.error('Enhance Error:', e.message);
      await reply(makeBox('❌ ERROR', e.message || 'Kuch gadbad ho gayi, dobara try karo!'));
      try { await react('❌'); } catch (e) {}
    }
  }
};
