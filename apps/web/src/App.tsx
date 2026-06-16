import './App.css';

import { AppShell } from './layout/AppShell';
import { usePrototypeRouter } from './routes/usePrototypeRouter';

function App() {
  const { pathname, routeMatch, navigate } = usePrototypeRouter();
  const Page = routeMatch.route.component;

  return (
    <AppShell pathname={pathname} navigate={navigate}>
      <Page params={routeMatch.params} navigate={navigate} />
    </AppShell>
  );
}

export default App;
