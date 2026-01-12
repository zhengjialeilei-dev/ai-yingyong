import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Search, Filter, Loader2, X, Clock, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { useResources } from '../hooks/useResources';
import {
  matchSearch,
  highlightMatch,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
} from '../lib/pinyinSearch';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'algebra', label: '数与代数' },
  { id: 'geometry', label: '图形与几何' },
  { id: 'statistics', label: '统计与概率' },
  { id: 'practice', label: '综合实践' },
  { id: 'micro', label: '微课' },
  { id: 'exercises', label: '习题' },
  { id: 'other', label: '其它' }
];

const grades = [
  { id: '1', label: '一年级' },
  { id: '2', label: '二年级' },
  { id: '3', label: '三年级' },
  { id: '4', label: '四年级' },
  { id: '5', label: '五年级' },
  { id: '6', label: '六年级' },
];

// 高亮组件
const HighlightText: React.FC<{ text: string; query: string; className?: string }> = ({
  text,
  query,
  className = '',
}) => {
  const parts = highlightMatch(text, query);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlighted ? (
          <mark key={i} className="bg-orange-200 text-orange-800 rounded px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
};

const Home = () => {
  const { resources, loading } = useResources();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从 URL 读取初始状态
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get('cat') || 'all'
  );
  const [activeGrade, setActiveGrade] = useState(
    searchParams.get('grade') || ''
  );
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  // 搜索历史
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // 同步 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('cat', activeCategory);
    if (activeGrade) params.set('grade', activeGrade);
    if (debouncedSearch) params.set('q', debouncedSearch);
    
    setSearchParams(params, { replace: true });
  }, [activeCategory, activeGrade, debouncedSearch, setSearchParams]);

  // 搜索去抖
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      // 保存到搜索历史
      if (search.trim()) {
        addSearchHistory(search.trim());
        setSearchHistory(getSearchHistory());
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // 加载搜索历史
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // 点击外部关闭历史
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 筛选出非"赋能教学"类的应用 - 必须在条件返回之前
  const interactiveApps = useMemo(
    () =>
      resources.filter(
        (app) => app.category !== '赋能教学' && (app.route_path || app.file_path)
      ),
    [resources]
  );

  // 过滤显示的应用 - 必须在条件返回之前
  const displayApps = useMemo(() => {
    let filtered = interactiveApps;

    // 分类过滤
    if (activeCategory !== 'all') {
      const selectedCat = categories.find((c) => c.id === activeCategory);
      if (selectedCat) {
        filtered = filtered.filter((app) => app.category === selectedCat.label);
      }
    }

    // 年级过滤
    if (activeGrade) {
      const selectedGrade = grades.find((g) => g.id === activeGrade);
      if (selectedGrade) {
        filtered = filtered.filter(
          (app) => app.grade.includes(selectedGrade.label) || app.grade === '通用'
        );
      }
    }

    // 搜索过滤（拼音首字母 + 模糊匹配）
    if (debouncedSearch) {
      filtered = filtered
        .map((app) => {
          const titleMatch = matchSearch(app.title, debouncedSearch);
          const descMatch = matchSearch(app.description, debouncedSearch);
          const score = Math.max(titleMatch.score, descMatch.score);
          return { app, matched: titleMatch.matched || descMatch.matched, score };
        })
        .filter((item) => item.matched)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.app);
    }

    return filtered;
  }, [interactiveApps, activeCategory, activeGrade, debouncedSearch]);

  const handleHistoryClick = (query: string) => {
    setSearch(query);
    setShowHistory(false);
    searchInputRef.current?.focus();
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeSearchHistoryItem(query);
    setSearchHistory(getSearchHistory());
  };

  const handleClearSearch = () => {
    setSearch('');
    searchInputRef.current?.focus();
  };

  // Loading 状态 - 必须在所有 hooks 之后
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
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
            AI赋能
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium pl-5">探索精彩的数学教学资源库</p>
        </div>
        
        {/* 搜索框 */}
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 shadow-sm">
          <div className="relative group">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="搜索资源（支持拼音首字母）..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowHistory(true)}
              className="pl-10 pr-10 py-3 bg-white rounded-xl border-none ring-1 ring-gray-100 w-72 focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all duration-300 placeholder-gray-400 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            
            {/* 搜索历史下拉 */}
            {showHistory && searchHistory.length > 0 && !search && (
              <div
                ref={historyRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    最近搜索
                  </span>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    清除
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {searchHistory.map((query, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(query)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 cursor-pointer group/item transition-colors"
                    >
                      <span className="text-sm text-gray-600">{query}</span>
                      <button
                        onClick={(e) => handleRemoveHistoryItem(e, query)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-orange-100 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-gray-500 hover:text-orange-600 transition-all duration-300">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 搜索结果提示 */}
      {debouncedSearch && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="text-gray-500">
            搜索 "<span className="text-orange-600 font-medium">{debouncedSearch}</span>" 找到{' '}
            <span className="font-bold text-gray-700">{displayApps.length}</span> 个结果
          </span>
          <button
            onClick={handleClearSearch}
            className="text-orange-500 hover:text-orange-600 hover:underline ml-2"
          >
            清除搜索
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="space-y-6 mb-12">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                "px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ease-out border",
                activeCategory === cat.id 
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 border-transparent scale-105" 
                  : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-orange-100 hover:text-orange-600 hover:shadow-sm"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">年级:</span>
          {grades.map((grade) => (
            <button
              key={grade.id}
              onClick={() => setActiveGrade(activeGrade === grade.id ? '' : grade.id)}
              className={clsx(
                "px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border",
                activeGrade === grade.id 
                  ? "bg-orange-50 text-orange-700 border-orange-200 shadow-sm" 
                  : "bg-transparent border-transparent text-gray-500 hover:bg-white hover:border-gray-100 hover:shadow-sm"
              )}
            >
              {grade.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Apps Grid */}
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
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={app.image_url} 
                    alt={app.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-orange-600 rounded-md shadow-sm uppercase tracking-wider border border-orange-100">
                      {app.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-purple-600 rounded-md shadow-sm uppercase tracking-wider border border-purple-100">
                      {app.grade}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-gray-800 text-base group-hover:text-orange-600 transition-colors">
                    {debouncedSearch ? (
                      <HighlightText text={app.title} query={debouncedSearch} />
                    ) : (
                      app.title
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {debouncedSearch ? (
                      <HighlightText text={app.description} query={debouncedSearch} />
                    ) : (
                      app.description
                    )}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                key={app.id}
                to={`/view?url=${encodeURIComponent(app.file_path && app.file_path.startsWith('http') ? app.file_path : `/ai-apps/${app.file_path}`)}&title=${encodeURIComponent(app.title)}`}
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={app.image_url} 
                    alt={app.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-orange-600 rounded-md shadow-sm uppercase tracking-wider border border-orange-100">
                      {app.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-purple-600 rounded-md shadow-sm uppercase tracking-wider border border-purple-100">
                      {app.grade}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-gray-800 text-base group-hover:text-orange-600 transition-colors">
                    {debouncedSearch ? (
                      <HighlightText text={app.title} query={debouncedSearch} />
                    ) : (
                      app.title
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {debouncedSearch ? (
                      <HighlightText text={app.description} query={debouncedSearch} />
                    ) : (
                      app.description
                    )}
                  </p>
                </div>
              </Link>
            )
          ))}
          {displayApps.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              {debouncedSearch ? (
                <div>
                  <p className="mb-2">未找到与 "{debouncedSearch}" 相关的资源</p>
                  <p className="text-sm">试试其他关键词，或使用拼音首字母搜索</p>
                </div>
              ) : (
                '暂无资源，敬请期待...'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
