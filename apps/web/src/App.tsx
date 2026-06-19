import { useEffect, useMemo, useReducer, useRef } from 'react';
import { useLenis } from 'lenis/react';
import './App.css';

import { AppShell } from './layout/AppShell';
import { getRouteMatch } from './routes/routeConfig';
import { usePrototypeRouter } from './routes/usePrototypeRouter';

const EXIT_MS = 110;

type RouteTransitionState = {
  displayedPath: string;
};

type RouteTransitionAction = {
  type: 'commit-route';
  path: string;
};

function routeTransitionReducer(
  state: RouteTransitionState,
  action: RouteTransitionAction,
): RouteTransitionState {
  if (action.type === 'commit-route') {
    return {
      ...state,
      displayedPath: action.path,
    };
  }

  return state;
}

function App() {
  const { pathname, navigate, pendingScrollY } = usePrototypeRouter();

  // displayedPath is the route actually rendered — lags behind pathname during exit
  const [{ displayedPath }, dispatchTransition] = useReducer(
    routeTransitionReducer,
    { displayedPath: pathname },
  );
  const phase = pathname === displayedPath ? 'enter' : 'exit';
  const scrollTarget = useRef(0);
  const lenis = useLenis();

  useEffect(() => {
    if (pathname === displayedPath) return;

    scrollTarget.current = pendingScrollY.current;

    const timer = setTimeout(() => {
      dispatchTransition({ type: 'commit-route', path: pathname });
    }, EXIT_MS);

    return () => clearTimeout(timer);
  }, [displayedPath, pathname, pendingScrollY]);

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
