import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { clsx } from 'clsx';

const PRESETS = [
  { label: '1分钟', value: 60 },
  { label: '3分钟', value: 180 },
  { label: '5分钟', value: 300 },
  { label: '10分钟', value: 600 },
];

const ClassroomTimer = () => {
  // 状态管理
  const [totalTime, setTotalTime] = useState(300); // 默认5分钟
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // 自定义输入状态
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');

  const timerRef = useRef<number | null>(null);

  // 格式化时间显示 (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 倒计时核心逻辑
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // 重置
  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(totalTime);
  };

  // 设定时间
  const handleSetTime = (seconds: number) => {
    setIsRunning(false);
    setIsFinished(false);
    setTotalTime(seconds);
    setTimeLeft(seconds);
  };

  // 处理自定义时间提交
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(customMinutes) || 0;
    const s = parseInt(customSeconds) || 0;
    const total = m * 60 + s;
    if (total > 0) {
      handleSetTime(total);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  // 计算圆环进度
  // 半径 r=120, 周长 = 2 * PI * r ≈ 754
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashOffset = circumference * (1 - progress);
  
  // 状态判定
  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const themeColor = isUrgent ? 'text-red-500' : isFinished ? 'text-emerald-500' : 'text-blue-500';
  const bgColor = isUrgent ? 'bg-red-50' : isFinished ? 'bg-emerald-50' : 'bg-blue-50';

  return (
    <div className={clsx("min-h-screen flex flex-col font-sans transition-colors duration-500", bgColor)}>
      {/* 顶部导航 */}
      <div className="p-4 lg:p-8 flex justify-between items-center z-10">
        <Link 
          to="/empower" 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-white/60"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          沉浸式课堂倒计时
        </div>
      </div>

      {/* 主舞台 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* 倒计时圆环展示 */}
        <div className="relative mb-12 group">
          {/* 背景光晕 */}
          <div className={clsx(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 transition-colors duration-500",
            isUrgent ? "bg-red-400 animate-pulse" : isFinished ? "bg-emerald-400" : "bg-blue-400"
          )}></div>

          {/* SVG 圆环 */}
          <div className="relative w-[320px] h-[320px] lg:w-[480px] lg:h-[480px]">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
              {/* 底层轨道圆 */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="white"
                strokeWidth="12"
                fill="none"
                className="opacity-50"
              />
              {/* 进度圆 */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="white" // 中间填充白色背景
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={clsx(
                  "transition-all duration-1000 ease-linear",
                  themeColor
                )}
              />
            </svg>

            {/* 中央数字 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isFinished ? (
                <div className="text-center animate-bounce">
                  <span className="text-6xl lg:text-8xl">⏰</span>
                  <p className="text-4xl lg:text-6xl font-black text-emerald-600 mt-4">时间到！</p>
                </div>
              ) : (
                <div className={clsx(
                  "font-mono font-black tabular-nums tracking-tighter transition-all duration-300",
                  isUrgent ? "text-8xl lg:text-[9rem] text-red-500 animate-pulse scale-110" : "text-7xl lg:text-[8rem] text-slate-700"
                )}>
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 控制区域 */}
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl z-10">
          
          {/* 主控制按钮 */}
          <div className="flex items-center gap-6">
            {!isRunning ? (
              <button
                onClick={() => {
                  if (timeLeft === 0) handleSetTime(totalTime);
                  setIsRunning(true);
                  setIsFinished(false);
                }}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 hover:scale-110 transition-all duration-300 hover:shadow-blue-500/40"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-400 hover:scale-110 transition-all duration-300 hover:shadow-amber-500/40"
              >
                <Pause className="w-8 h-8 fill-current" />
              </button>
            )}
            
            <button
              onClick={handleReset}
              className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white text-slate-400 shadow-md hover:text-slate-600 hover:bg-slate-50 transition-all duration-300 border border-slate-100"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* 快捷时间选择 */}
          <div className="flex flex-wrap justify-center gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleSetTime(preset.value)}
                className={clsx(
                  "px-6 py-3 rounded-xl font-bold transition-all duration-200 border-2",
                  totalTime === preset.value
                    ? "bg-white border-blue-500 text-blue-600 shadow-md transform -translate-y-1"
                    : "bg-white/60 border-transparent text-slate-500 hover:bg-white hover:border-slate-200"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 自定义时间输入 */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 bg-white/60 p-2 rounded-2xl border border-white/50 shadow-sm">
            <input
              type="number"
              placeholder="分"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-16 h-10 bg-white rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300"
              min="0"
              max="99"
            />
            <span className="font-bold text-slate-400">:</span>
            <input
              type="number"
              placeholder="秒"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.target.value)}
              className="w-16 h-10 bg-white rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300"
              min="0"
              max="59"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors"
            >
              设定
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ClassroomTimer;
