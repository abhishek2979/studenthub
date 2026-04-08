import { useState, useCallback } from 'react';

export function useNotification(duration = 3500) {
  const [notif, setNotif] = useState(null);

  const show = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), duration);
  }, [duration]);

  return { notif, show };
}
