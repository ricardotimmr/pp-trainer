import footerLogo from '../assets/big-p-pink.png';
import { navigationRoutes } from '../routes/routeConfig';

type AppFooterProps = {
  navigate: (path: string) => void;
};

const secondaryLinks = [
  { label: 'Import', path: '/import' },
  { label: 'Training Zones', path: '/settings' },
  { label: 'Design States', path: '/unknown-route' },
  { label: '404 Example', path: '/notfound' },
  { label: 'Home', path: '/' },
];

export function AppFooter({ navigate }: AppFooterProps) {
  return (
    <footer className="foot">
      <div className="foot__box">
        <div className="foot__cell">
          <div className="foot__logo">
            <img src={footerLogo} alt="Precision Pacers" />
            <svg
              viewBox="0 0 64 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <path d="M6 30h10l6-12 7 12h6" />
              <path d="M3 22h12" />
              <path d="M1 16h10" />
              <circle cx="14" cy="30" r="7" />
              <circle cx="50" cy="30" r="7" />
              <path d="M35 30l7-14h6" />
              <circle cx="42" cy="14" r="2.4" fill="currentColor" />
            </svg>
          </div>
          <div className="foot__motto">
            Plan sharp.
            <br />
            Pace precise.
            <br />
            Precision Pacers.
          </div>
        </div>

        <div className="foot__cell">
          <h5>App</h5>
          {navigationRoutes
            .filter((route) => route.id !== 'home')
            .map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => navigate(route.path)}
              >
                {route.label}
              </button>
            ))}
        </div>

        <div className="foot__cell">
          <h5>More</h5>
          {secondaryLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="foot__cell">
          <h5>Info</h5>
          <div className="foot__meta">
            Personal training hub for one athlete —
            source-agnostic.
          </div>
          <div className="foot__sub foot__meta">
            © 2026 Precision Pacers
            <br />
            Single-User Prototype
          </div>
          <div className="foot__sub foot__meta">
            Mock data · no backend
            <br />
            no real AI calls
          </div>
        </div>
      </div>
    </footer>
  );
}
