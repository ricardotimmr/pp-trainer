import { useMemo, useState, type ReactNode } from 'react';

import {
  prototypeAthleteProfile,
  prototypeTrainingGoals,
} from '../mock/prototypeData';
import {
  PrototypeAthleteContext,
  type PrototypeAthleteContextValue,
} from './prototypeAthleteContextValue';
import type {
  AthleteProfile,
  GoalPriority,
  SportType,
  TrainingGoal,
} from '../mock/prototypeData.types';

const GOAL_PRIORITY_ORDER: Record<GoalPriority, number> = {
  main_goal: 0,
  secondary_goal: 1,
  watchlist: 2,
};

function getInitialVisibleGoalIds(): string[] {
  return prototypeTrainingGoals
    .filter((goal) => goal.isActive)
    .sort((a, b) => GOAL_PRIORITY_ORDER[a.priority] - GOAL_PRIORITY_ORDER[b.priority])
    .slice(0, 3)
    .map((goal) => goal.id);
}

export function PrototypeAthleteProvider({ children }: { children: ReactNode }) {
  const [focusedSports, setFocusedSports] = useState<SportType[]>(() => [
    ...prototypeAthleteProfile.primarySports,
  ]);
  const [visibleGoalIds, setVisibleGoalIds] = useState(getInitialVisibleGoalIds);
  const [goalPriorities, setGoalPriorities] = useState<Record<string, GoalPriority>>({});

  const value = useMemo<PrototypeAthleteContextValue>(() => {
    const profile: AthleteProfile = {
      ...prototypeAthleteProfile,
      primarySports: focusedSports,
    };

    const allGoals = prototypeTrainingGoals.map((goal) => ({
      ...goal,
      priority: goalPriorities[goal.id] ?? goal.priority,
      isActive: visibleGoalIds.includes(goal.id),
    }));

    const activeGoals = visibleGoalIds
      .map((goalId) => allGoals.find((goal) => goal.id === goalId))
      .filter((goal): goal is TrainingGoal => Boolean(goal))
      .sort(
        (a, b) =>
          GOAL_PRIORITY_ORDER[a.priority] - GOAL_PRIORITY_ORDER[b.priority],
      );

    const mainGoal = activeGoals.find((goal) => goal.priority === 'main_goal');
    const secondaryGoals = activeGoals.filter(
      (goal) => goal.priority === 'secondary_goal',
    );
    const watchlistGoals = activeGoals.filter(
      (goal) => goal.priority === 'watchlist',
    );

    return {
      profile,
      allGoals,
      activeGoals,
      availableSports: prototypeAthleteProfile.primarySports,
      focusedSports,
      visibleGoalIds,
      mainGoal,
      secondaryGoals,
      watchlistGoals,
      addActiveGoal: (goalId) => {
        setVisibleGoalIds((current) => {
          if (current.includes(goalId) || current.length >= 3) return current;
          return [...current, goalId];
        });
      },
      removeActiveGoal: (goalId) => {
        setVisibleGoalIds((current) =>
          current.filter((currentGoalId) => currentGoalId !== goalId),
        );
      },
      setFocusedSports,
      toggleFocusedSport: (sport) => {
        setFocusedSports((current) =>
          current.includes(sport)
            ? current.filter((currentSport) => currentSport !== sport)
            : [...current, sport],
        );
      },
      setGoalPriority: (goalId, priority) => {
        setGoalPriorities((current) => ({
          ...current,
          [goalId]: priority,
        }));
      },
    };
  }, [focusedSports, goalPriorities, visibleGoalIds]);

  return (
    <PrototypeAthleteContext.Provider value={value}>
      {children}
    </PrototypeAthleteContext.Provider>
  );
}
