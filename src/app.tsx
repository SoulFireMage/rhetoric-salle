import { APP_TITLE } from './config';
import { RegisterToggle } from './components/Term';
import { match, route } from './state/router';
import { isAdmin, profile, settings, syncState } from './state/store';
import { Home } from './pages/Home';
import { Train } from './pages/Train';
import { DrillPage } from './pages/DrillPage';
import { Calibrate } from './pages/Calibrate';
import { Blitz } from './pages/Blitz';
import { Dashboard } from './pages/Dashboard';
import { Forge } from './pages/Forge';
import { Potato } from './pages/Potato';
import { Steelman } from './pages/Steelman';
import { WarrantSniping } from './pages/WarrantSniping';
import { Salle } from './pages/Salle';
import { SettingsPage } from './pages/Settings';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Codex } from './pages/Codex';
import { Guide } from './pages/Guide';

const NAV = [
  ['/train', 'Drills'],
  ['/forge', 'Forge'],
  ['/salle', 'Salle'],
  ['/dashboard', 'Telemetry'],
  ['/codex', 'Codex'],
  ['/guide', 'Guide'],
  ['/settings', 'Settings'],
] as const;

function Page() {
  const path = route.value;
  let m: Record<string, string> | null;
  if (path === '/' ) return <Home />;
  if (path === '/train') return <Train />;
  if ((m = match('/drill/:id', path))) return <DrillPage id={m.id} />;
  if (path === '/calibrate') return <Calibrate />;
  if (path === '/blitz') return <Blitz />;
  if (path === '/dashboard') return <Dashboard />;
  if (path === '/forge') return <Forge />;
  if (path === '/forge/potato') return <Potato />;
  if (path === '/forge/steelman') return <Steelman />;
  if (path === '/forge/warrant') return <WarrantSniping />;
  if (path === '/salle') return <Salle />;
  if (path === '/settings') return <SettingsPage />;
  if (path === '/account') return <Account />;
  if (path === '/admin') return <Admin />;
  if (path === '/codex') return <Codex />;
  if (path === '/guide') return <Guide />;
  return (
    <div class="panel">
      <h1>Not found</h1>
      <p><a href="#/">Return to the hall</a></p>
    </div>
  );
}

export function App() {
  const path = route.value;
  const active = (p: string) => (path === p || path.startsWith(p + '/') || (p === '/train' && (path.startsWith('/drill') || path === '/calibrate' || path === '/blitz')) ? 'page' : undefined);
  const theme = settings.value.theme;
  const cycleTheme = () => (settings.value = { ...settings.value, theme: theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto' });
  const sync = syncState.value;
  return (
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="#/" aria-label={APP_TITLE}>The Rhetoric <span>Forge</span></a>
        <nav class="nav" aria-label="Main">
          {NAV.map(([p, label]) => <a href={`#${p}`} aria-current={active(p)}>{label}</a>)}
          {isAdmin.value && <a href="#/admin" aria-current={active('/admin')}>Admin</a>}
          <a href="#/account" aria-current={active('/account')}>
            {profile.value ? `Account${sync.status === 'syncing' ? ' ⟳' : sync.status === 'error' ? ' ⚠' : ''}` : 'Sign in'}
          </a>
        </nav>
        <div class="toolbar">
          <RegisterToggle />
          <button class="btn-quiet" onClick={cycleTheme} title={`Theme: ${theme} (click to change)`} aria-label={`Theme: ${theme}`}>
            <span class="mono">{theme === 'auto' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>
      <main>
        <Page />
      </main>
    </div>
  );
}
