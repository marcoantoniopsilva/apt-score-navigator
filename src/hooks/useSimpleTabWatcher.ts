import { useEffect } from 'react';

export const useSimpleTabWatcher = () => {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        console.log('👉 Aba voltou a ficar visível');
      }
    };

    const onFocus = () => {
      console.log('👉 Janela ganhou foco');
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    console.log('✅ useSimpleTabWatcher ativado');

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
};