import { describe, expect, it } from 'vitest';

import { buildSingleWorkoutPrompt, buildWeekPlanPrompt } from '../../ai/PromptBuilder.js';
import type { AthleteContextForAi } from '../../types/athleteContext.js';

const minimalContext: AthleteContextForAi = {
  version: 'v1',
  generatedAt: '2026-06-23T10:00:00.000Z',
  athlete: {
    displayName: 'Test Athlete',
    primarySports: ['running'],
  },
  goals: [],
  availability: [{ weekday: 'monday', available: true }],
  trainingZones: [],
  recentActivities: [],
  currentWeek: {
    weekStartDate: '2026-06-23',
    plannedWorkoutCount: 0,
    completedActivityCount: 0,
  },
};

describe('buildWeekPlanPrompt', () => {
  it('includes the systemRole string', () => {
    const { systemRole } = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    expect(systemRole.length).toBeGreaterThan(50);
    expect(systemRole.toLowerCase()).toContain('coach');
  });

  it('includes the weekStartDate in userContent', () => {
    const { userContent } = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    expect(userContent).toContain('2026-06-23');
  });

  it('embeds serialised athlete context JSON', () => {
    const { userContent } = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    expect(userContent).toContain('"Test Athlete"');
    expect(userContent).toContain('"running"');
  });

  it('includes output schema hint', () => {
    const { userContent } = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    expect(userContent).toContain('weekStartDate');
    expect(userContent).toContain('workouts');
    expect(userContent).toContain('stepIndex');
  });

  it('appends additional instructions when provided', () => {
    const { userContent } = buildWeekPlanPrompt(
      minimalContext,
      '2026-06-23',
      'Focus on marathon pace work',
    );
    expect(userContent).toContain('Focus on marathon pace work');
  });

  it('omits Additional Instructions section when not provided', () => {
    const { userContent } = buildWeekPlanPrompt(minimalContext, '2026-06-23');
    expect(userContent).not.toContain('Additional Instructions');
  });

  it('is deterministic — same input produces same output', () => {
    const a = buildWeekPlanPrompt(minimalContext, '2026-06-23', 'hill repeats');
    const b = buildWeekPlanPrompt(minimalContext, '2026-06-23', 'hill repeats');
    expect(a.systemRole).toBe(b.systemRole);
    expect(a.userContent).toBe(b.userContent);
  });
});

describe('buildSingleWorkoutPrompt', () => {
  it('includes the systemRole string', () => {
    const { systemRole } = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo effort');
    expect(systemRole.length).toBeGreaterThan(50);
  });

  it('includes sport and objective in userContent', () => {
    const { userContent } = buildSingleWorkoutPrompt(minimalContext, 'Cycling', 'VO2max intervals');
    expect(userContent).toContain('Cycling');
    expect(userContent).toContain('VO2max intervals');
  });

  it('includes planned duration hint when provided', () => {
    const { userContent } = buildSingleWorkoutPrompt(
      minimalContext,
      'Running',
      'Easy jog',
      3600,
    );
    expect(userContent).toContain('60 minutes');
  });

  it('omits duration hint when not provided', () => {
    const { userContent } = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Easy jog');
    expect(userContent).not.toContain('minutes');
  });

  it('embeds serialised athlete context JSON', () => {
    const { userContent } = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo');
    expect(userContent).toContain('"Test Athlete"');
  });

  it('includes single workout output schema hint', () => {
    const { userContent } = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo');
    expect(userContent).toContain('"workout"');
    expect(userContent).toContain('stepIndex');
  });

  it('appends additional instructions when provided', () => {
    const { userContent } = buildSingleWorkoutPrompt(
      minimalContext,
      'Running',
      'Tempo',
      undefined,
      'Keep it flat, no hills',
    );
    expect(userContent).toContain('Keep it flat, no hills');
  });

  it('is deterministic', () => {
    const a = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo', 3600);
    const b = buildSingleWorkoutPrompt(minimalContext, 'Running', 'Tempo', 3600);
    expect(a.userContent).toBe(b.userContent);
  });
});
