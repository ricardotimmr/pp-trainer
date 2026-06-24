import { ActivitiesPage } from '../pages/ActivitiesPage';
import { ActivityDetailPage } from '../pages/ActivityDetailPage';
import { AiCoachPage } from '../pages/AiCoachPage';
import { AiWeekPlanPreviewPage } from '../pages/AiWeekPlanPreviewPage';
import { AiWorkoutPreviewPage } from '../pages/AiWorkoutPreviewPage';
import { CreateWorkoutPage } from '../pages/CreateWorkoutPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DevUiShowcasePage } from '../pages/DevUiShowcasePage';
import { HomePage } from '../pages/HomePage';
import { ImportPage } from '../pages/ImportPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PerformancePage } from '../pages/PerformancePage';
import { SettingsPage } from '../pages/SettingsPage';
import { TrainingPlanPage } from '../pages/TrainingPlanPage';
import { WorkoutDetailPage } from '../pages/WorkoutDetailPage';
import type { RouteConfig, RouteMatch, RouteParams } from './routeTypes';

export const routes: RouteConfig[] = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    navVisible: true,
    component: HomePage,
  },
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    navVisible: true,
    component: DashboardPage,
  },
  {
    id: 'activities',
    path: '/activities',
    label: 'Activities',
    navVisible: true,
    component: ActivitiesPage,
  },
  {
    id: 'activityDetail',
    path: '/activities/:id',
    label: 'Activity Detail',
    navVisible: false,
    component: ActivityDetailPage,
  },
  {
    id: 'trainingPlan',
    path: '/training-plan',
    label: 'Training Plan',
    navVisible: true,
    component: TrainingPlanPage,
  },
  {
    id: 'workoutCreate',
    path: '/workouts/new',
    label: 'Create Workout',
    navVisible: false,
    component: CreateWorkoutPage,
  },
  {
    id: 'workoutDetail',
    path: '/workouts/:id',
    label: 'Workout Detail',
    navVisible: false,
    component: WorkoutDetailPage,
  },
  {
    id: 'performance',
    path: '/performance',
    label: 'Performance',
    navVisible: true,
    component: PerformancePage,
  },
  {
    id: 'aiCoach',
    path: '/ai-coach',
    label: 'AI Coach',
    navVisible: true,
    component: AiCoachPage,
  },
  {
    id: 'aiCoachWeekPlanPreview',
    path: '/ai-coach/preview/week-plan/:id',
    label: 'AI Week Plan Preview',
    navVisible: false,
    component: AiWeekPlanPreviewPage,
  },
  {
    id: 'aiWorkoutPreview',
    path: '/ai-coach/preview/workout/:id',
    label: 'AI Workout Preview',
    navVisible: false,
    component: AiWorkoutPreviewPage,
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    navVisible: true,
    component: SettingsPage,
  },
  {
    id: 'import',
    path: '/import',
    label: 'Import',
    navVisible: true,
    component: ImportPage,
  },
  // DEV-ONLY — not linked from navigation
  {
    id: 'devUiShowcase',
    path: '/dev/ui-showcase',
    label: 'UI Showcase',
    navVisible: false,
    component: DevUiShowcasePage,
  },
];

export const notFoundRoute: RouteConfig = {
  id: 'notFound',
  path: '*',
  label: 'Not Found',
  navVisible: false,
  component: NotFoundPage,
};

const normalizePath = (path: string) => {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path || '/';
};

const matchRoute = (
  routePath: string,
  currentPath: string,
): RouteParams | null => {
  const routeSegments = normalizePath(routePath).split('/').filter(Boolean);
  const currentSegments = normalizePath(currentPath).split('/').filter(Boolean);

  if (routeSegments.length !== currentSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const currentSegment = currentSegments[index];

    if (!routeSegment || !currentSegment) {
      return null;
    }

    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = decodeURIComponent(currentSegment);
      continue;
    }

    if (routeSegment !== currentSegment) {
      return null;
    }
  }

  return params;
};

export const getRouteMatch = (pathname: string): RouteMatch => {
  for (const route of routes) {
    const params = matchRoute(route.path, pathname);

    if (params) {
      return { route, params };
    }
  }

  return { route: notFoundRoute, params: {} };
};

export const navigationRoutes = routes.filter((route) => route.navVisible);
