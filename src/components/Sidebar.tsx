import { useState, useRef } from 'react';
import { 
  Zap, 
  GraduationCap, 
  LayoutGrid,
  Hexagon,
  Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 每个导航项的点击计数器
  const clickCountsRef = useRef<{ [key: string]: number }>({});
  const clickTimersRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> | null }>({});
  const [showHint, setShowHint] = useState<string | null>(null);

  const menuItems = [
    { icon: Sparkles, label: 'AI赋能', path: '/', adminPath: '/admin/ai' },
    { icon: Zap, label: '互动工具', path: '/empower', adminPath: '/admin/tools' },
    { icon: GraduationCap, label: '教学专区', path: '/teaching-zone', adminPath: '/admin/teaching' },
  ];

  // 处理导航项点击
  const handleNavClick = (e: React.MouseEvent, item: typeof menuItems[0]) => {
    const key = item.path;
    
    // 初始化计数器
    if (!clickCountsRef.current[key]) {
      clickCountsRef.current[key] = 0;
    }
    
    clickCountsRef.current[key] += 1;
    
    // 清除之前的定时器
    if (clickTimersRef.current[key]) {
      clearTimeout(clickTimersRef.current[key]!);
    }
    
    // 显示点击提示（第2次点击时）
    if (clickCountsRef.current[key] === 2) {
      setShowHint(key);
      setTimeout(() => setShowHint(null), 800);
    }
    
    // 达到 3 次点击，进入管理员页面
    if (clickCountsRef.current[key] >= 3) {
      e.preventDefault();
      clickCountsRef.current[key] = 0;
      navigate(item.adminPath);
      return;
    }
    
    // 2 秒内没有继续点击则重置计数
    clickTimersRef.current[key] = setTimeout(() => {
      clickCountsRef.current[key] = 0;
    }, 2000);
  };

  // Logo 点击 - 进入通用管理入口
  const handleLogoClick = () => {
    navigate('/admin/upload');
  };

  return (
    <div className="w-72 h-[calc(100vh-2rem)] sticky top-4 flex flex-col bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-200/50 z-50 transition-all duration-300 ml-2">
      
      {/* Brand Section */}
      <div className="pt-10 pb-8 px-8 flex items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
          <div 
            onClick={handleLogoClick}
            className="relative w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white transform group-hover:scale-105 transition-transform duration-300 cursor-pointer select-none"
          >
            <Hexagon className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-sans font-bold text-slate-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
            MathFlow
          </h1>
          <span className="text-xs font-medium text-slate-400 tracking-[0.2em] mt-1.5 ml-0.5">
            数智流
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-3">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isHinting = showHint === item.path;
          return (
            <Link 
              key={index}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={clsx(
                "group relative flex items-center px-5 py-4 rounded-2xl transition-all duration-500 ease-out overflow-hidden",
                isActive 
                  ? "shadow-lg shadow-emerald-500/20" 
                  : "hover:bg-emerald-50/60"
              )}
            >
              {/* Active Background Gradient */}
              <div className={clsx(
                "absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 transition-opacity duration-500",
                isActive ? "opacity-100" : "opacity-0"
              )} />

              <div className="relative flex items-center gap-4 z-10">
                <item.icon className={clsx(
                  "w-5 h-5 transition-all duration-300", 
                  isActive 
                    ? "text-white scale-110" 
                    : "text-slate-500 group-hover:text-emerald-600 group-hover:scale-110"
                )} />
                <span className={clsx(
                  "text-[15px] tracking-wide transition-colors duration-300",
                  isActive 
                    ? "font-bold text-white" 
                    : "font-medium text-slate-600 group-hover:text-emerald-700"
                )}>
                  {item.label}
                </span>
              </div>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
              )}
              
              {/* 隐藏管理入口提示 */}
              {isHinting && (
                <div className="absolute right-4 w-3 h-3 bg-amber-400 rounded-full animate-ping z-20" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 pb-8">
        <div className="px-4 py-3 rounded-2xl border border-slate-100/50 bg-gradient-to-br from-white/50 to-transparent">
          <p className="text-[10px] text-slate-300 text-center font-medium tracking-widest uppercase">
            © 2024 MathFlow
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
