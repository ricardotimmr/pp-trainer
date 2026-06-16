import './App.css';
import { navigationRoutes } from './routes/routeConfig';
import { usePrototypeRouter } from './routes/usePrototypeRouter';

function App() {
  const { pathname, routeMatch, navigate } = usePrototypeRouter();
  const Page = routeMatch.route.component;

  return (
    <div className="prototype-shell">
      <header className="prototype-shell__header">
        <div>
          <p className="prototype-shell__label">pp-trainer</p>
          <p className="prototype-shell__phase">Phase 2 frontend prototype</p>
        </div>
        <nav className="prototype-shell__nav" aria-label="Prototype screens">
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
                onClick={() => navigate(route.path)}
              >
                {route.label}
              </button>
            );
          })}
        </nav>
      </header>
      <main>
        <Page params={routeMatch.params} navigate={navigate} />
      </main>
    </div>
  );
}

export default App;
