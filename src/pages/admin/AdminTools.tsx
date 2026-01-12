import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, CheckCircle, AlertCircle, Loader2, Trash2, Pencil, X, ArrowLeft, RefreshCw, FileText, Image, Zap, Plus, ImageDown, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage, formatFileSize } from '../../lib/imageUtils';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  grade: string;
  image_url: string;
  file_path: string;
  route_path: string;
  resource_type: string;
  created_at: string;
}

const TOOL_ROUTES = [
  { label: '随机点名', value: '/tools/random-picker' },
  { label: '课堂计时器', value: '/tools/timer' },
  { label: '小组计分板', value: '/tools/scoreboard' },
];

const AdminTools = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
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
    route_path: TOOL_ROUTES[0].value,
    resourceType: 'react' as 'react' | 'html', // 新增：资源类型
  });
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('category', '赋能教学')
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
      // 删除封面图片
      if (resource.image_url?.includes('supabase')) {
        const imgPath = resource.image_url.split('/ai-apps/')[1];
        if (imgPath) {
          await supabase.storage.from('ai-apps').remove([decodeURIComponent(imgPath)]);
        }
      }

      // 删除 HTML 文件（如果存在）
      if (resource.file_path?.includes('supabase')) {
        const filePath = resource.file_path.split('/ai-apps/')[1];
        if (filePath) {
          await supabase.storage.from('ai-apps').remove([decodeURIComponent(filePath)]);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!coverImage) {
        throw new Error('请上传封面图片');
      }

      // 压缩图片为 WebP 格式
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
        category: '赋能教学',
        grade: '通用',
        image_url: imgUrl,
        file_path: null,
        resource_type: 'react',
        route_path: formData.route_path
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setFormData({ ...formData, title: '', description: '' });
      setCoverImage(null);

    } catch (err: any) {
      setError(err.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-orange-200/50 w-full max-w-md border border-orange-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">互动工具管理</h2>
          <p className="text-center text-slate-400 mb-8 text-sm">管理课堂互动工具资源</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
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
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/30"
            >
              进入管理
            </button>
            <button
              type="button"
              onClick={() => navigate('/empower')}
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/empower')}
              className="p-2.5 rounded-xl bg-white border border-orange-100 hover:bg-orange-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">互动工具管理</h1>
                <p className="text-xs text-slate-400">管理课堂互动工具</p>
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
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white text-slate-600 hover:bg-orange-50 border border-orange-100'
            }`}
          >
            工具管理
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'add' 
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white text-slate-600 hover:bg-orange-50 border border-orange-100'
            }`}
          >
            添加工具
          </button>
        </div>

        {/* 工具管理 */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-100/50 border border-orange-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-700">互动工具 ({resources.length})</h2>
              <button
                onClick={fetchResources}
                disabled={loadingResources}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingResources ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>

            {loadingResources ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-orange-200 mx-auto mb-3" />
                <p className="text-slate-400">暂无工具</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-orange-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all group"
                  >
                    <div className="w-16 h-12 rounded-lg bg-orange-100 overflow-hidden flex-shrink-0">
                      {resource.image_url ? (
                        <img src={resource.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-5 h-5 text-orange-300" />
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
                            className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="标题"
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="描述"
                          />
                          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50">
                            <Image className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-500 truncate">
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
                        {resource.resource_type === 'html' ? (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">HTML 文件</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{resource.route_path}</span>
                        )}
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
                          <button onClick={() => startEditing(resource)} className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(resource.id)} className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-red-100 hover:text-red-600">
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

        {/* 添加工具 */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-orange-100/50 border border-orange-50">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">添加成功！</h2>
                <p className="text-slate-500 mb-8">工具已添加到资源库</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setSuccess(false); setActiveTab('manage'); fetchResources(); }} className="px-6 py-3 bg-orange-100 text-orange-700 rounded-xl font-bold hover:bg-orange-200">
                    查看列表
                  </button>
                  <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold hover:opacity-90">
                    继续添加
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-6">
                {/* 资源类型选择 */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">资源类型</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, resourceType: 'react' })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.resourceType === 'react'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-orange-200 hover:border-orange-300'
                      }`}
                    >
                      <Zap className={`w-6 h-6 ${formData.resourceType === 'react' ? 'text-orange-600' : 'text-orange-400'}`} />
                      <span className={`text-sm font-medium ${formData.resourceType === 'react' ? 'text-orange-700' : 'text-slate-600'}`}>React 路由工具</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, resourceType: 'html' })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.resourceType === 'html'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-orange-200 hover:border-orange-300'
                      }`}
                    >
                      <Code className={`w-6 h-6 ${formData.resourceType === 'html' ? 'text-orange-600' : 'text-orange-400'}`} />
                      <span className={`text-sm font-medium ${formData.resourceType === 'html' ? 'text-orange-700' : 'text-slate-600'}`}>HTML 文件</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">工具名称</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      placeholder="例如：随机点名"
                    />
                  </div>
                  
                  {formData.resourceType === 'react' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">关联路由</label>
                      <select
                        value={formData.route_path}
                        onChange={(e) => setFormData({...formData, route_path: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                      >
                        {TOOL_ROUTES.map(r => <option key={r.value} value={r.value}>{r.label} ({r.value})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        HTML 文件
                      </label>
                      <input
                        type="file"
                        accept=".html,.htm"
                        required={formData.resourceType === 'html'}
                        onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-orange-200 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">描述</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:outline-none h-24 resize-none"
                      placeholder="简要描述这个工具..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-orange-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      封面图片
                      <span className="text-xs font-normal text-orange-400 flex items-center gap-1">
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
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-orange-200 rounded-xl"
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
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />添加中...</>
                  ) : (
                    <><Plus className="w-5 h-5" />确认添加</>
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

export default AdminTools;

