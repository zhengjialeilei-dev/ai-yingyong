import React, { useState } from 'react';
import { Search, RotateCcw, LayoutGrid, Star, Share2, Filter, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import CustomWidget from '../components/CustomWidget';
import { useResources } from '../hooks/useResources';

const categories = [
  { id: 'all', label: '全部', count: 0 },
  { id: 'algebra', label: '数与代数', count: 0 },
  { id: 'geometry', label: '图形与几何', count: 0 },
  { id: 'statistics', label: '统计与概率', count: 0 },
  { id: 'practice', label: '综合实践', count: 0 },
  { id: 'micro', label: '微课', count: 0 },
  { id: 'exercises', label: '习题', count: 0 },
  { id: 'other', label: '其它', count: 0 }
];

const grades = [
  { id: '1', label: '一年级', count: 0 },
  { id: '2', label: '二年级', count: 0 },
  { id: '3', label: '三年级', count: 0 },
  { id: '4', label: '四年级', count: 0 },
  { id: '5', label: '五年级', count: 0 },
  { id: '6', label: '六年级', count: 0 },
];

const Home = () => {
  const { resources, loading } = useResources();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeGrade, setActiveGrade] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // 筛选出非“赋能教学”类的应用
  // interactiveApps: 有路径或文件的应用
  const interactiveApps = resources.filter(app => 
    app.category !== '赋能教学' && (app.route_path || app.file_path)
  );

  // mockResources (Bento Grid): 没有路径和文件的资源 (Concept Cards)
  const mockResources = resources.filter(app => 
    app.category !== '赋能教学' && !app.route_path && !app.file_path
  );

  // 动态计算每个分类的数量
  const categoriesWithCount = categories.map(cat => {
      let count = 0;
      if (cat.id === 'all') {
        count = interactiveApps.length + mockResources.length;
      } else {
        const appCount = interactiveApps.filter(app => app.category === cat.label).length;
        const resCount = mockResources.filter(res => res.category === cat.label).length;
        count = appCount + resCount;
      }
      return { ...cat, count };
    });

  // 真正的过滤逻辑 - AI Apps
  const displayApps = (() => {
    let filtered = interactiveApps;
    
    // 分类过滤
    if (activeCategory !== 'all') {
      const selectedCat = categories.find(c => c.id === activeCategory);
      if (selectedCat) {
        filtered = filtered.filter(app => app.category === selectedCat.label);
      }
    }

    // 年级过滤（如果选中了年级）
    if (activeGrade) {
      const selectedGrade = grades.find(g => g.id === activeGrade);
      if (selectedGrade) {
        filtered = filtered.filter(app => app.grade.includes(selectedGrade.label) || app.grade === '通用');
      }
    }

    return filtered;
  })();

  // 真正的过滤逻辑 - Bento Grid Resources
  const displayResources = (() => {
    let filtered = mockResources;
    
    // 分类过滤
    if (activeCategory !== 'all') {
      const selectedCat = categories.find(c => c.id === activeCategory);
      if (selectedCat) {
        filtered = filtered.filter(res => res.category === selectedCat.label);
      }
    }

    // 年级过滤（如果选中了年级）
    if (activeGrade) {
      const selectedGrade = grades.find(g => g.id === activeGrade);
      if (selectedGrade) {
        filtered = filtered.filter(res => res.grade.includes(selectedGrade.label) || res.grade === '通用');
      }
    }

    return filtered;
  })();

  return (
    <div className="p-8 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-primary rounded-full block"></span>
            课中互动
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium pl-5">探索精彩的数学教学资源库</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="搜索资源..." 
              className="pl-10 pr-4 py-3 bg-white rounded-xl border-none ring-1 ring-gray-100 w-64 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all duration-300 placeholder-gray-400 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          
          <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-500 hover:text-emerald-600 transition-all duration-300">
              <Filter className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-700 font-bold border border-emerald-100 shadow-sm">
              R
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section - Glassy & Floating */}
      <div className="space-y-6 mb-12">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                "px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ease-out border",
                activeCategory === cat.id 
                  ? "bg-gradient-primary text-white shadow-lg shadow-emerald-500/20 border-transparent scale-105" 
                  : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-emerald-100 hover:text-emerald-600 hover:shadow-sm"
              )}
            >
              {cat.label} 
              <span className={clsx(
                "ml-2 text-xs py-0.5 px-1.5 rounded-md",
                activeCategory === cat.id ? "bg-white/20" : "bg-gray-100 text-gray-400"
              )}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Grade:</span>
          {grades.map((grade) => (
            <button
              key={grade.id}
              onClick={() => setActiveGrade(grade.id)}
              className={clsx(
                "px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border",
                activeGrade === grade.id 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" 
                  : "bg-transparent border-transparent text-gray-500 hover:bg-white hover:border-gray-100 hover:shadow-sm"
              )}
            >
              {grade.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom HTML Widget Section */}
      {/* <CustomWidget /> */}

      {/* AI Apps Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-purple-500 rounded-full block"></span>
          AI 教学应用
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayApps.map((app) => (
            app.resource_type === 'react' ? (
              <Link
                key={app.id}
                to={app.route_path || '#'}
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image Area */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={app.image_url} 
                    alt={app.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-emerald-600 rounded-md shadow-sm uppercase tracking-wider border border-emerald-100">
                      {app.category}
                    </span>
                  </div>

                  {/* Grade Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-purple-600 rounded-md shadow-sm uppercase tracking-wider border border-purple-100">
                      {app.grade}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-gray-800 text-base group-hover:text-purple-600 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {app.description}
                  </p>
                </div>
              </Link>
            ) : (
              <a
                key={app.id}
                href={app.file_path && app.file_path.startsWith('http') ? app.file_path : `/ai-apps/${app.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image Area */}
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={app.image_url} 
                    alt={app.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-emerald-600 rounded-md shadow-sm uppercase tracking-wider border border-emerald-100">
                      {app.category}
                    </span>
                  </div>

                  {/* Grade Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-purple-600 rounded-md shadow-sm uppercase tracking-wider border border-purple-100">
                      {app.grade}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-gray-800 text-base group-hover:text-purple-600 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {app.description}
                  </p>
                </div>
              </a>
            )
          ))}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayResources.map((resource) => (
          resource.resource_type === 'react' ? (
            <Link 
              key={resource.id} 
              to={resource.route_path || '#'}
              className="group relative bg-white rounded-3xl p-3 shadow-soft hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 ease-out hover:-translate-y-2 border border-white/60 block"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img 
                  src={resource.image_url} 
                  alt={resource.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase rounded-lg text-emerald-700 shadow-sm">
                    {resource.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="px-2 pb-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-emerald-600 transition-colors">
                    {resource.title}
                  </h3>
                  <span className="shrink-0 px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-md border border-gray-100">
                    {resource.grade}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                  {resource.description}
                </p>
                
                {/* Action Area */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <div className="flex gap-2">
                     <button className="p-2 hover:bg-emerald-50 rounded-full text-gray-400 hover:text-emerald-600 transition-colors">
                      <Star className="w-4 h-4" />
                     </button>
                     <button className="p-2 hover:bg-blue-50 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                     </button>
                  </div>
                  <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-gray-200">
                    Preview
                  </button>
                </div>
              </div>
            </Link>
          ) : null
        ))}
      </div>
    </div>
  );
};

export default Home;
