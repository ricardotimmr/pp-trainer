import { useState, type ReactNode } from 'react';

import { AppFooter } from './AppFooter';
import { navigationRoutes } from '../routes/routeConfig';

type AppShellProps = {
  pathname: string;
  navigate: (path: string) => void;
  children: ReactNode;
};

export function AppShell({ pathname, navigate, children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openRoute = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <button
            type="button"
            className="app-shell__brand"
            onClick={() => openRoute('/')}
          >
            <span className="app-shell__brand-mark">PP</span>
            <span>
              <span className="app-shell__brand-name">pp-trainer</span>
              <span className="app-shell__brand-subtitle">
                Phase 2 prototype
              </span>
            </span>
          </button>

          <button
            type="button"
            className="app-shell__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span className="app-shell__menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="app-shell__menu-label">Menu</span>
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
            {navigationRoutes.map((route) => {
              const isActive =
                route.path === '/'
                  ? pathname === route.path
                  : pathname.startsWith(route.path);

              return (
                <button
                  key={route.id}
                  type="button"
                  className={isActive ? 'is-active' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => openRoute(route.path)}
                >
                  {route.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="app-shell__main">{children}</main>
      <AppFooter navigate={openRoute} />
    </div>
  );
}
