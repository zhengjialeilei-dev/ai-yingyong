import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2, AlertCircle, Database, FolderOpen, FileText } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}

const TestConnection = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (name: string, status: 'loading' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // 测试 1: 环境变量检查
    updateResult('env', 'loading', '检查环境变量配置...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      updateResult('env', 'error', '❌ 缺少环境变量', {
        url: supabaseUrl ? '已配置' : '未配置',
        key: supabaseKey ? '已配置' : '未配置'
      });
      setTesting(false);
      return;
    }
    updateResult('env', 'success', '✅ 环境变量已配置', {
      url: `${supabaseUrl.substring(0, 30)}...`,
      key: `${supabaseKey.substring(0, 20)}...`
    });

    // 测试 2: Resources 表
    updateResult('resources', 'loading', '测试 resources 表连接...');
    try {
      const { data, error, count } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      updateResult('resources', 'success', `✅ 连接成功！表存在，记录数: ${count || 0}`, {
        count: count || 0
      });
    } catch (err: any) {
      updateResult('resources', 'error', `❌ 连接失败: ${err.message}`, {
        error: err.message,
        code: err.code
      });
    }

    // 测试 3: Teaching Resources 表
    updateResult('teaching', 'loading', '测试 teaching_resources 表连接...');
    try {
      const { data, error, count } = await supabase
        .from('teaching_resources')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      updateResult('teaching', 'success', `✅ 连接成功！表存在，记录数: ${count || 0}`, {
        count: count || 0
      });
    } catch (err: any) {
      updateResult('teaching', 'error', `❌ 连接失败: ${err.message}`, {
        error: err.message,
        code: err.code
      });
    }

    // 测试 4: 存储桶
    updateResult('storage', 'loading', '测试存储桶连接...');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      const bucketList = buckets?.map(b => ({
        name: b.name,
        public: b.public,
        created: b.created_at
      })) || [];
      
      updateResult('storage', 'success', `✅ 连接成功！找到 ${bucketList.length} 个存储桶`, {
        buckets: bucketList
      });
    } catch (err: any) {
      updateResult('storage', 'error', `❌ 连接失败: ${err.message}`, {
        error: err.message,
        code: err.code
      });
    }

    // 测试 5: 读取实际数据
    updateResult('data', 'loading', '测试读取实际数据...');
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, category')
        .limit(3);
      
      if (error) throw error;
      updateResult('data', 'success', `✅ 成功读取 ${data?.length || 0} 条资源数据`, {
        samples: data || []
      });
    } catch (err: any) {
      updateResult('data', 'error', `❌ 读取失败: ${err.message}`, {
        error: err.message
      });
    }

    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getIcon = (status: string) => {
    if (status === 'loading') return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getBgColor = (status: string) => {
    if (status === 'loading') return 'bg-blue-50 border-blue-200';
    if (status === 'success') return 'bg-emerald-50 border-emerald-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">🔍 Supabase 连接测试</h1>
              <p className="text-slate-500">检查数据库和存储连接状态</p>
            </div>
            <button
              onClick={runTests}
              disabled={testing}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  测试中...
                </>
              ) : (
                '重新测试'
              )}
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 ${getBgColor(result.status)} transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{getIcon(result.status)}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      {result.name === 'env' && <AlertCircle className="w-4 h-4" />}
                      {result.name === 'resources' && <Database className="w-4 h-4" />}
                      {result.name === 'teaching' && <FileText className="w-4 h-4" />}
                      {result.name === 'storage' && <FolderOpen className="w-4 h-4" />}
                      {result.name === 'data' && <Database className="w-4 h-4" />}
                      {result.name === 'env' && '环境变量检查'}
                      {result.name === 'resources' && 'Resources 表连接'}
                      {result.name === 'teaching' && 'Teaching Resources 表连接'}
                      {result.name === 'storage' && '存储桶连接'}
                      {result.name === 'data' && '数据读取测试'}
                    </h3>
                    <p className="text-slate-700 mb-2">{result.message}</p>
                    {result.details && (
                      <div className="mt-3 p-3 bg-white/60 rounded-lg text-xs text-slate-600">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && !testing && (
            <div className="text-center py-12 text-slate-400">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>准备测试...</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2">💡 提示</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• 确保在 Vercel 项目设置中配置了 <code className="bg-white px-2 py-1 rounded">VITE_SUPABASE_URL</code> 和 <code className="bg-white px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
              <li>• 如果测试失败，请检查 Supabase 项目的 RLS（行级安全）策略是否允许匿名访问</li>
              <li>• 存储桶需要设置为公开或配置正确的访问策略</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;

