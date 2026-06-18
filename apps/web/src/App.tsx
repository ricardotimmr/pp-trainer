import { useEffect, useMemo, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import './App.css';

import { AppShell } from './layout/AppShell';
import { getRouteMatch } from './routes/routeConfig';
import { usePrototypeRouter } from './routes/usePrototypeRouter';

const EXIT_MS = 110;

function App() {
  const { pathname, navigate, pendingScrollY } = usePrototypeRouter();

  // displayedPath is the route actually rendered — lags behind pathname during exit
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  const scrollTarget = useRef(0);
  const lenis = useLenis();

  useEffect(() => {
    if (pathname === displayedPath) return;

    scrollTarget.current = pendingScrollY.current;
    setPhase('exit');

    const timer = setTimeout(() => {
      setDisplayedPath(pathname);
      setPhase('enter');
    }, EXIT_MS);

    return () => clearTimeout(timer);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll after the page has swapped in
  useEffect(() => {
    if (!lenis) return;
    lenis.scrollTo(scrollTarget.current, { immediate: true });
  }, [displayedPath, lenis]);

  const displayedMatch = useMemo(
    () => getRouteMatch(displayedPath),
    [displayedPath],
  );
  const Page = displayedMatch.route.component;

  return (
    <AppShell pathname={pathname} navigate={navigate}>
      <div
        key={displayedPath}
        className={`page-transition page-transition--${phase}`}
      >
        <Page params={displayedMatch.params} navigate={navigate} />
      </div>
    </AppShell>
  );
}

export default App;
