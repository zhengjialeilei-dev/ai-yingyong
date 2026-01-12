import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2 } from 'lucide-react';

const HtmlViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'HTML 查看器';

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
        <iframe
          id="html-frame"
          src={url}
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


