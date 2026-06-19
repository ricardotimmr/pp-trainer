import type { WorkoutStepType } from '../../mock/prototypeData.types';

export const stepTypeLabels: Record<WorkoutStepType, string> = {
  warmup: 'Warm-up',
  main: 'Main set',
  interval: 'Interval',
  recovery: 'Recovery',
  cooldown: 'Cool-down',
  technique: 'Technique',
  strength_exercise: 'Exercise',
  rest: 'Rest',
  other: 'Other',
};
