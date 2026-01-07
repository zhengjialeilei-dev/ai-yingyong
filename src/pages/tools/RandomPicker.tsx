import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, X, Play, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

const DEFAULT_NAMES = [
  '张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十',
  '陈一', '林二', '黄三', '周四', '吴五', '郑六', '王七', '冯八',
  '陈九', '褚十', '卫一', '蒋二', '沈三', '韩四', '杨五', '朱六',
  '秦七', '尤八', '许九', '何十', '吕一', '施二'
];

const RandomPicker = () => {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [currentName, setCurrentName] = useState<string>('准备就绪');
  const [isRolling, setIsRolling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputNames, setInputNames] = useState(DEFAULT_NAMES.join('，'));
  const [winner, setWinner] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef<number>(50);

  // 处理名字输入
  const handleNamesUpdate = () => {
    // 支持中英文逗号，换行符分隔
    const newNames = inputNames
      .split(/[,\n，]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    if (newNames.length > 0) {
      setNames(newNames);
      setShowSettings(false);
      setCurrentName('准备就绪');
      setWinner(null);
    }
  };

  const startRoll = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setWinner(null);
    speedRef.current = 50; // 初始速度（毫秒）
    
    let duration = 0;
    const totalDuration = 2000; // 快速滚动时间
    const slowDownDuration = 1000; // 减速时间
    
    const roll = () => {
      const randomIndex = Math.floor(Math.random() * names.length);
      setCurrentName(names[randomIndex]);
      
      duration += speedRef.current;
      
      // 阶段1: 快速滚动
      if (duration < totalDuration) {
        timerRef.current = window.setTimeout(roll, speedRef.current);
      } 
      // 阶段2: 减速
      else if (duration < totalDuration + slowDownDuration) {
        speedRef.current *= 1.1; // 每次变慢 10%
        timerRef.current = window.setTimeout(roll, speedRef.current);
      } 
      // 阶段3: 停止
      else {
        setIsRolling(false);
        setWinner(names[randomIndex]);
        // 播放成功音效逻辑可以在这里加
      }
    };

    roll();
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 font-sans flex flex-col">
      {/* 顶部导航 */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
        
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
        >
          <Settings className="w-4 h-4" />
          名单设置
        </button>
      </div>

      {/* 主舞台 */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* 光效背景 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-300 rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none"></div>

        {/* 名字显示卡片 */}
        <div className={clsx(
          "relative z-10 bg-white rounded-[3rem] p-12 shadow-2xl transition-all duration-500 flex flex-col items-center justify-center min-w-[320px] min-h-[320px] lg:min-w-[480px] lg:min-h-[400px] border-8",
          winner ? "border-yellow-400 scale-110 shadow-yellow-500/50" : "border-white scale-100"
        )}>
          {winner && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-black text-lg shadow-lg animate-bounce whitespace-nowrap">
              🎉 幸运儿诞生！
            </div>
          )}
          
          <h1 className={clsx(
            "font-black text-center transition-all duration-100",
            winner ? "text-7xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600" : "text-6xl lg:text-8xl text-slate-800"
          )}>
            {currentName}
          </h1>
          
          <p className="mt-8 text-slate-400 font-medium">
            {isRolling ? '正在抽取中...' : winner ? '恭喜这位同学！' : '准备好开始了吗？'}
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="mt-12 z-10">
          <button
            onClick={startRoll}
            disabled={isRolling}
            className={clsx(
              "group relative px-12 py-6 rounded-2xl font-black text-2xl lg:text-3xl shadow-xl transition-all duration-200 active:scale-95 flex items-center gap-4",
              isRolling 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 hover:to-yellow-400 hover:shadow-yellow-500/40 hover:-translate-y-1"
            )}
          >
            {isRolling ? (
              <>
                <RotateCcw className="w-8 h-8 animate-spin" />
                抽取中...
              </>
            ) : (
              <>
                <Play className="w-8 h-8 fill-current" />
                {winner ? '再抽一次' : '开始点名'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">设置名单</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-500 mb-2">
                输入姓名（用逗号分隔）
              </label>
              <textarea
                value={inputNames}
                onChange={(e) => setInputNames(e.target.value)}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-slate-700 leading-relaxed"
                placeholder="例如：张三，李四，王五..."
              />
              <div className="mt-2 text-right text-sm text-slate-400">
                当前共有 {inputNames.split(/[,\n，]/).filter(n => n.trim().length > 0).length} 人
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setInputNames(DEFAULT_NAMES.join('，'));
                }}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                恢复默认
              </button>
              <button
                onClick={handleNamesUpdate}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30"
              >
                保存并生效
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomPicker;
