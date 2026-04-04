import { createHashRouter } from 'react-router';
import { Root } from './components/Root';
import { HomePage } from './pages/HomePage';
import { HackathonsPage } from './pages/HackathonsPage';
import { HackathonDetailPage } from './pages/HackathonDetailPage';
import { CampPage } from './pages/CampPage';
import { RankingsPage } from './pages/RankingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalDashboardPage } from './pages/PersonalDashboardPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createHashRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: 'hackathons', Component: HackathonsPage },
      { path: 'hackathons/:slug', Component: HackathonDetailPage },
      { path: 'camp', Component: CampPage },
      { path: 'rankings', Component: RankingsPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'personal-dashboard/:slug', Component: PersonalDashboardPage },
      { path: 'teams/:id', Component: TeamDashboardPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);