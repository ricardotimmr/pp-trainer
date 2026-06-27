import { describe, expect, it } from 'vitest';

import {
  enrichSingleWorkoutDistances,
  enrichWeekPlanDistances,
} from '../../services/AiWorkoutDistanceEstimator.js';

const runningPaceZoneSet = {
  id: 'running-pace-set',
  athleteProfileId: 'profile-1',
  sport: 'Running',
  zoneType: 'RunningPace',
  name: 'Running Pace',
  basedOn: 'Threshold pace',
  isActive: true,
  createdAt: new Date('2026-06-01T08:00:00.000Z'),
  updatedAt: new Date('2026-06-01T08:00:00.000Z'),
  zones: [
    {
      id: 'running-pace-z1',
      trainingZoneSetId: 'running-pace-set',
      zoneNumber: 1,
      name: 'Easy',
      lowerBound: 330,
      upperBound: 360,
      unit: 'SecPerKm',
      description: null,
    },
    {
      id: 'running-pace-z2',
      trainingZoneSetId: 'running-pace-set',
      zoneNumber: 2,
      name: 'Steady',
      lowerBound: 300,
      upperBound: 330,
      unit: 'SecPerKm',
      description: null,
    },
  ],
};

describe('enrichSingleWorkoutDistances', () => {
  it('estimates missing running step distance from matching athlete pace zone', () => {
    const result = enrichSingleWorkoutDistances(
      {
        workout: {
          title: 'Easy Run',
          sport: 'running',
          workoutType: 'endurance',
          plannedDurationSeconds: 1200,
          intensity: 'easy',
          objective: 'Build aerobic base',
          steps: [
            {
              stepIndex: 0,
              stepType: 'warmup',
              instruction: '20 minutes easy jog',
              durationSeconds: 1200,
              targetHeartRateZoneName: 'Zone 2',
            },
          ],
        },
      },
      [runningPaceZoneSet] as never,
    );

    expect(result.workout.steps[0]).toMatchObject({
      distanceMeters: 3810,
      targetPaceLowerSecPerKm: 300,
      targetPaceUpperSecPerKm: 330,
      targetPaceZoneName: 'Steady',
    });
    expect(result.workout.plannedDistanceMeters).toBe(3810);
  });

  it('does not overwrite explicit step distance', () => {
    const result = enrichSingleWorkoutDistances(
      {
        workout: {
          title: 'Intervals',
          sport: 'running',
          workoutType: 'vo2max',
          intensity: 'vo2max',
          objective: 'Run sharp intervals',
          steps: [
            {
              stepIndex: 0,
              stepType: 'interval',
              instruction: '400m reps',
              distanceMeters: 400,
              repetitions: 6,
            },
          ],
        },
      },
      [runningPaceZoneSet] as never,
    );

    expect(result.workout.steps[0]?.distanceMeters).toBe(400);
    expect(result.workout.plannedDistanceMeters).toBe(2400);
  });
});

describe('enrichWeekPlanDistances', () => {
  it('enriches running workouts inside a week plan', () => {
    const result = enrichWeekPlanDistances(
      {
        title: 'Base Week',
        weekStartDate: '2026-06-22',
        weekEndDate: '2026-06-28',
        workouts: [
          {
            title: 'Easy Run',
            sport: 'running',
            workoutType: 'endurance',
            intensity: 'easy',
            objective: 'Keep it relaxed',
            steps: [
              {
                stepIndex: 0,
                stepType: 'cooldown',
                instruction: '5 minutes relaxed cooldown',
                durationSeconds: 300,
              },
            ],
          },
        ],
      },
      [runningPaceZoneSet] as never,
    );

    expect(result.workouts[0]?.steps[0]).toMatchObject({
      distanceMeters: 870,
      targetPaceZoneName: 'Easy',
    });
  });
});
