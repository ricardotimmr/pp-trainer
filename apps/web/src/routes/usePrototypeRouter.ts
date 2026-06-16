import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRouteMatch } from './routeConfig';

const getCurrentPath = () => window.location.pathname;

export function usePrototypeRouter() {
  const [pathname, setPathname] = useState(getCurrentPath);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname) {
      return;
    }

    window.history.pushState({}, '', path);
    setPathname(getCurrentPath());
  }, []);

  const routeMatch = useMemo(() => getRouteMatch(pathname), [pathname]);

  return {
    pathname,
    routeMatch,
    navigate,
  };
}
