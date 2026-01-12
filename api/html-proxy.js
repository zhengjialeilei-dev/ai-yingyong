// Vercel Serverless Function: /api/html-proxy?url=...
// 作用：服务端拉取 Supabase Storage 的 HTML，并以 text/html 返回，绕过浏览器端 CORS/Content-Type 问题。

const ALLOWED_HOST_SUFFIXES = ['.supabase.co'];
const ALLOWED_PATH_MARKERS = ['/storage/v1/object/public/ai-apps/', '/storage/v1/object/public/teaching/'];

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    const hostOk = ALLOWED_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s));
    const pathOk = ALLOWED_PATH_MARKERS.some((m) => u.pathname.includes(m));
    return hostOk && pathOk;
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  try {
    const rawUrl = req.query?.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Missing url' }));
      return;
    }

    if (!isAllowedUrl(rawUrl)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'URL not allowed' }));
      return;
    }

    const upstream = await fetch(rawUrl, { redirect: 'follow' });
    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: `Upstream error: ${upstream.status} ${upstream.statusText}` }));
      return;
    }

    const text = await upstream.text();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 允许缓存一段时间，减少重复请求
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(text);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};


