import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';

import { AppFooter } from './AppFooter';
import { navigationRoutes } from '../routes/routeConfig';
import navLogo from '../assets/big-p-pink.png';

type AppShellProps = {
  pathname: string;
  navigate: (path: string) => void;
  children: ReactNode;
};

export function AppShell({ pathname, navigate, children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState({
    isVisible: false,
    width: 0,
    x: 0,
  });
  const navRef = useRef<HTMLElement | null>(null);
  const navButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastScrollPosition = useRef(0);
  const lastHeaderTogglePosition = useRef(0);
  const compactStartPosition = useRef(0);
  const wasPastCompactThreshold = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollPosition = window.scrollY;
      const scrollDifference =
        currentScrollPosition - lastScrollPosition.current;
      const isPastCompactThreshold = currentScrollPosition > 64;
      const isPastInitialHideDistance =
        currentScrollPosition - compactStartPosition.current > 500;

      if (isPastCompactThreshold && !wasPastCompactThreshold.current) {
        compactStartPosition.current = currentScrollPosition;
        lastHeaderTogglePosition.current = currentScrollPosition;
      }

      setIsScrolled(isPastCompactThreshold);

      if (!isPastCompactThreshold || isMenuOpen) {
        setIsHeaderHidden(false);
        lastHeaderTogglePosition.current = currentScrollPosition;
      } else if (
        isPastInitialHideDistance &&
        scrollDifference > 0 &&
        currentScrollPosition - lastHeaderTogglePosition.current > 42
      ) {
        setIsHeaderHidden(true);
        lastHeaderTogglePosition.current = currentScrollPosition;
      } else if (
        scrollDifference < 0 &&
        lastHeaderTogglePosition.current - currentScrollPosition > 24
      ) {
        setIsHeaderHidden(false);
        lastHeaderTogglePosition.current = currentScrollPosition;
      }

      wasPastCompactThreshold.current = isPastCompactThreshold;
      lastScrollPosition.current = Math.max(currentScrollPosition, 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMenuOpen]);

  const homeRoute = navigationRoutes.find((route) => route.id === 'home');
  const compactNavigationRoutes = navigationRoutes.filter(
    (route) => route.id !== 'home',
  );
  const compactLeftRoutes = compactNavigationRoutes.slice(0, 3);
  const compactRightRoutes = compactNavigationRoutes.slice(3);

  const openRoute = (path: string) => {
    setIsMenuOpen(false);
    setIsHeaderHidden(false);
    navigate(path);
  };

  const getIsActive = (path: string) =>
    path === '/' ? pathname === path : pathname.startsWith(path);

  const activeRoute = navigationRoutes.find((route) => getIsActive(route.path));
  const activeRouteId = activeRoute?.id;

  useLayoutEffect(() => {
    let isMounted = true;

    const updateActiveIndicator = () => {
      const nav = navRef.current;
      const activeButton = activeRouteId
        ? navButtonRefs.current.get(activeRouteId)
        : undefined;

      if (!nav || !activeButton || activeButton.offsetParent === null) {
        if (isMounted) {
          setActiveIndicator({ isVisible: false, width: 0, x: 0 });
        }
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const indicatorX = buttonRect.left - navRect.left + 16;
      const indicatorWidth = Math.max(buttonRect.width - 32, 0);

      if (isMounted) {
        setActiveIndicator({
          isVisible: indicatorWidth > 0,
          width: indicatorWidth,
          x: indicatorX,
        });
      }
    };

    updateActiveIndicator();
    const animationFrame = window.requestAnimationFrame(updateActiveIndicator);
    const transitionTimers = [
      window.setTimeout(updateActiveIndicator, 180),
      window.setTimeout(updateActiveIndicator, 420),
      window.setTimeout(updateActiveIndicator, 620),
    ];

    window.addEventListener('resize', updateActiveIndicator);

    if ('fonts' in document) {
      void document.fonts.ready.then(updateActiveIndicator);
    }

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrame);
      transitionTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', updateActiveIndicator);
    };
  }, [activeRouteId, isMenuOpen, isScrolled]);

  const activeIndicatorStyle = {
    transform: `translateX(${activeIndicator.x}px)`,
    width: `${activeIndicator.width}px`,
  };

  const renderNavButton = (route: (typeof navigationRoutes)[number]) => {
    const isActive = getIsActive(route.path);
    const buttonClasses = [
      'app-shell__nav-button',
      route.id === 'home' ? 'app-shell__nav-button--home' : '',
      isActive ? 'is-active' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={route.id}
        type="button"
        ref={(element) => {
          if (element) {
            navButtonRefs.current.set(route.id, element);
          } else {
            navButtonRefs.current.delete(route.id);
          }
        }}
        className={buttonClasses}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => openRoute(route.path)}
      >
        <span className="app-shell__nav-label" data-label={route.label}>
          {route.label}
        </span>
      </button>
    );
  };

  return (
    <div className="app-shell">
      <header
        className={[
          'app-shell__header',
          isScrolled ? 'is-scrolled' : '',
          isHeaderHidden ? 'is-hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="app-shell__header-inner">
          <button
            type="button"
            className="app-shell__brand app-shell__brand--default"
            onClick={() => openRoute('/')}
            aria-label="Precision Pacers — Home"
          >
            <img src={navLogo} alt="Precision Pacers" />
          </button>

          <button
            type="button"
            className="app-shell__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label="Menu"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span className="app-shell__menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <nav
            ref={navRef}
            id="primary-navigation"
            className={
              isMenuOpen
                ? 'app-shell__nav app-shell__nav--open'
                : 'app-shell__nav'
            }
            aria-label="Prototype screens"
          >
            {homeRoute ? renderNavButton(homeRoute) : null}
            <span className="app-shell__nav-group">
              {compactLeftRoutes.map(renderNavButton)}
            </span>
            <button
              type="button"
              className="app-shell__compact-brand"
              onClick={() => openRoute('/')}
              aria-label="Precision Pacers — Home"
              tabIndex={isScrolled ? undefined : -1}
              aria-hidden={isScrolled ? undefined : true}
            >
              <img src={navLogo} alt="" />
            </button>
            <span className="app-shell__nav-group">
              {compactRightRoutes.map(renderNavButton)}
            </span>
            <span
              className={`app-shell__active-indicator${
                activeIndicator.isVisible ? ' is-visible' : ''
              }`}
              style={activeIndicatorStyle}
              aria-hidden="true"
            />
          </nav>
        </div>
      </header>

      <main className="app-shell__main">{children}</main>
      <AppFooter navigate={openRoute} />
    </div>
  );
}
