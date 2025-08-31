import { useState, useCallback, useRef, useEffect } from 'react';

const RAW_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// remove any trailing slashes so `${API_BASE}/api` is clean
const API_BASE = RAW_BASE.replace(/\/+$/, '');

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const activeHttpRequests = useRef([]);

  const sendRequest = useCallback(
    async (url, method = 'GET', body = null, headers = {}) => {
      setIsLoading(true);
      const httpAbortCtrl = new AbortController();
      activeHttpRequests.current.push(httpAbortCtrl);

      try {
        const fullUrl = `${API_BASE}${url}`;
        console.log('[HTTP]', fullUrl, method); // 👈 verify what you're calling

        const res = await fetch(fullUrl, {
          method,
          body,
          headers,
          signal: httpAbortCtrl.signal
        });

        const type = res.headers.get('content-type') || '';
        let data = null;

        if (res.status !== 204) {
          if (type.includes('application/json')) {
            data = await res.json();
          } else {
            const text = await res.text();
            try { data = JSON.parse(text); } catch { data = { message: text }; }
          }
        }

        activeHttpRequests.current = activeHttpRequests.current.filter(c => c !== httpAbortCtrl);

        if (!res.ok) {
          throw new Error((data && data.message) || `HTTP ${res.status}`);
        }

        setIsLoading(false);
        return data;
      } catch (err) {
        setError(err.message || 'Network error');
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  const clearError = () => setError(null);

  useEffect(() => {
    return () => activeHttpRequests.current.forEach(a => a.abort());
  }, []);

  return { isLoading, error, sendRequest, clearError };
};
