export type SessionBarStep = {
  id?: string | number;
  stepIndex?: number;
  stepType: string;
  durationSeconds?: number;
  distanceMeters?: number;
  repetitions?: number;
  restSeconds?: number;
};

export type SessionBarSegment<TStep extends SessionBarStep> = {
  key: string;
  kind: 'work' | 'rest';
  step: TStep;
  stepType: string;
  flex: number;
};

export function getSessionBarWorkFlex(step: SessionBarStep): number {
  const reps = step.repetitions ?? 1;
  return (step.durationSeconds ?? step.distanceMeters ?? 0) * reps;
}

export function getSessionBarRestFlex(step: SessionBarStep): number {
  const reps = step.repetitions ?? 1;
  return (step.restSeconds ?? 0) * Math.max(0, reps - 1);
}

export function getSessionBarSegments<TStep extends SessionBarStep>(
  steps: TStep[],
): SessionBarSegment<TStep>[] {
  return steps.flatMap((step, index) => {
    const keyBase = String(step.id ?? step.stepIndex ?? index);
    const workFlex = getSessionBarWorkFlex(step);
    const restFlex = getSessionBarRestFlex(step);
    const segments: SessionBarSegment<TStep>[] = [];

    if (workFlex > 0) {
      segments.push({
        key: `${keyBase}-work`,
        kind: 'work',
        step,
        stepType: step.stepType,
        flex: workFlex,
      });
    }

    if (restFlex > 0) {
      segments.push({
        key: `${keyBase}-rest`,
        kind: 'rest',
        step,
        stepType: 'rest',
        flex: restFlex,
      });
    }

    return segments;
  });
}

export function getSessionBarTotalFlex<TStep extends SessionBarStep>(
  segments: SessionBarSegment<TStep>[],
): number {
  return segments.reduce((sum, segment) => sum + segment.flex, 0);
}

export function hasSessionBarData<TStep extends SessionBarStep>(
  segments: SessionBarSegment<TStep>[],
): boolean {
  return segments.some((segment) => segment.flex > 0);
}

export function hasDistanceOnlySessionStep(steps: SessionBarStep[]): boolean {
  return steps.some((step) => !step.durationSeconds && (step.distanceMeters ?? 0) > 0);
}
