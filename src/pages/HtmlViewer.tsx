import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const HtmlViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'HTML 查看器';

  const [mode, setMode] = useState<'srcdoc' | 'src'>('srcdoc');
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const baseHref = useMemo(() => {
    if (!url) return null;
    try {
      const u = new URL(url);
      // base 指向当前文件所在目录，确保相对路径资源可用
      u.pathname = u.pathname.replace(/\/[^/]*$/, '/');
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      return null;
    }
  }, [url]);

  const buildSrcDoc = (raw: string) => {
    const base = baseHref ? `<base href="${baseHref}" />` : '';
    // 如果已有 <base>，就不重复注入
    if (/<base\s/i.test(raw)) return raw;

    // 优先插入到 <head> 内；否则插入到文档最前面
    if (/<head[^>]*>/i.test(raw)) {
      return raw.replace(/<head([^>]*)>/i, `<head$1>${base}`);
    }
    return `${base}\n${raw}`;
  };

  const loadViaFetch = async () => {
    if (!url) return;
    setLoading(true);
    setLoadError(null);
    setHtml(null);

    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`加载失败：${res.status} ${res.statusText}`);
      const text = await res.text();

      // 简单判定：如果像 HTML，就用 srcDoc 渲染；否则回退到 src
      const looksLikeHtml = /<!doctype html|<html[\s>]/i.test(text);
      if (!looksLikeHtml) {
        setMode('src');
        setHtml(null);
        return;
      }

      setMode('srcdoc');
      setHtml(buildSrcDoc(text));
    } catch (e: any) {
      // 常见：CORS / 网络错误。此时回退为 iframe src 直连
      setMode('src');
      setHtml(null);
      setLoadError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 默认优先用 srcDoc，能绕过“Content-Type=纯文本导致显示源码”的问题
    void loadViaFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">未提供有效的 URL</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 truncate max-w-md">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            title="在新标签页打开"
          >
            <ExternalLink className="w-4 h-4" />
            新窗口打开
          </a>
          <button
            onClick={() => void loadViaFetch()}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="重新加载"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              const iframe = document.getElementById('html-frame') as HTMLIFrameElement;
              if (iframe?.requestFullscreen) {
                iframe.requestFullscreen();
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="全屏"
          >
            <Maximize2 className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* iframe 容器 */}
      <div className="flex-1 p-4">
        {loading && (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在加载 HTML 内容...
          </div>
        )}
        {loadError && (
          <div className="mb-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">已回退为“直连模式”</div>
              <div className="text-amber-800/80 mt-0.5">{loadError}</div>
              <div className="text-amber-800/70 mt-1">
                直连模式下如果看到源码，通常是 Storage 文件的 Content-Type 不是 text/html。
              </div>
            </div>
          </div>
        )}
        <iframe
          id="html-frame"
          src={mode === 'src' ? url : undefined}
          srcDoc={mode === 'srcdoc' ? (html || undefined) : undefined}
          title={title}
          loading="lazy"
          className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-200"
          style={{ minHeight: 'calc(100vh - 100px)' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};

export default HtmlViewer;


