import React from 'react';
import { FileText, ClipboardList, Download } from 'lucide-react';

const TeachingZone = () => {
  const documents = [
    {
      title: '数学课程标准',
      description: '最新版小学数学课程标准文件',
      icon: FileText,
      path: '/files/数学课标.pdf',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: '课程实施方案',
      description: '本校数学课程落地实施详细方案',
      icon: ClipboardList,
      path: '/files/课标方案.pdf',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    }
  ];

  const handleCardClick = (path: string) => {
    window.open(path, '_blank');
  };

  return (
    <div className="p-8 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full block"></span>
            教学专区
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium pl-5">教学政策文件与实施方案</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(doc.path)}
            className="group cursor-pointer relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-6 flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${doc.bgColor} ${doc.color} border ${doc.borderColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <doc.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between group-hover:bg-blue-50/30 transition-colors">
              <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-500 transition-colors">PDF 文档</span>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachingZone;
