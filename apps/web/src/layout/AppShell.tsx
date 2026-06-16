import { useState, useEffect, type ReactNode } from 'react';

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

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const homeRoute = navigationRoutes.find((route) => route.id === 'home');
  const compactNavigationRoutes = navigationRoutes.filter(
    (route) => route.id !== 'home',
  );
  const compactLeftRoutes = compactNavigationRoutes.slice(0, 3);
  const compactRightRoutes = compactNavigationRoutes.slice(3);

  const openRoute = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const getIsActive = (path: string) =>
    path === '/' ? pathname === path : pathname.startsWith(path);

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
        className={buttonClasses}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => openRoute(route.path)}
      >
        {route.label}
      </button>
    );
  };

  return (
    <div className="app-shell">
      <header
        className={`app-shell__header${isScrolled ? ' is-scrolled' : ''}`}
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
          </nav>
        </div>
      </header>

      <main className="app-shell__main">{children}</main>
      <AppFooter navigate={openRoute} />
    </div>
  );
}
