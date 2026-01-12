import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Edit3,
  FileText,
  FolderOpen,
  GraduationCap,
  ImageDown,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage, formatFileSize } from '../../lib/imageUtils';

const AI_CATEGORIES = [
  '数与代数',
  '图形与几何',
  '统计与概率',
  '综合实践',
  '微课',
  '习题',
  '其它',
] as const;

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '通用', '拓展'] as const;

const TEACHING_ZONES = [
  { id: 'standard', label: '课标' },
  { id: 'textbook', label: '课本' },
  { id: 'plan', label: '教案' },
  { id: 'courseware', label: '课件' },
];

type Section = 'ai' | 'tools' | 'teaching';
type Mode = 'upload' | 'manage';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  grade: string;
  image_url: string;
  file_path?: string;
  route_path?: string;
  resource_type?: string;
  created_at?: string;
}

interface TeachingResource {
  id: string;
  title: string;
  description: string;
  zone: string;
  file_url: string;
  file_type: string;
  created_at?: string;
}

const getSafeFileName = (originalName: string) => {
  const ext = originalName.split('.').pop() || '';
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${Date.now()}_${randomStr}.${ext}`;
};

const AdminUpload = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('upload');
  const [section, setSection] = useState<Section>('ai');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resources list
  const [resources, setResources] = useState<Resource[]>([]);
  const [teachingResources, setTeachingResources] = useState<TeachingResource[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'resource' | 'teaching'; item: Resource | TeachingResource } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<{ type: 'resource' | 'teaching'; item: Resource | TeachingResource } | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // AI赋能（HTML）
  const [aiForm, setAiForm] = useState({
    title: '',
    description: '',
    category: AI_CATEGORIES[0],
    grade: GRADES[0],
  });
  const [aiHtml, setAiHtml] = useState<File | null>(null);
  const [aiCover, setAiCover] = useState<File | null>(null);
  const [aiCompress, setAiCompress] = useState<{ original: number; compressed: number } | null>(null);

  // 互动工具（HTML，固定 category=赋能教学）
  const [toolsForm, setToolsForm] = useState({
    title: '',
    description: '',
  });
  const [toolsHtml, setToolsHtml] = useState<File | null>(null);
  const [toolsCover, setToolsCover] = useState<File | null>(null);
  const [toolsCompress, setToolsCompress] = useState<{ original: number; compressed: number } | null>(null);

  // 教学专区（文档：PDF/Word/PPT）
  const [teachingForm, setTeachingForm] = useState({
    title: '',
    description: '',
    zone: TEACHING_ZONES[0].id,
  });
  const [teachingFile, setTeachingFile] = useState<File | null>(null);

  const header = useMemo(() => {
    if (section === 'ai') return { title: 'AI赋能', desc: 'AI 教学应用 HTML + 封面', color: 'violet' };
    if (section === 'tools') return { title: '互动工具', desc: '课堂互动 HTML 工具 + 封面', color: 'amber' };
    return { title: '教学专区', desc: 'PDF / Word / PPT 资料', color: 'sky' };
  }, [section]);

  // Fetch resources when in manage mode
  useEffect(() => {
    if (mode === 'manage' && isAuthenticated) {
      fetchResources();
    }
  }, [mode, section, isAuthenticated]);

  const fetchResources = async () => {
    setListLoading(true);
    try {
      if (section === 'teaching') {
        const { data, error } = await supabase
          .from('teaching_resources')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTeachingResources(data || []);
      } else {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Filter based on section
        const filtered = section === 'ai'
          ? (data || []).filter(r => r.category !== '赋能教学')
          : (data || []).filter(r => r.category === '赋能教学');
        setResources(filtered);
      }
    } catch (err: any) {
      console.error('获取资源列表失败:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password === 'zheng135') setIsAuthenticated(true);
    else setError('密码错误');
  };

  const uploadHtmlWithCover = async (params: {
    title: string;
    description: string;
    category: string;
    grade: string;
    htmlFile: File;
    coverFile: File;
  }): Promise<any> => {
    const { title, description, category, grade, htmlFile, coverFile } = params;

    const htmlKey = `apps/${getSafeFileName(htmlFile.name)}`;
    const { error: htmlError } = await supabase.storage.from('ai-apps').upload(htmlKey, htmlFile, {
      contentType: 'text/html',
      cacheControl: '3600',
    });
    if (htmlError) throw htmlError;
    const { data: htmlPub } = supabase.storage.from('ai-apps').getPublicUrl(htmlKey);

    const { blob, fileName } = await compressImage(coverFile, { maxWidth: 640, quality: 0.85, format: 'webp' });
    const imgKey = `images/${fileName}`;
    const { error: imgError } = await supabase.storage.from('ai-apps').upload(imgKey, blob, {
      contentType: 'image/webp',
      cacheControl: '3600',
    });
    if (imgError) throw imgError;
    const { data: imgPub } = supabase.storage.from('ai-apps').getPublicUrl(imgKey);

    const { data: insertedData, error: dbError } = await supabase.from('resources').insert({
      title,
      description,
      category,
      grade,
      image_url: imgPub.publicUrl,
      file_path: htmlPub.publicUrl,
      resource_type: 'html',
      route_path: null,
    }).select();
    if (dbError) throw new Error(`数据库写入失败: ${dbError.message || '未知错误'}`);
    return insertedData?.[0];
  };

  const uploadTeachingDoc = async (params: {
    title: string;
    description: string;
    zone: string;
    file: File;
  }): Promise<any> => {
    const { title, description, zone, file } = params;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const key = `${zone}/${getSafeFileName(file.name)}`;

    let contentType = 'application/octet-stream';
    if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'doc' || ext === 'docx') contentType = 'application/msword';
    else if (ext === 'ppt' || ext === 'pptx') contentType = 'application/vnd.ms-powerpoint';

    const { error: upErr } = await supabase.storage.from('teaching').upload(key, file, {
      contentType,
      cacheControl: '3600',
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from('teaching').getPublicUrl(key);
    const { data: insertedData, error: dbErr } = await supabase.from('teaching_resources').insert({
      title,
      description,
      zone,
      file_url: pub.publicUrl,
      file_type: ext,
    }).select();
    if (dbErr) throw new Error(`数据库写入失败: ${dbErr.message || '未知错误'}`);
    return insertedData?.[0];
  };

  const resetSuccessLater = () => setTimeout(() => setSuccessMsg(null), 2500);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (section === 'ai') {
        if (!aiHtml || !aiCover) throw new Error('请同时选择 HTML 文件和封面图片');
        const insertedData = await uploadHtmlWithCover({
          title: aiForm.title,
          description: aiForm.description,
          category: aiForm.category,
          grade: aiForm.grade,
          htmlFile: aiHtml,
          coverFile: aiCover,
        });
        setSuccessMsg(`上传成功！(ID: ${insertedData?.id?.substring(0, 8)}...)`);
        setAiForm({ ...aiForm, title: '', description: '' });
        setAiHtml(null);
        setAiCover(null);
        setAiCompress(null);
        resetSuccessLater();
        return;
      }

      if (section === 'tools') {
        if (!toolsHtml || !toolsCover) throw new Error('请同时选择 HTML 文件和封面图片');
        const insertedData = await uploadHtmlWithCover({
          title: toolsForm.title,
          description: toolsForm.description,
          category: '赋能教学',
          grade: '通用',
          htmlFile: toolsHtml,
          coverFile: toolsCover,
        });
        setSuccessMsg(`上传成功！(ID: ${insertedData?.id?.substring(0, 8)}...)`);
        setToolsForm({ title: '', description: '' });
        setToolsHtml(null);
        setToolsCover(null);
        setToolsCompress(null);
        resetSuccessLater();
        return;
      }

      if (!teachingFile) throw new Error('请选择要上传的文档文件');
      const insertedData = await uploadTeachingDoc({
        title: teachingForm.title,
        description: teachingForm.description,
        zone: teachingForm.zone,
        file: teachingFile,
      });
      setSuccessMsg(`上传成功！(ID: ${insertedData?.id?.substring(0, 8)}...)`);
      setTeachingForm({ ...teachingForm, title: '', description: '' });
      setTeachingFile(null);
      resetSuccessLater();
    } catch (err: any) {
      console.error('上传错误:', err);
      setError(err?.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'resource') {
        const item = deleteTarget.item as Resource;
        
        // Delete from storage if file_path exists
        if (item.file_path) {
          const urlObj = new URL(item.file_path);
          const pathParts = urlObj.pathname.split('/');
          const storageKey = pathParts.slice(-2).join('/'); // e.g., "apps/xxx.html"
          await supabase.storage.from('ai-apps').remove([storageKey]);
        }
        
        // Delete cover image
        if (item.image_url && item.image_url.includes('ai-apps')) {
          const urlObj = new URL(item.image_url);
          const pathParts = urlObj.pathname.split('/');
          const storageKey = pathParts.slice(-2).join('/');
          await supabase.storage.from('ai-apps').remove([storageKey]);
        }

        // Delete from database
        const { error } = await supabase.from('resources').delete().eq('id', item.id);
        if (error) throw error;
        
        setResources(prev => prev.filter(r => r.id !== item.id));
      } else {
        const item = deleteTarget.item as TeachingResource;
        
        // Delete from storage
        if (item.file_url) {
          const urlObj = new URL(item.file_url);
          const pathParts = urlObj.pathname.split('/');
          const storageKey = pathParts.slice(-2).join('/');
          await supabase.storage.from('teaching').remove([storageKey]);
        }

        const { error } = await supabase.from('teaching_resources').delete().eq('id', item.id);
        if (error) throw error;
        
        setTeachingResources(prev => prev.filter(r => r.id !== item.id));
      }

      setSuccessMsg('删除成功！');
      resetSuccessLater();
    } catch (err: any) {
      console.error('删除失败:', err);
      setError(err?.message || '删除失败');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Edit handler - open modal
  const openEditModal = (type: 'resource' | 'teaching', item: Resource | TeachingResource) => {
    setEditTarget({ type, item });
    if (type === 'resource') {
      const r = item as Resource;
      setEditForm({
        title: r.title,
        description: r.description,
        category: r.category,
        grade: r.grade,
      });
    } else {
      const t = item as TeachingResource;
      setEditForm({
        title: t.title,
        description: t.description,
        zone: t.zone,
      });
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);

    try {
      if (editTarget.type === 'resource') {
        const { error } = await supabase
          .from('resources')
          .update({
            title: editForm.title,
            description: editForm.description,
            category: editForm.category,
            grade: editForm.grade,
          })
          .eq('id', editTarget.item.id);
        if (error) throw error;

        setResources(prev => prev.map(r =>
          r.id === editTarget.item.id
            ? { ...r, ...editForm }
            : r
        ));
      } else {
        const { error } = await supabase
          .from('teaching_resources')
          .update({
            title: editForm.title,
            description: editForm.description,
            zone: editForm.zone,
          })
          .eq('id', editTarget.item.id);
        if (error) throw error;

        setTeachingResources(prev => prev.map(r =>
          r.id === editTarget.item.id
            ? { ...r, ...editForm }
            : r
        ));
      }

      setSuccessMsg('保存成功！');
      resetSuccessLater();
      setEditTarget(null);
    } catch (err: any) {
      console.error('保存失败:', err);
      setError(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // Login screen
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 focus:outline-none transition-all"
              placeholder="访问密码"
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
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">管理员后台</h1>
              <p className="text-xs text-slate-400 mt-1">上传、编辑、删除资源</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            退出登录
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => { setMode('upload'); setError(null); setSuccessMsg(null); }}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
              mode === 'upload'
                ? 'bg-white border-emerald-200 shadow-md'
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}
          >
            <Plus className={`w-5 h-5 ${mode === 'upload' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className={`font-bold ${mode === 'upload' ? 'text-slate-800' : 'text-slate-600'}`}>上传新资源</span>
          </button>
          <button
            onClick={() => { setMode('manage'); setError(null); setSuccessMsg(null); }}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
              mode === 'manage'
                ? 'bg-white border-blue-200 shadow-md'
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}
          >
            <FolderOpen className={`w-5 h-5 ${mode === 'manage' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className={`font-bold ${mode === 'manage' ? 'text-slate-800' : 'text-slate-600'}`}>管理资源</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => { setSection('ai'); setError(null); setSuccessMsg(null); }}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
              section === 'ai'
                ? 'bg-white border-violet-200 shadow-sm'
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${section === 'ai' ? 'text-violet-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-semibold ${section === 'ai' ? 'text-slate-800' : 'text-slate-600'}`}>AI赋能</span>
          </button>
          <button
            onClick={() => { setSection('tools'); setError(null); setSuccessMsg(null); }}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
              section === 'tools'
                ? 'bg-white border-amber-200 shadow-sm'
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}
          >
            <Zap className={`w-4 h-4 ${section === 'tools' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-semibold ${section === 'tools' ? 'text-slate-800' : 'text-slate-600'}`}>互动工具</span>
          </button>
          <button
            onClick={() => { setSection('teaching'); setError(null); setSuccessMsg(null); }}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
              section === 'teaching'
                ? 'bg-white border-sky-200 shadow-sm'
                : 'bg-white/60 border-slate-200 hover:bg-white'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${section === 'teaching' ? 'text-sky-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-semibold ${section === 'teaching' ? 'text-slate-800' : 'text-slate-600'}`}>教学专区</span>
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl text-sm border border-emerald-100">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm border border-red-100">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                section === 'ai' ? 'bg-violet-100' : section === 'tools' ? 'bg-amber-100' : 'bg-sky-100'
              }`}>
                {section === 'ai' && <Sparkles className="w-5 h-5 text-violet-600" />}
                {section === 'tools' && <Zap className="w-5 h-5 text-amber-600" />}
                {section === 'teaching' && <GraduationCap className="w-5 h-5 text-sky-600" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{header.title}</h2>
                <p className="text-xs text-slate-400">{header.desc}</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Common fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">标题</label>
                  <input
                    type="text"
                    required
                    value={section === 'ai' ? aiForm.title : section === 'tools' ? toolsForm.title : teachingForm.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (section === 'ai') setAiForm({ ...aiForm, title: v });
                      else if (section === 'tools') setToolsForm({ ...toolsForm, title: v });
                      else setTeachingForm({ ...teachingForm, title: v });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="请输入标题"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">描述</label>
                  <textarea
                    required
                    value={section === 'ai' ? aiForm.description : section === 'tools' ? toolsForm.description : teachingForm.description}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (section === 'ai') setAiForm({ ...aiForm, description: v });
                      else if (section === 'tools') setToolsForm({ ...toolsForm, description: v });
                      else setTeachingForm({ ...teachingForm, description: v });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none h-24 resize-none"
                    placeholder="简要描述..."
                  />
                </div>
              </div>

              {/* Section specific */}
              {section === 'ai' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">分类</label>
                      <select
                        value={aiForm.category}
                        onChange={(e) => setAiForm({ ...aiForm, category: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                      >
                        {AI_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">年级</label>
                      <select
                        value={aiForm.grade}
                        onChange={(e) => setAiForm({ ...aiForm, grade: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                      >
                        {GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        HTML 文件
                      </label>
                      <input
                        type="file"
                        accept=".html,.htm"
                        required
                        onChange={(e) => setAiHtml(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                        封面图片
                        <span className="text-xs font-normal text-slate-400 flex items-center gap-1">
                          <ImageDown className="w-3 h-3" />
                          自动压缩
                        </span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAiCover(file);
                            try {
                              const { blob } = await compressImage(file, { maxWidth: 640, quality: 0.85, format: 'webp' });
                              setAiCompress({ original: file.size, compressed: blob.size });
                            } catch {
                              setAiCompress(null);
                            }
                          } else {
                            setAiCover(null);
                            setAiCompress(null);
                          }
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer border border-slate-200 rounded-xl"
                      />
                      {aiCompress && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                          <ImageDown className="w-3.5 h-3.5" />
                          {formatFileSize(aiCompress.original)} → {formatFileSize(aiCompress.compressed)}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {section === 'tools' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      HTML 文件
                    </label>
                    <input
                      type="file"
                      accept=".html,.htm"
                      required
                      onChange={(e) => setToolsHtml(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      封面图片
                      <span className="text-xs font-normal text-slate-400 flex items-center gap-1">
                        <ImageDown className="w-3 h-3" />
                        自动压缩
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setToolsCover(file);
                          try {
                            const { blob } = await compressImage(file, { maxWidth: 640, quality: 0.85, format: 'webp' });
                            setToolsCompress({ original: file.size, compressed: blob.size });
                          } catch {
                            setToolsCompress(null);
                          }
                        } else {
                          setToolsCover(null);
                          setToolsCompress(null);
                        }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer border border-slate-200 rounded-xl"
                    />
                    {toolsCompress && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                        <ImageDown className="w-3.5 h-3.5" />
                        {formatFileSize(toolsCompress.original)} → {formatFileSize(toolsCompress.compressed)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {section === 'teaching' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">区域</label>
                    <select
                      value={teachingForm.zone}
                      onChange={(e) => setTeachingForm({ ...teachingForm, zone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                    >
                      {TEACHING_ZONES.map((z) => (
                        <option key={z.id} value={z.id}>{z.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      文档文件（PDF/Word/PPT）
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      required
                      onChange={(e) => setTeachingFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在上传...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      确认上传
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Mode */}
        {mode === 'manage' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  section === 'ai' ? 'bg-violet-100' : section === 'tools' ? 'bg-amber-100' : 'bg-sky-100'
                }`}>
                  {section === 'ai' && <Sparkles className="w-5 h-5 text-violet-600" />}
                  {section === 'tools' && <Zap className="w-5 h-5 text-amber-600" />}
                  {section === 'teaching' && <GraduationCap className="w-5 h-5 text-sky-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{header.title} 资源列表</h2>
                  <p className="text-xs text-slate-400">
                    共 {section === 'teaching' ? teachingResources.length : resources.length} 个资源
                  </p>
                </div>
              </div>
              <button
                onClick={fetchResources}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                title="刷新"
              >
                <Loader2 className={`w-4 h-4 text-slate-600 ${listLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resources list */}
                {section !== 'teaching' && resources.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{item.category}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{item.grade}</span>
                        {item.resource_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">{item.resource_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('resource', item)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'resource', item })}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Teaching resources list */}
                {section === 'teaching' && teachingResources.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">
                          {TEACHING_ZONES.find(z => z.id === item.zone)?.label || item.zone}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase">
                          {item.file_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('teaching', item)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'teaching', item })}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {((section !== 'teaching' && resources.length === 0) || (section === 'teaching' && teachingResources.length === 0)) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">暂无资源</p>
                    <button
                      onClick={() => setMode('upload')}
                      className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                      去上传第一个资源
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
                <p className="text-sm text-slate-500">此操作不可恢复</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="font-medium text-slate-800">{deleteTarget.item.title}</p>
              <p className="text-sm text-slate-500 truncate">{deleteTarget.item.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">编辑资源</h3>
                  <p className="text-sm text-slate-500">修改资源信息</p>
                </div>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">标题</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">描述</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none"
                />
              </div>

              {editTarget.type === 'resource' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">分类</label>
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                    >
                      {AI_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="赋能教学">赋能教学</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">年级</label>
                    <select
                      value={editForm.grade || ''}
                      onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editTarget.type === 'teaching' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">区域</label>
                  <select
                    value={editForm.zone || ''}
                    onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    {TEACHING_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
