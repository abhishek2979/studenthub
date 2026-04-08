import { useState, useCallback } from 'react';

/**
 * Generic hook for API calls with loading / error state.
 * Usage:
 *   const { data, loading, error, execute } = useApi(studentAPI.getAll);
 *   useEffect(() => { execute({ cls: '10-A' }); }, []);
 */
export function useApi(apiFn, immediate = false, immediateArgs = undefined) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, execute, setData };
}

export default useApi;
