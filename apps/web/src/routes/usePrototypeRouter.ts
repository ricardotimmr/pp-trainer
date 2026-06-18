import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRouteMatch } from './routeConfig';

const getCurrentPath = () => window.location.pathname;

type HistoryState = { scrollY?: number };

export function usePrototypeRouter() {
  const [pathname, setPathname] = useState(getCurrentPath);
  // pendingScrollY is consumed by App once per navigation
  const pendingScrollY = useRef(0);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Persist current position into the entry we're leaving before moving
      window.history.replaceState(
        { ...(window.history.state as HistoryState), scrollY: window.scrollY },
        '',
      );
      pendingScrollY.current =
        (event.state as HistoryState | null)?.scrollY ?? 0;
      setPathname(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname) return;

    // Save current position into the entry we're leaving
    window.history.replaceState(
      { ...(window.history.state as HistoryState), scrollY: window.scrollY },
      '',
    );
    window.history.pushState({ scrollY: 0 } satisfies HistoryState, '', path);
    pendingScrollY.current = 0;
    setPathname(getCurrentPath());
  }, []);

  const routeMatch = useMemo(() => getRouteMatch(pathname), [pathname]);

  return {
    pathname,
    routeMatch,
    navigate,
    pendingScrollY,
  };
}
