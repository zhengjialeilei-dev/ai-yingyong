import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  '数与代数',
  '图形与几何',
  '统计与概率',
  '综合实践',
  '赋能教学',
  '微课',
  '习题',
  '其它'
];

const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '通用', '拓展'
];

const AdminUpload = () => {
  const navigate = useNavigate();
  // 简单的前端密码保护
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // 表单状态
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    grade: GRADES[0],
  });
  
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 硬编码的简单密码，实际生产环境请使用 Supabase Auth
    if (password === 'admin888') {
      setIsAuthenticated(true);
    } else {
      setError('密码错误');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!htmlFile || !coverImage) {
        throw new Error('请同时上传 HTML 文件和封面图片');
      }

      // 1. 上传 HTML 文件
      const htmlFileName = `apps/${Date.now()}_${htmlFile.name}`;
      const { data: htmlData, error: htmlError } = await supabase.storage
        .from('ai-apps')
        .upload(htmlFileName, htmlFile);

      if (htmlError) throw htmlError;

      const { data: { publicUrl: htmlUrl } } = supabase.storage
        .from('ai-apps')
        .getPublicUrl(htmlFileName);

      // 2. 上传封面图片
      const imgFileName = `images/${Date.now()}_${coverImage.name}`;
      const { data: imgData, error: imgError } = await supabase.storage
        .from('ai-apps')
        .upload(imgFileName, coverImage);

      if (imgError) throw imgError;

      const { data: { publicUrl: imgUrl } } = supabase.storage
        .from('ai-apps')
        .getPublicUrl(imgFileName);

      // 3. 插入数据库
      // 注意：我们的 file_path 这里存储的是相对路径还是完整 URL？
      // 原有逻辑中 file_path 是文件名 (e.g. 'ci.HTML')，用于拼接 /ai-apps/
      // 现在我们可以直接存储完整 URL 到 route_path 或者修改逻辑。
      // 为了兼容性，如果 resource_type 是 'html'，且我们有了完整 URL，
      // 我们可以把完整 URL 存入 route_path (如果前端支持直接跳转) 或者 file_path。
      // 让我们看看 Home.tsx: href={`/ai-apps/${app.file_path}`}
      // 这意味着原有代码期望文件在 public/ai-apps/ 下。
      // 但现在文件在 Supabase Storage。
      // 我们需要修改 Home.tsx 来支持完整的 URL。
      // 现在的策略：将完整 URL 存入 file_path，并在前端判断是否是 http 开头。

      const { error: dbError } = await supabase.from('resources').insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        grade: formData.grade,
        image_url: imgUrl,
        file_path: htmlUrl, // 存入完整 URL
        resource_type: 'html',
        route_path: null // 这是一个 HTML 资源，不是 React 路由
      });

      if (dbError) throw dbError;

      setSuccess(true);
      // 重置表单
      setFormData({ ...formData, title: '', description: '' });
      setHtmlFile(null);
      setCoverImage(null);
      
      // 3秒后跳转回首页查看
      setTimeout(() => {
        // navigate('/');
      }, 3000);

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || '上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">管理员入口</h2>
          <p className="text-center text-slate-400 mb-8 text-sm">请输入访问密码以继续</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 focus:outline-none transition-all"
                placeholder="访问密码"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
            >
              验证身份
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Upload className="w-8 h-8 text-slate-900" />
            上传资源
          </h1>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            退出登录
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">上传成功！</h2>
              <p className="text-slate-500 mb-8">资源已同步到数据库，现在可以在首页看到了。</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                继续上传
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">资源标题</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="例如：三角形面积演示"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">适用年级</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">资源分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">描述</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none h-24 resize-none"
                    placeholder="简要描述这个资源的功能..."
                  />
                </div>
              </div>

              {/* 文件上传 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    HTML 文件
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".html,.htm"
                      required
                      onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer border border-slate-200 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-slate-400">支持 .html, .htm 格式</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    封面图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all cursor-pointer border border-slate-200 rounded-xl"
                  />
                  <p className="text-xs text-slate-400">推荐尺寸 4:3，支持 jpg, png</p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在上传并同步...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      确认上传
                    </>
                  )}
                </button>
                {error && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
