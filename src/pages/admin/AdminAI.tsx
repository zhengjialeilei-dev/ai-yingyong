import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Lock, CheckCircle, AlertCircle, Loader2, Trash2, Pencil, X, ArrowLeft, RefreshCw, FileText, Image, Sparkles, ImageDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage, formatFileSize } from '../../lib/imageUtils';

const CATEGORIES = [
  '数与代数',
  '图形与几何',
  '统计与概率',
  '综合实践',
  '微课',
  '习题',
  '其它'
];

const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '通用', '拓展'
];

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  grade: string;
  image_url: string;
  file_path: string;
  resource_type: string;
  created_at: string;
}

const AdminAI = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('manage');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', coverImage: null as File | null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .neq('category', '赋能教学')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResources();
    }
  }, [isAuthenticated]);

  const handleDelete = async (resource: Resource) => {
    setLoading(true);
    setError(null);
    try {
      if (resource.file_path?.includes('supabase')) {
        const filePath = resource.file_path.split('/ai-apps/')[1];
        if (filePath) {
          const decodedPath = decodeURIComponent(filePath);
          await supabase.storage.from('ai-apps').remove([decodedPath]);
        }
      }
      if (resource.image_url?.includes('supabase')) {
        const imgPath = resource.image_url.split('/ai-apps/')[1];
        if (imgPath) {
          const decodedPath = decodeURIComponent(imgPath);
          await supabase.storage.from('ai-apps').remove([decodedPath]);
        }
      }

      const { error: dbError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);
      
      if (dbError) throw new Error(`删除失败: ${dbError.message}`);

      setResources(prev => prev.filter(r => r.id !== resource.id));
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    setLoading(true);
    try {
      let newImageUrl: string | undefined;

      if (editForm.coverImage) {
        // 压缩图片为 WebP 格式
        const { blob: compressedBlob, fileName: compressedFileName } = await compressImage(editForm.coverImage, {
          maxWidth: 640,
          quality: 0.85,
          format: 'webp'
        });
        
        const imgFileName = `images/${compressedFileName}`;
        const { error: imgError } = await supabase.storage
          .from('ai-apps')
          .upload(imgFileName, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (imgError) throw imgError;

        const { data: { publicUrl } } = supabase.storage
          .from('ai-apps')
          .getPublicUrl(imgFileName);
        
        newImageUrl = publicUrl;
      }

      const updateData: { title: string; description: string; image_url?: string } = {
        title: editForm.title,
        description: editForm.description
      };
      
      if (newImageUrl) {
        updateData.image_url = newImageUrl;
      }

      const { error } = await supabase
        .from('resources')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      setResources(prev => prev.map(r => 
        r.id === id ? { 
          ...r, 
          title: editForm.title, 
          description: editForm.description,
          ...(newImageUrl ? { image_url: newImageUrl } : {})
        } : r
      ));
      setEditingId(null);
      setEditForm({ title: '', description: '', coverImage: null });
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (resource: Resource) => {
    setEditingId(resource.id);
    setEditForm({ title: resource.title, description: resource.description, coverImage: null });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'zheng135') {
      setIsAuthenticated(true);
    } else {
      setError('密码错误');
    }
  };

  const getSafeFileName = (originalName: string) => {
    const ext = originalName.split('.').pop() || '';
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${Date.now()}_${randomStr}.${ext}`;
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

      const htmlFileName = `apps/${getSafeFileName(htmlFile.name)}`;
      const { error: htmlError } = await supabase.storage
        .from('ai-apps')
        .upload(htmlFileName, htmlFile, {
          contentType: 'text/html',
          cacheControl: '3600'
        });

      if (htmlError) throw htmlError;

      const { data: { publicUrl: htmlUrl } } = supabase.storage
        .from('ai-apps')
        .getPublicUrl(htmlFileName);

      // 压缩图片为 WebP 格式，最大宽度 640px
      const { blob: compressedBlob, fileName: compressedFileName } = await compressImage(coverImage, {
        maxWidth: 640,
        quality: 0.85,
        format: 'webp'
      });
      
      const imgFileName = `images/${compressedFileName}`;
      const { error: imgError } = await supabase.storage
        .from('ai-apps')
        .upload(imgFileName, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (imgError) throw imgError;

      const { data: { publicUrl: imgUrl } } = supabase.storage
        .from('ai-apps')
        .getPublicUrl(imgFileName);

      const { error: dbError } = await supabase.from('resources').insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        grade: formData.grade,
        image_url: imgUrl,
        file_path: htmlUrl,
        resource_type: 'html',
        route_path: null
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setFormData({ ...formData, title: '', description: '' });
      setHtmlFile(null);
      setCoverImage(null);
      setCompressInfo(null);

    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-purple-200/50 w-full max-w-md border border-purple-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">AI赋能管理</h2>
          <p className="text-center text-slate-400 mb-8 text-sm">管理 AI 教学应用资源</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
              placeholder="管理员密码"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
            >
              进入管理
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
            >
              返回首页
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-purple-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">AI赋能管理</h1>
                <p className="text-xs text-slate-400">管理教学AI应用</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            退出
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'manage' 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100'
            }`}
          >
            资源管理
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'upload' 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-purple-100'
            }`}
          >
            上传资源
          </button>
        </div>

        {/* 资源管理 */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-purple-100/50 border border-purple-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-700">AI应用资源 ({resources.length})</h2>
              <button
                onClick={fetchResources}
                disabled={loadingResources}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingResources ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>

            {loadingResources ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-purple-200 mx-auto mb-3" />
                <p className="text-slate-400">暂无资源</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-purple-50 hover:border-purple-100 hover:bg-purple-50/30 transition-all group"
                  >
                    <div className="w-16 h-12 rounded-lg bg-purple-100 overflow-hidden flex-shrink-0">
                      {resource.image_url ? (
                        <img src={resource.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-5 h-5 text-purple-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === resource.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="标题"
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="描述"
                          />
                          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50">
                            <Image className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-500 truncate">
                              {editForm.coverImage ? editForm.coverImage.name : '更换封面'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.files?.[0] || null })}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-slate-800 truncate">{resource.title}</h3>
                          <p className="text-sm text-slate-400 truncate">{resource.description}</p>
                        </>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{resource.category}</span>
                        <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{resource.grade}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === resource.id ? (
                        <>
                          <button onClick={() => handleRename(resource.id)} disabled={loading} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : deletingId === resource.id ? (
                        <>
                          <button onClick={() => handleDelete(resource)} disabled={loading} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600">确认删除</button>
                          <button onClick={() => setDeletingId(null)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(resource)} className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(resource.id)} className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-red-100 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        )}

        {/* 上传视图 */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-purple-100/50 border border-purple-50">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">上传成功！</h2>
                <p className="text-slate-500 mb-8">AI应用已添加到资源库</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setSuccess(false); setActiveTab('manage'); fetchResources(); }} className="px-6 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200">
                    查看列表
                  </button>
                  <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90">
                    继续上传
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">资源标题</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="例如：三角形面积演示"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">适用年级</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                    >
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">资源分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
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
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none h-24 resize-none"
                      placeholder="简要描述这个资源..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-purple-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      HTML 文件
                    </label>
                    <input
                      type="file"
                      accept=".html,.htm"
                      required
                      onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer border border-purple-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                      封面图片
                      <span className="text-xs font-normal text-purple-400 flex items-center gap-1">
                        <ImageDown className="w-3 h-3" />
                        自动压缩为 WebP
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverImage(file);
                          // 显示压缩预览信息
                          try {
                            const { blob } = await compressImage(file, { maxWidth: 640, quality: 0.85, format: 'webp' });
                            setCompressInfo({ original: file.size, compressed: blob.size });
                          } catch {
                            setCompressInfo(null);
                          }
                        } else {
                          setCoverImage(null);
                          setCompressInfo(null);
                        }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer border border-purple-200 rounded-xl"
                    />
                    {compressInfo && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                        <ImageDown className="w-3.5 h-3.5" />
                        <span>
                          {formatFileSize(compressInfo.original)} → {formatFileSize(compressInfo.compressed)}
                          <span className="ml-1 text-emerald-500 font-medium">
                            (节省 {Math.round((1 - compressInfo.compressed / compressInfo.original) * 100)}%)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />上传中...</>
                  ) : (
                    <><Upload className="w-5 h-5" />确认上传</>
                  )}
                </button>
                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />{error}
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAI;

