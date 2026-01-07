import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown, RotateCcw, Plus, Minus, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

// 定义小组数据接口
interface Group {
  id: number;
  name: string;
  score: number;
  color: string;
  borderColor: string;
  textColor: string;
}

// 预设的莫兰迪/鲜艳配色方案，每个组固定颜色
const PRESET_COLORS = [
  { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-700' },
  { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-700' },
  { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-700' },
  { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-700' },
  { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700' },
  { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700' },
];

const GroupScoreboard = () => {
  // 初始化 6 个小组
  const [groups, setGroups] = useState<Group[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `第 ${i + 1} 组`,
      score: 0,
      color: PRESET_COLORS[i].bg,
      borderColor: PRESET_COLORS[i].border,
      textColor: PRESET_COLORS[i].text,
    }))
  );

  // 排序后的列表，用于显示
  const [sortedGroups, setSortedGroups] = useState<Group[]>([]);

  // 当分数变化时，自动排序
  useEffect(() => {
    // 复制一份并排序：分数降序，分数相同按 ID 升序
    const sorted = [...groups].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.id - b.id;
    });
    setSortedGroups(sorted);
  }, [groups]);

  // 修改分数
  const updateScore = (id: number, delta: number) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === id 
          ? { ...group, score: Math.max(0, group.score + delta) } 
          : group
      )
    );
  };

  // 重置所有分数
  const resetScores = () => {
    if (window.confirm('确定要清空所有小组的比分吗？')) {
      setGroups(prevGroups => 
        prevGroups.map(group => ({ ...group, score: 0 }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* 顶部导航 */}
      <div className="p-4 lg:p-6 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <Link 
          to="/empower" 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium px-4 py-2 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
          返回列表
        </Link>
        <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Trophy className="w-6 h-6 text-yellow-500" />
          小组龙虎榜
        </div>
        <button
          onClick={resetScores}
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          清空比分
        </button>
      </div>

      {/* 主舞台：积分板 */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {sortedGroups.map((group, index) => {
            const isFirst = index === 0 && group.score > 0;
            const rank = index + 1;
            
            return (
              <div 
                key={group.id}
                className={clsx(
                  "relative flex flex-col items-center p-6 rounded-3xl border-4 transition-all duration-500 ease-out shadow-sm hover:shadow-xl hover:-translate-y-1 bg-white",
                  group.borderColor
                )}
                // 注意：这里使用了 flip 动画的概念，但在纯 React 中通过 key 和排序后的渲染来实现位置交换
                // 如果引入了 framer-motion，可以用 layout prop 实现平滑移动
              >
                {/* 皇冠 (仅第一名且有分时显示) */}
                {isFirst && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <Crown className="w-16 h-16 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                  </div>
                )}

                {/* 排名角标 */}
                <div className={clsx(
                  "absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full font-black text-sm",
                  rank === 1 ? "bg-yellow-400 text-yellow-900" : 
                  rank === 2 ? "bg-slate-300 text-slate-700" :
                  rank === 3 ? "bg-orange-300 text-orange-800" : "bg-slate-100 text-slate-400"
                )}>
                  #{rank}
                </div>

                {/* 组名 */}
                <h3 className={clsx("text-xl font-bold mb-4", group.textColor)}>
                  {group.name}
                </h3>

                {/* 分数大字 */}
                <div className={clsx(
                  "flex-1 flex items-center justify-center font-black text-7xl lg:text-8xl mb-6 tracking-tighter tabular-nums",
                  group.textColor
                )}>
                  {group.score}
                </div>

                {/* 控制按钮组 */}
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => updateScore(group.id, -1)}
                    className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="减1分"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={() => updateScore(group.id, 1)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl font-black text-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1",
                      group.color,
                      group.textColor.replace('text-', 'hover:text-').replace('700', '900')
                    )}
                    title="加1分"
                  >
                    <Plus className="w-5 h-5" /> 1
                  </button>

                  <button
                    onClick={() => updateScore(group.id, 5)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl font-black text-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1 border-2 border-dashed",
                      group.borderColor,
                      group.textColor
                    )}
                    title="加5分"
                  >
                    <Plus className="w-5 h-5" /> 5
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupScoreboard;
