import React from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResources } from '../hooks/useResources';

const Empowerment = () => {
  const { resources, loading } = useResources();
  const filteredApps = resources.filter(app => app.category === '赋能教学');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full block"></span>
            赋能教学
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium pl-5">让课堂更有趣的教学辅助工具</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="搜索工具..." 
              className="pl-10 pr-4 py-3 bg-white rounded-xl border-none ring-1 ring-gray-100 w-64 focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all duration-300 placeholder-gray-400 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          
          <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-500 hover:text-orange-600 transition-all duration-300">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredApps.map((app) => (
          <Link
            key={app.id}
            to={app.route_path || '#'}
            className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300"
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
                <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-orange-600 rounded-md shadow-sm uppercase tracking-wider border border-orange-100">
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
              <h3 className="font-bold text-gray-800 text-base group-hover:text-orange-600 transition-colors">
                {app.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">
                {app.description}
              </p>
            </div>
          </Link>
        ))}
        {filteredApps.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            暂无赋能教学工具，敬请期待...
          </div>
        )}
      </div>
    </div>
  );
};

export default Empowerment;
