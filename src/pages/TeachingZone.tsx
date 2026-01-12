import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, FileCheck, Presentation, ScrollText, Download, ExternalLink, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeachingResource {
  id: string;
  title: string;
  description: string;
  zone: string;
  file_url: string;
  file_type: string;
}

const ZONES = [
  { 
    id: 'standard', 
    label: '课标', 
    icon: ScrollText, 
    description: '课程标准与实施方案',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    hoverBg: 'hover:bg-blue-100'
  },
  { 
    id: 'textbook', 
    label: '课本', 
    icon: BookOpen, 
    description: '教材资源与电子课本',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-100'
  },
  { 
    id: 'plan', 
    label: '教案', 
    icon: FileCheck, 
    description: '优质教学设计与案例',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    hoverBg: 'hover:bg-amber-100'
  },
  { 
    id: 'courseware', 
    label: '课件', 
    icon: Presentation, 
    description: '精品教学课件资源',
    gradient: 'from-purple-500 to-fuchsia-600',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    hoverBg: 'hover:bg-purple-100'
  },
];

// 本地静态资源（课标区域的两个文档）
const LOCAL_RESOURCES: TeachingResource[] = [
  {
    id: 'local-1',
    title: '数学课程标准',
    description: '最新版小学数学课程标准文件',
    zone: 'standard',
    file_url: '/files/数学课标.pdf',
    file_type: 'pdf'
  },
  {
    id: 'local-2',
    title: '课程实施方案',
    description: '本校数学课程落地实施详细方案',
    zone: 'standard',
    file_url: '/files/课标方案.pdf',
    file_type: 'pdf'
  }
];

const TeachingZone = () => {
  const [activeZone, setActiveZone] = useState('standard');
  const [resources, setResources] = useState<TeachingResource[]>(LOCAL_RESOURCES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('teaching_resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setResources([...LOCAL_RESOURCES, ...data]);
        }
      } catch (err) {
        console.error('Failed to fetch teaching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const activeZoneInfo = ZONES.find(z => z.id === activeZone) || ZONES[0];
  const filteredResources = resources.filter(r => r.zone === activeZone);

  const handleOpenFile = (url: string) => {
    window.open(url, '_blank');
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'doc':
      case 'docx':
        return <FileCheck className="w-5 h-5" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="w-2 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full block"></span>
          教学专区
        </h1>
        <p className="text-gray-400 mt-2 text-sm font-medium pl-5">教学资料与资源中心</p>
      </div>

      {/* Zone Navigation - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {ZONES.map((zone) => {
          const isActive = activeZone === zone.id;
          const zoneResources = resources.filter(r => r.zone === zone.id);
          
          return (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={`relative p-6 rounded-3xl transition-all duration-500 text-left overflow-hidden group ${
                isActive 
                  ? 'shadow-2xl scale-[1.02]' 
                  : 'bg-white hover:shadow-xl hover:scale-[1.01] border border-slate-100'
              }`}
            >
              {/* Active gradient background */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${zone.gradient} opacity-100`} />
              )}
              
              {/* Decorative circles */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${
                isActive ? 'bg-white/10' : `${zone.lightBg}`
              } transition-all duration-300`} />
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${
                isActive ? 'bg-white/5' : `${zone.lightBg} opacity-50`
              } transition-all duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : `${zone.lightBg} ${zone.textColor}`
                }`}>
                  <zone.icon className="w-6 h-6" />
                </div>
                
                <h3 className={`text-xl font-bold mb-1 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-800'
                }`}>
                  {zone.label}
                </h3>
                
                <p className={`text-sm mb-3 transition-colors ${
                  isActive ? 'text-white/80' : 'text-slate-400'
                }`}>
                  {zone.description}
                </p>
                
                <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : `${zone.lightBg} ${zone.textColor}`
                }`}>
                  <FolderOpen className="w-3 h-3" />
                  {zoneResources.length} 份资料
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Zone Content */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Zone Header */}
        <div className={`p-6 bg-gradient-to-r ${activeZoneInfo.gradient}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <activeZoneInfo.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{activeZoneInfo.label}资源</h2>
              <p className="text-white/80 text-sm">{activeZoneInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-16 text-center">
              <div className={`w-20 h-20 ${activeZoneInfo.lightBg} rounded-3xl flex items-center justify-center mx-auto mb-4`}>
                <FolderOpen className={`w-10 h-10 ${activeZoneInfo.textColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无{activeZoneInfo.label}资料</h3>
              <p className="text-sm text-slate-400">点击侧边栏管理入口添加资料</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleOpenFile(resource.file_url)}
                  className={`group cursor-pointer p-5 rounded-2xl border-2 ${activeZoneInfo.borderColor} ${activeZoneInfo.hoverBg} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${activeZoneInfo.lightBg} ${activeZoneInfo.textColor} group-hover:scale-110 transition-transform duration-300`}>
                      {getFileIcon(resource.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 mb-1 group-hover:text-slate-900 truncate">
                        {resource.title}
                      </h4>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${activeZoneInfo.lightBg} ${activeZoneInfo.textColor} uppercase`}>
                          {resource.file_type}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {ZONES.map((zone) => {
          const count = resources.filter(r => r.zone === zone.id).length;
          return (
            <div 
              key={zone.id}
              className={`p-4 rounded-2xl ${zone.lightBg} border ${zone.borderColor}`}
            >
              <div className="flex items-center gap-3">
                <zone.icon className={`w-5 h-5 ${zone.textColor}`} />
                <div>
                  <p className={`text-2xl font-bold ${zone.textColor}`}>{count}</p>
                  <p className="text-xs text-slate-500">{zone.label}资料</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeachingZone;
