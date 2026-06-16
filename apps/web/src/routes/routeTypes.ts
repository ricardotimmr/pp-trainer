import type { ComponentType } from 'react';

export type RouteId =
  | 'home'
  | 'dashboard'
  | 'activities'
  | 'activityDetail'
  | 'trainingPlan'
  | 'workoutDetail'
  | 'aiCoach'
  | 'settings'
  | 'import'
  | 'notFound';

export type RouteParams = Record<string, string>;

export type PageComponentProps = {
  params: RouteParams;
  navigate: (path: string) => void;
};

export type RouteConfig = {
  id: RouteId;
  path: string;
  label: string;
  navVisible: boolean;
  component: ComponentType<PageComponentProps>;
};

export type RouteMatch = {
  route: RouteConfig;
  params: RouteParams;
};
