// Hämtar produktbild (og:image) från en produktsida, så att Inköp kan visa en bild.
// Anropas av sidan som /api/og?url=https://...  Svar: { "img": "https://..." } eller { "img": null }
const dns = require('dns').promises;
const net = require('net');

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const l = ip.toLowerCase();
  if (l.startsWith('::ffff:')) return isPrivate(l.slice(7));
  return l === '::' || l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80');
}
async function safeTarget(u) {
  if (!/^https?:$/.test(u.protocol)) return false;
  if (u.username || u.password) return false;
  const addrs = await dns.lookup(u.hostname, { all: true });
  return addrs.length > 0 && !addrs.some(a => isPrivate(a.address));
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;|&#47;/g, '/');
function attrs(tag) {
  const o = {}; const re = /([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g; let m;
  while ((m = re.exec(tag))) o[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
  return o;
}
function findImage(html) {
  const metas = (html.match(/<meta\b[^>]*>/gi) || []).map(attrs);
  for (const key of ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']) {
    const m = metas.find(a => (a.property || a.name || '').toLowerCase() === key && a.content);
    if (m) return m.content;
  }
  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []) {
    const m = block.match(/"image"\s*:\s*(\[\s*)?(\{[^}]*?"url"\s*:\s*)?"([^"]+)"/);
    if (m) return m[3].replace(/\\\//g, '/');
  }
  const link = (html.match(/<link\b[^>]*>/gi) || []).map(attrs).find(a => (a.rel || '').toLowerCase() === 'image_src' && a.href);
  return link ? link.href : null;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');
  try {
    let u = new URL(String(req.query.url || ''));
    let r;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await safeTarget(u))) throw new Error('blocked');
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 7000);
      r = await fetch(u, { redirect: 'manual', signal: ctl.signal, headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'accept': 'text/html,application/xhtml+xml', 'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7' } });
      clearTimeout(timer);
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u); continue; }
      break;
    }
    if (!r || !r.ok || !(r.headers.get('content-type') || '').includes('html')) return res.status(200).json({ img: null });
    const reader = r.body.getReader(); const dec = new TextDecoder(); let html = '', n = 0;
    while (n < 800000) {
      const { done, value } = await reader.read(); if (done) break;
      n += value.length; html += dec.decode(value, { stream: true });
      if (/<\/head>/i.test(html) && /og:image/i.test(html)) break;
    }
    try { reader.cancel(); } catch (e) {}
    const found = findImage(html);
    const img = found ? new URL(found, u).href : null;
    res.status(200).json({ img: img && /^https?:/.test(img) ? img : null });
  } catch (e) {
    res.status(200).json({ img: null });
  }
};
