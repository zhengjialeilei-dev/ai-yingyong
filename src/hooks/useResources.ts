import { useCallback, useEffect, useState } from 'react';
import { supabase, Resource } from '../lib/supabase';

// 简单的全局缓存，避免 Home / Empowerment 等页面重复请求
let cachedResources: Resource[] | null = null;
let cacheTime = 0;
let inFlight: Promise<Resource[] | null> | null = null;
const CACHE_TTL_MS = 60_000; // 1分钟，够用且能保持数据相对新鲜

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async (force = false) => {
    setError(null);
    const now = Date.now();

    if (!force && cachedResources && now - cacheTime < CACHE_TTL_MS) {
      setResources(cachedResources);
      setLoading(false);
      return cachedResources;
    }

    setLoading(true);
    try {
      if (!force && inFlight) {
        const data = await inFlight;
        if (data) setResources(data);
        return data;
      }

      inFlight = (async () => {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        cachedResources = data || [];
        cacheTime = Date.now();
        return cachedResources;
      })();

      const data = await inFlight;
      if (data) setResources(data);
      return data;
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to fetch resources');
      return null;
    } finally {
      inFlight = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 先尝试走缓存/复用请求
    void fetchResources(false);
  }, [fetchResources]);

  const refresh = useCallback(() => fetchResources(true), [fetchResources]);

  return { resources, loading, error, refresh };
};
