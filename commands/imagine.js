/**
 * AI Image Generator Command
 * COMMAND: .imagine
 * USAGE: .imagine <description>
 * Fixed By UZAIR
 */

/**
 * AI Image Generator Command
 * COMMAND: .imagine
 * USAGE: .imagine <description>
 * Fixed By UZAIR
 */

'use strict';

const axios = require('axios');

// ─── Box Design ───
const makeBox = (title, content) => {
    return `╭─  ${title}  ─╮\n${content.split('\n').map(line => `│ ${line}`).join('\n')}\n╰──────────────╯\n\n        *BY UZAIR*`;
};

module.exports = {
  name: 'imagine',
  aliases: ['imagegen', 'genimg', 'aiimg'],
  category: 'ai',
  description: '🎨 Generate an AI image from text',
  usage: '.imagine <description>',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;
    const prompt = args ? args.join(' ').trim() : '';

    if (!prompt) {
      return reply(makeBox('USAGE', '❌ Description do!\n\n💡 Examples:\n.imagine a cyberpunk hacker boy\n.imagine sunset over mountains\n.imagine cute anime girl'));
    }

    try {
      try { await react('🎨'); } catch (e) {}

      await reply(makeBox('⏳ AI GENERATOR', `Generating image...\n\n🎨 Prompt: "${prompt}"\n\nThoda wait karo...`));

      let imageBuffer = null;

      // ─── API 1: Pollinations AI — Direct Buffer Download ───
      try {
        const encoded = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 99999);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.data && res.data.byteLength > 5000) {
          imageBuffer = Buffer.from(res.data);
          console.log('API1 Pollinations success');
        } else {
          throw new Error('Empty image data');
        }
      } catch (e) {
        console.log('API1 Pollinations failed:', e.message);
      }

      // ─── API 2: Pollinations flux-realism model (backup) ───
      if (!imageBuffer) {
        try {
          const encoded = encodeURIComponent(prompt);
          const seed = Math.floor(Math.random() * 99999);
          const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}&model=flux-realism`;
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.data && res.data.byteLength > 5000) {
            imageBuffer = Buffer.from(res.data);
            console.log('API2 Pollinations flux-realism success');
          } else {
            throw new Error('Empty image data');
          }
        } catch (e) {
          console.log('API2 Pollinations flux-realism failed:', e.message);
        }
      }

      // ─── API 3: Nexra StableDiffusion XL ───
      if (!imageBuffer) {
        try {
          const res = await axios.post(
            'https://nexra.aryahcr.cc/api/image/completions',
            { prompt, model: 'stablediffusion-xl', response: true },
            { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
          );
          const imgUrl = res.data?.images?.[0] || res.data?.image || null;
          if (imgUrl) {
            // Base64 image check
            if (imgUrl.startsWith('data:image')) {
              const base64Data = imgUrl.split(',')[1];
              imageBuffer = Buffer.from(base64Data, 'base64');
            } else {
              const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
              imageBuffer = Buffer.from(imgRes.data);
            }
            console.log('API3 Nexra success');
          }
        } catch (e) {
          console.log('API3 Nexra failed:', e.message);
        }
      }

      // ─── API 4: Nexra StableDiffusion 1.5 ───
      if (!imageBuffer) {
        try {
          const res = await axios.post(
            'https://nexra.aryahcr.cc/api/image/completions',
            { prompt, model: 'stablediffusion-1.5', response: true },
            { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
          );
          const imgUrl = res.data?.images?.[0] || res.data?.image || null;
          if (imgUrl) {
            if (imgUrl.startsWith('data:image')) {
              const base64Data = imgUrl.split(',')[1];
              imageBuffer = Buffer.from(base64Data, 'base64');
            } else {
              const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
              imageBuffer = Buffer.from(imgRes.data);
            }
            console.log('API4 Nexra 1.5 success');
          }
        } catch (e) {
          console.log('API4 Nexra 1.5 failed:', e.message);
        }
      }

      // ─── API 5: Prodia (Stable Diffusion) ───
      if (!imageBuffer) {
        try {
          const generateRes = await axios.get(
            `https://api.prodia.com/generate?new=true&prompt=${encodeURIComponent(prompt)}&model=v1-5-pruned-emaonly.safetensors&negative_prompt=bad+quality&steps=20&cfg=7&seed=${Math.floor(Math.random()*99999)}&upscale=True&sampler=DPM%2B%2B+2M+Karras&aspect_ratio=square`,
            { timeout: 30000 }
          );
          const jobId = generateRes.data?.job;
          if (jobId) {
            // Poll for result
            let attempts = 0;
            while (attempts < 20) {
              await new Promise(r => setTimeout(r, 3000));
              const statusRes = await axios.get(`https://api.prodia.com/job/${jobId}`, { timeout: 10000 });
              if (statusRes.data?.status === 'succeeded') {
                const imgUrl = `https://images.prodia.xyz/${jobId}.png`;
                const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
                imageBuffer = Buffer.from(imgRes.data);
                console.log('API5 Prodia success');
                break;
              }
              attempts++;
            }
          }
        } catch (e) {
          console.log('API5 Prodia failed:', e.message);
        }
      }

      // ─── All APIs failed ───
      if (!imageBuffer) {
        return reply(makeBox('❌ FAILED', 'Koi bhi API kaam nahi kar rahi abhi.\n\nThodi der baad try karo ya\nPrompt English mein likho!'));
      }

      // ─── Send Image ───
      const caption = makeBox('🎨 AI IMAGE', `✅ *Generated Successfully!*\n\n🖊️ *Prompt:* ${prompt}`);

      await sock.sendMessage(from, {
        image: imageBuffer,
        caption
      }, { quoted: msg });

      try { await react('✅'); } catch (e) {}

    } catch (e) {
      console.error('Imagine Error:', e.message);
      let errorMsg = e.message;
      if (e.code === 'ECONNABORTED') errorMsg = 'Timeout — server slow hai, baad mein try karo.';
      await reply(makeBox('❌ ERROR', errorMsg));
      try { await react('❌'); } catch (e) {}
    }
  }
};



