/*!
 * RoofGlow AI relay — Cloudflare Worker
 * Long Island Christmas Lights Pros
 *
 * Keeps your OpenAI API key secret. RoofGlow sends the night preview here; this Worker
 * forwards it to OpenAI's image-editing API and returns the photorealistic result.
 *
 * Settings (Cloudflare dashboard → your Worker → Settings → Variables and Secrets):
 *   OPENAI_API_KEY      (Secret)  your key from platform.openai.com
 *   ROOFGLOW_PASSCODE   (Secret)  a passcode you choose; you type it in RoofGlow
 *   ALLOWED_ORIGINS     (Text)    your site addresses, comma-separated, e.g.
 *                                 https://long-island-christmas-lights-pro.webflow.io,https://www.yourdomain.com
 *   OPENAI_IMAGE_MODEL  (Text, optional)  defaults to gpt-image-1.5
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), {status, headers: {...cors, 'Content-Type': 'application/json'}});

    if (request.method === 'OPTIONS') return new Response(null, {status: okOrigin ? 204 : 403, headers: cors});
    if (request.method !== 'POST') return json({error: 'RoofGlow AI relay is running. Send a POST from RoofGlow.'}, 405);
    if (!okOrigin) return json({error: 'This website isn’t allowed to use the AI relay. Add it to ALLOWED_ORIGINS.'}, 403);
    if (!env.OPENAI_API_KEY) return json({error: 'The AI relay has no OpenAI key yet. Add the OPENAI_API_KEY secret.'}, 500);

    let body;
    try { body = await request.json(); } catch { return json({error: 'Bad request.'}, 400); }
    if (!env.ROOFGLOW_PASSCODE || String(body.passcode || '') !== env.ROOFGLOW_PASSCODE) return json({error: 'Wrong passcode.'}, 401);

    const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!m) return json({error: 'No image received.'}, 400);
    const bin = atob(m[2]);
    if (bin.length > 20e6) return json({error: 'The image is too large.'}, 413);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const prompt = String(body.prompt || '').slice(0, 4000);
    const quality = ['low', 'medium', 'high'].includes(body.quality) ? body.quality : 'high';
    const send = withFidelity => {
      const fd = new FormData();
      fd.append('model', env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5');
      fd.append('image', new Blob([bytes], {type: 'image/' + m[1]}), 'preview.' + (m[1] === 'jpeg' ? 'jpg' : m[1]));
      fd.append('prompt', prompt);
      fd.append('size', 'auto');
      fd.append('quality', quality);
      fd.append('output_format', 'jpeg');
      if (withFidelity) fd.append('input_fidelity', 'high');   // stay closer to the input image, where the model supports it
      return fetch('https://api.openai.com/v1/images/edits', {method: 'POST', headers: {Authorization: `Bearer ${env.OPENAI_API_KEY}`}, body: fd});
    };

    let r = await send(true), text = await r.text();
    if (r.status === 400 && /input_fidelity/i.test(text)) { r = await send(false); text = await r.text(); }
    if (!r.ok) return json({error: openaiMessage(text, r.status)}, r.status === 401 ? 502 : r.status);

    let out;
    try { out = JSON.parse(text); } catch { return json({error: 'Unexpected answer from OpenAI.'}, 502); }
    const b64 = out && out.data && out.data[0] && out.data[0].b64_json;
    if (!b64) return json({error: 'OpenAI didn’t return an image.'}, 502);
    return json({image: 'data:image/jpeg;base64,' + b64});
  }
};

function openaiMessage(text, status) {
  let msg = '';
  try { msg = JSON.parse(text).error.message || ''; } catch {}
  if (status === 401) return 'OpenAI rejected the API key. Check the OPENAI_API_KEY secret.';
  if (status === 429) return 'OpenAI says you’re out of credit or sending too fast. Check your OpenAI billing.';
  return 'OpenAI: ' + (msg || `error ${status}`);
}
