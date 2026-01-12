import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, CheckCircle, AlertCircle, Loader2, Trash2, Pencil, X, ArrowLeft, RefreshCw, FileText, GraduationCap, BookOpen, FileCheck, Presentation, ScrollText, Code, ImageDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage, formatFileSize } from '../../lib/imageUtils';

interface TeachingResource {
  id: string;
  title: string;
  description: string;
  zone: string; // 课标、课本、教案、课件
  file_url: string;
  file_type: string;
  image_url?: string; // HTML 资源的封面图片
  created_at?: string;
}

const ZONES = [
  { id: 'standard', label: '课标', icon: ScrollText, color: 'blue' },
  { id: 'textbook', label: '课本', icon: BookOpen, color: 'emerald' },
  { id: 'plan', label: '教案', icon: FileCheck, color: 'amber' },
  { id: 'courseware', label: '课件', icon: Presentation, color: 'purple' },
];

const AdminTeaching = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('manage');
  const [resources, setResources] = useState<TeachingResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    zone: 'standard',
    fileType: 'document' as 'document' | 'html', // 新增：文件类型
  });
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [compressInfo, setCompressInfo] = useState<{ original: number; compressed: number } | null>(null);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      // 获取文档资源
      const { data: docData, error: docError } = await supabase
        .from('teaching_resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 获取 HTML 资源（分类为"教学专区-xxx"）
      const { data: htmlData, error: htmlError } = await supabase
        .from('resources')
        .select('*')
        .like('category', '教学专区-%')
        .order('created_at', { ascending: false });
      
      const allResources: TeachingResource[] = [];
      
      // 添加文档资源
      if (!docError && docData) {
        allResources.push(...docData.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          zone: doc.zone,
          file_url: doc.file_url,
          file_type: doc.file_type
        })));
      }
      
      // 添加 HTML 资源（转换格式）
      if (!htmlError && htmlData) {
        htmlData.forEach(html => {
          const zone = html.category.replace('教学专区-', '');
          allResources.push({
            id: html.id,
            title: html.title,
            description: html.description,
            zone: zone,
            file_url: html.file_path || '',
            file_type: 'html',
            image_url: html.image_url
          });
        });
      }
      
      setResources(allResources);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResources();
    }
  }, [isAuthenticated]);

  const handleDelete = async (resource: TeachingResource) => {
    setLoading(true);
    setError(null);
    try {
      if (resource.file_type === 'html') {
        // HTML 资源：从 resources 表删除
        if (resource.file_url?.includes('supabase')) {
          const filePath = resource.file_url.split('/ai-apps/')[1];
          if (filePath) {
            await supabase.storage.from('ai-apps').remove([decodeURIComponent(filePath)]);
          }
        }
        
        // 删除封面图片
        if (resource.image_url?.includes('supabase')) {
          const imgPath = resource.image_url.split('/ai-apps/')[1];
          if (imgPath) {
            await supabase.storage.from('ai-apps').remove([decodeURIComponent(imgPath)]);
          }
        }
        
        const { error: dbError } = await supabase
          .from('resources')
          .delete()
          .eq('id', resource.id);
        
        if (dbError) throw new Error(`删除失败: ${dbError.message}`);
      } else {
        // 文档资源：从 teaching_resources 表删除
        if (resource.file_url?.includes('supabase')) {
          const filePath = resource.file_url.split('/teaching/')[1];
          if (filePath) {
            await supabase.storage.from('TEACHING').remove([decodeURIComponent(filePath)]);
          }
        }

        const { error: dbError } = await supabase
          .from('teaching_resources')
          .delete()
          .eq('id', resource.id);
        
        if (dbError) throw new Error(`删除失败: ${dbError.message}`);
      }

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
      const { error } = await supabase
        .from('teaching_resources')
        .update({
          title: editForm.title,
          description: editForm.description
        })
        .eq('id', id);
      
      if (error) throw error;

      setResources(prev => prev.map(r => 
        r.id === id ? { ...r, title: editForm.title, description: editForm.description } : r
      ));
      setEditingId(null);
      setEditForm({ title: '', description: '' });
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (resource: TeachingResource) => {
    setEditingId(resource.id);
    setEditForm({ title: resource.title, description: resource.description });
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
      if (formData.fileType === 'html') {
        // HTML 文件上传到 ai-apps，保存到 resources 表
        if (!htmlFile || !coverImage) {
          throw new Error('请同时上传 HTML 文件和封面图片');
        }

        // 上传 HTML 文件
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

        // 压缩并上传封面图片
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

        // 保存到 resources 表，使用特殊分类标识教学专区
        const { error: dbError } = await supabase.from('resources').insert({
          title: formData.title,
          description: formData.description,
          category: `教学专区-${formData.zone}`, // 使用特殊分类标识
          grade: '通用',
          image_url: imgUrl,
          file_path: htmlUrl,
          resource_type: 'html',
          route_path: null
        });

        if (dbError) throw dbError;
      } else {
        // 文档文件上传到 teaching，保存到 teaching_resources 表
        if (!uploadFile) {
          throw new Error('请选择文件');
        }

        const fileName = `${formData.zone}/${getSafeFileName(uploadFile.name)}`;
        const fileExt = uploadFile.name.split('.').pop()?.toLowerCase() || '';
        
        let contentType = 'application/octet-stream';
        if (fileExt === 'pdf') contentType = 'application/pdf';
        else if (['doc', 'docx'].includes(fileExt)) contentType = 'application/msword';
        else if (['ppt', 'pptx'].includes(fileExt)) contentType = 'application/vnd.ms-powerpoint';
        
        const { error: uploadError } = await supabase.storage
          .from('TEACHING')
          .upload(fileName, uploadFile, {
            contentType,
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('TEACHING')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('teaching_resources').insert({
          title: formData.title,
          description: formData.description,
          zone: formData.zone,
          file_url: publicUrl,
          file_type: fileExt
        });

        if (dbError) throw dbError;
      }

      setSuccess(true);
      setFormData({ ...formData, title: '', description: '', fileType: 'document' });
      setUploadFile(null);
      setHtmlFile(null);
      setCoverImage(null);
      setCompressInfo(null);

    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  const getZoneInfo = (zoneId: string) => {
    return ZONES.find(z => z.id === zoneId) || ZONES[0];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-blue-200/50 w-full max-w-md border border-blue-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">教学专区管理</h2>
          <p className="text-center text-slate-400 mb-8 text-sm">管理教学资料与文档</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
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
              className="w-full bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/30"
            >
              进入管理
            </button>
            <button
              type="button"
              onClick={() => navigate('/teaching-zone')}
              className="w-full text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
            >
              返回教学专区
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teaching-zone')}
              className="p-2.5 rounded-xl bg-white border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">教学专区管理</h1>
                <p className="text-xs text-slate-400">管理教学资料</p>
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
                ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white text-slate-600 hover:bg-blue-50 border border-blue-100'
            }`}
          >
            资料管理
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'upload' 
                ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white text-slate-600 hover:bg-blue-50 border border-blue-100'
            }`}
          >
            上传资料
          </button>
        </div>

        {/* 资料管理 */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-100/50 border border-blue-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-700">教学资料 ({resources.length})</h2>
              <button
                onClick={fetchResources}
                disabled={loadingResources}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingResources ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>

            {loadingResources ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                <p className="text-slate-400">暂无资料</p>
                <p className="text-xs text-slate-300 mt-2">提示：需要先在 Supabase 创建 teaching_resources 表和 teaching 存储桶</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => {
                  const zoneInfo = getZoneInfo(resource.zone);
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-blue-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                    >
                      {resource.file_type === 'html' && resource.image_url ? (
                        <div className="w-16 h-12 rounded-lg bg-blue-100 overflow-hidden flex-shrink-0">
                          <img src={resource.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl bg-${zoneInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <zoneInfo.icon className={`w-6 h-6 text-${zoneInfo.color}-600`} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {editingId === resource.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="标题"
                            />
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="描述"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-slate-800 truncate">{resource.title}</h3>
                            <p className="text-sm text-slate-400 truncate">{resource.description}</p>
                          </>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 bg-${zoneInfo.color}-100 text-${zoneInfo.color}-700 rounded-full`}>{zoneInfo.label}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase">{resource.file_type}</span>
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
                            <button onClick={() => startEditing(resource)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeletingId(resource.id)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-red-100 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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

        {/* 上传资料 */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-100/50 border border-blue-50">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">上传成功！</h2>
                <p className="text-slate-500 mb-8">资料已添加到教学专区</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => { setSuccess(false); setActiveTab('manage'); fetchResources(); }} className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200">
                    查看列表
                  </button>
                  <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-xl font-bold hover:opacity-90">
                    继续上传
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-6">
                {/* 区域选择 */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">选择区域</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, zone: zone.id })}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.zone === zone.id
                            ? `border-${zone.color}-500 bg-${zone.color}-50`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <zone.icon className={`w-6 h-6 ${formData.zone === zone.id ? `text-${zone.color}-600` : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${formData.zone === zone.id ? `text-${zone.color}-700` : 'text-slate-600'}`}>{zone.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">资料标题</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="例如：数学课程标准"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">资料描述</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="简要描述..."
                    />
                  </div>
                </div>

                {/* 文件类型选择 */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">文件类型</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fileType: 'document' })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.fileType === 'document'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-200 hover:border-blue-300'
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${formData.fileType === 'document' ? 'text-blue-600' : 'text-blue-400'}`} />
                      <span className={`text-sm font-medium ${formData.fileType === 'document' ? 'text-blue-700' : 'text-slate-600'}`}>文档文件</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fileType: 'html' })}
                      className={`p4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.fileType === 'html'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-200 hover:border-blue-300'
                      }`}
                    >
                      <Code className={`w-6 h-6 ${formData.fileType === 'html' ? 'text-blue-600' : 'text-blue-400'}`} />
                      <span className={`text-sm font-medium ${formData.fileType === 'html' ? 'text-blue-700' : 'text-slate-600'}`}>HTML 文件</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-blue-100">
                  {formData.fileType === 'html' ? (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            HTML 文件
                          </label>
                          <input
                            type="file"
                            accept=".html,.htm"
                            required
                            onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-blue-200 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            封面图片
                            <span className="text-xs font-normal text-blue-400 flex items-center gap-1">
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
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-blue-200 rounded-xl"
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
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        上传文件
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        required
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-blue-200 rounded-xl"
                      />
                      <p className="text-xs text-slate-400">支持 PDF、Word、PPT 格式</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
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

export default AdminTeaching;

