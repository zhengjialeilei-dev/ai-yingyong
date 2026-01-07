import { 
  Zap, 
  GraduationCap, 
  LayoutGrid,
  Hexagon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutGrid, label: '课中互动', path: '/' },
    { icon: Zap, label: '赋能教学', path: '/empower' },
    { icon: GraduationCap, label: '教学专区', path: '/teaching-zone' },
  ];

  return (
    <div className="w-72 h-[calc(100vh-2rem)] sticky top-4 flex flex-col bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-200/50 z-50 transition-all duration-300 ml-2">
      
      {/* Brand Section */}
      <div className="pt-10 pb-8 px-8 flex items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white transform group-hover:scale-105 transition-transform duration-300">
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
          return (
            <Link 
              key={index}
              to={item.path}
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
