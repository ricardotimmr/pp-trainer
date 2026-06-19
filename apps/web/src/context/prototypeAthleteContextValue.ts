import { createContext, useContext } from 'react';

import type {
  AthleteProfile,
  GoalPriority,
  SportType,
  TrainingGoal,
} from '../mock/prototypeData.types';

export type PrototypeAthleteContextValue = {
  profile: AthleteProfile;
  allGoals: TrainingGoal[];
  activeGoals: TrainingGoal[];
  availableSports: SportType[];
  focusedSports: SportType[];
  visibleGoalIds: string[];
  mainGoal?: TrainingGoal;
  secondaryGoals: TrainingGoal[];
  watchlistGoals: TrainingGoal[];
  addActiveGoal: (goalId: string) => void;
  removeActiveGoal: (goalId: string) => void;
  setFocusedSports: (sports: SportType[]) => void;
  toggleFocusedSport: (sport: SportType) => void;
  setGoalPriority: (goalId: string, priority: GoalPriority) => void;
};

export const PrototypeAthleteContext =
  createContext<PrototypeAthleteContextValue | null>(null);

export function usePrototypeAthleteContext(): PrototypeAthleteContextValue {
  const context = useContext(PrototypeAthleteContext);

  if (!context) {
    throw new Error(
      'usePrototypeAthleteContext must be used inside PrototypeAthleteProvider',
    );
  }

  return context;
}
