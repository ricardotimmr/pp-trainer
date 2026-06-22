import type { AthleteProfile, Weekday } from '@prisma/client';
import type {
  ActivitySummaryDto,
  AthleteContextSnapshotDto,
  TrainingAvailabilityDto,
  TrainingZoneSetDto,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { mapAthleteProfile, mapTrainingAvailability, mapTrainingGoal, mapTrainingZoneSet } from '../mappers/mapAthlete.js';
import { mapActivitySummary } from '../mappers/mapActivity.js';
import { mapAthleteContextSnapshot } from '../mappers/mapContext.js';
import { mapPerformanceSportMetric, mapRacePrediction } from '../mappers/mapPerformance.js';
import { mapTrainingPlan } from '../mappers/mapTraining.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as ContextRepository from '../repositories/ContextRepository.js';
import * as PerformanceRepository from '../repositories/PerformanceRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';
import type { AthleteContextV1, AthleteGoalSummary } from '../types/athleteContext.js';
import { getCurrentWeekRange } from '../utils/dateUtils.js';

const CONTEXT_VERSION = 'v1' as const;
const RECENT_ACTIVITIES_LIMIT = 10;

const WEEKDAY_ORDER: Record<Weekday, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildGoalSummaryText(goals: AthleteGoalSummary): string | undefined {
  if (!goals.mainGoal && goals.secondaryGoals.length === 0 && goals.watchlistGoals.length === 0) {
    return undefined;
  }
  const parts: string[] = [];
  if (goals.mainGoal) parts.push(`Main goal: ${goals.mainGoal.title}`);
  if (goals.secondaryGoals.length > 0) parts.push(`${goals.secondaryGoals.length} secondary goal(s)`);
  if (goals.watchlistGoals.length > 0) parts.push(`${goals.watchlistGoals.length} watchlist item(s)`);
  return parts.join('. ');
}

function buildRecentTrainingSummaryText(activities: ActivitySummaryDto[]): string | undefined {
  if (activities.length === 0) return undefined;
  const last = activities[0];
  return `${activities.length} recent activities. Last: ${last.sport} on ${last.startTime.split('T')[0]}.`;
}

function buildAvailabilitySummaryText(availability: TrainingAvailabilityDto[]): string | undefined {
  const available = availability.filter((a) => a.available);
  if (available.length === 0) return undefined;
  return `${available.length} available training day(s) per week.`;
}

function buildZoneSummaryText(zoneSets: TrainingZoneSetDto[]): string | undefined {
  if (zoneSets.length === 0) return undefined;
  return `${zoneSets.length} zone set(s) configured.`;
}

async function buildContextForProfile(profile: AthleteProfile): Promise<AthleteContextV1> {
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const [goals, availability, zoneSets, recentActivities, metrics, predictions, currentPlan] =
    await Promise.all([
      AthleteRepository.findAthleteGoals(profile.id),
      AthleteRepository.findAthleteAvailability(profile.id),
      AthleteRepository.findAthleteZoneSets(profile.id),
      ActivityRepository.findActivities(profile.id, {}, RECENT_ACTIVITIES_LIMIT),
      PerformanceRepository.findPerformanceMetrics(profile.id),
      PerformanceRepository.findRacePredictions(profile.id),
      TrainingRepository.findActivePlanWithWeekWorkouts(profile.id, weekStart, weekEnd),
    ]);

  const sortedAvailability = [...availability].sort(
    (a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday],
  );

  const mainGoalRaw = goals.find((g) => g.priority === 'MainGoal') ?? null;
  const mappedGoals: AthleteGoalSummary = {
    mainGoal: mainGoalRaw ? mapTrainingGoal(mainGoalRaw) : null,
    secondaryGoals: goals.filter((g) => g.priority === 'SecondaryGoal').map(mapTrainingGoal),
    watchlistGoals: goals.filter((g) => g.priority === 'Watchlist').map(mapTrainingGoal),
  };

  return {
    version: CONTEXT_VERSION,
    generatedAt: new Date().toISOString(),
    athleteProfile: mapAthleteProfile(profile),
    goals: mappedGoals,
    availability: sortedAvailability.map(mapTrainingAvailability),
    trainingZones: zoneSets.map(mapTrainingZoneSet),
    recentActivities: recentActivities.map(mapActivitySummary),
    currentWeek: {
      weekStart: toDateString(weekStart),
      weekEnd: toDateString(weekEnd),
      trainingPlan: currentPlan ? mapTrainingPlan(currentPlan) : null,
    },
    performanceStats: {
      sportMetrics: metrics.map(mapPerformanceSportMetric),
      racePredictions: predictions.map(mapRacePrediction),
    },
  };
}

export async function buildAthleteContext(): Promise<AthleteContextV1 | null> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) return null;
  return buildContextForProfile(profile);
}

export async function saveContextSnapshot(): Promise<AthleteContextSnapshotDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw ApiError.notFound('Athlete profile not found');

  const context = await buildContextForProfile(profile);

  const summaries = {
    goalSummary: buildGoalSummaryText(context.goals) ?? null,
    recentTrainingSummary: buildRecentTrainingSummaryText(context.recentActivities) ?? null,
    availabilitySummary: buildAvailabilitySummaryText(context.availability) ?? null,
    zoneSummary: buildZoneSummaryText(context.trainingZones) ?? null,
  };

  const snapshot = await ContextRepository.saveAthleteContextSnapshot(
    profile.id,
    context,
    summaries,
  );

  return mapAthleteContextSnapshot(snapshot);
}
