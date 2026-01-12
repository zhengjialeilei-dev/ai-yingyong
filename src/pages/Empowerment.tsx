import React from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResources } from '../hooks/useResources';

const Empowerment = () => {
  const { resources, loading } = useResources();
  // 显示"赋能教学"类的工具
  const filteredApps = resources.filter(app => 
    app.category === '赋能教学' && (app.route_path || app.file_path)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <span className="w-2 h-6 sm:h-8 bg-gradient-primary rounded-full block"></span>
            互动工具
          </h1>
          <p className="text-gray-400 mt-2 text-xs sm:text-sm font-medium pl-5">让课堂更有趣的教学辅助工具</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm w-full">
          <div className="relative group flex-1">
            <input 
              type="text" 
              placeholder="搜索工具..." 
              className="pl-10 pr-4 py-2.5 sm:py-3 bg-white rounded-xl border-none ring-1 ring-gray-100 w-full focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all duration-300 placeholder-gray-400 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          
          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-500 hover:text-emerald-600 transition-all duration-300 flex-shrink-0">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {filteredApps.map((app) => (
          <Link
            key={app.id}
            to={
              app.resource_type === 'html'
                ? `/view?url=${encodeURIComponent(
                    app.file_path && app.file_path.startsWith('http')
                      ? app.file_path
                      : `/ai-apps/${app.file_path}`
                  )}&title=${encodeURIComponent(app.title)}`
                : (app.route_path || '#')
            }
            className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Image Area */}
            <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
              <img 
                src={app.image_url} 
                alt={app.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Category Badge */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md text-[8px] sm:text-[10px] font-bold text-emerald-600 rounded sm:rounded-md shadow-sm uppercase tracking-wider border border-emerald-100">
                  {app.category}
                </span>
              </div>

              {/* Grade Badge */}
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md text-[8px] sm:text-[10px] font-bold text-purple-600 rounded sm:rounded-md shadow-sm uppercase tracking-wider border border-purple-100">
                  {app.grade}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col gap-0.5 sm:gap-1">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-emerald-600 transition-colors line-clamp-1">
                {app.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 hidden sm:block">
                {app.description}
              </p>
            </div>
          </Link>
        ))}
        {filteredApps.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            暂无互动工具，敬请期待...
          </div>
        )}
      </div>
    </div>
  );
};

export default Empowerment;
