import React, { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  GraduationCap,
  ImageDown,
  Loader2,
  Lock,
  Sparkles,
  Upload,
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
] as const;

type Section = 'ai' | 'tools' | 'teaching';

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

  const [section, setSection] = useState<Section>('ai');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    if (section === 'ai') return { title: 'AI赋能上传（HTML）', desc: '上传 AI 教学应用 HTML + 封面' };
    if (section === 'tools') return { title: '互动工具上传（HTML）', desc: '上传课堂互动 HTML 工具 + 封面' };
    return { title: '教学专区上传（文档）', desc: '上传 PDF / Word / PPT 到课标/课本/教案/课件' };
  }, [section]);

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

    // 1) HTML -> ai-apps/apps/
    const htmlKey = `apps/${getSafeFileName(htmlFile.name)}`;
    const { error: htmlError } = await supabase.storage.from('ai-apps').upload(htmlKey, htmlFile, {
      contentType: 'text/html',
      cacheControl: '3600',
    });
    if (htmlError) throw htmlError;
    const { data: htmlPub } = supabase.storage.from('ai-apps').getPublicUrl(htmlKey);

    // 2) cover -> webp -> ai-apps/images/
    const { blob, fileName } = await compressImage(coverFile, { maxWidth: 640, quality: 0.85, format: 'webp' });
    const imgKey = `images/${fileName}`;
    const { error: imgError } = await supabase.storage.from('ai-apps').upload(imgKey, blob, {
      contentType: 'image/webp',
      cacheControl: '3600',
    });
    if (imgError) throw imgError;
    const { data: imgPub } = supabase.storage.from('ai-apps').getPublicUrl(imgKey);

    // 3) insert -> resources
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
    if (dbError) {
      console.error('数据库插入错误:', dbError);
      throw new Error(`数据库写入失败: ${dbError.message || '未知错误'}`);
    }
    return insertedData?.[0]; // 返回插入的数据
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
    if (dbErr) {
      console.error('数据库插入错误:', dbErr);
      throw new Error(`数据库写入失败: ${dbErr.message || '未知错误'}`);
    }
    return insertedData?.[0]; // 返回插入的数据
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
        setSuccessMsg(`AI赋能：上传成功！数据已写入数据库 (ID: ${insertedData?.id?.substring(0, 8)}...)`);
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
        setSuccessMsg(`互动工具：上传成功！数据已写入数据库 (ID: ${insertedData?.id?.substring(0, 8)}...)`);
        setToolsForm({ title: '', description: '' });
        setToolsHtml(null);
        setToolsCover(null);
        setToolsCompress(null);
        resetSuccessLater();
        return;
      }

      // teaching docs
      if (!teachingFile) throw new Error('请选择要上传的文档文件');
      const insertedData = await uploadTeachingDoc({
        title: teachingForm.title,
        description: teachingForm.description,
        zone: teachingForm.zone,
        file: teachingFile,
      });
      setSuccessMsg(`教学专区：上传成功！数据已写入数据库 (ID: ${insertedData?.id?.substring(0, 8)}...)`);
      setTeachingForm({ ...teachingForm, title: '', description: '' });
      setTeachingFile(null);
      resetSuccessLater();
    } catch (err: any) {
      console.error('上传错误详情:', err);
      const errorMsg = err?.message || '上传失败';
      // 如果是数据库错误，提供更详细的提示
      if (errorMsg.includes('数据库写入失败') || errorMsg.includes('permission') || errorMsg.includes('RLS')) {
        setError(`${errorMsg}\n\n💡 提示：请检查 Supabase RLS 策略是否允许插入操作`);
      } else {
        setError(errorMsg);
      }
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
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-2xl font-bold text-slate-800">管理员上传后台</h1>
              <p className="text-xs text-slate-400 mt-1">{header.desc}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            退出登录
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

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">{header.title}</h2>
            {successMsg && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl text-sm">
                <CheckCircle className="w-4 h-4" />
                {successMsg}
              </div>
            )}
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
                  value={
                    section === 'ai'
                      ? aiForm.description
                      : section === 'tools'
                        ? toolsForm.description
                        : teachingForm.description
                  }
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
                        自动压缩 WebP
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
              <>
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
                        自动压缩 WebP
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
              </>
            )}

            {section === 'teaching' && (
              <>
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
              </>
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
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
