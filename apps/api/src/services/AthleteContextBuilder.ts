import type { AthleteContextSnapshot, Weekday } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { ApiError } from '../errors/ApiError.js';
import { prisma } from '../lib/prisma.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as CoachingMemoryRepository from '../repositories/CoachingMemoryRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';
import type {
  AiCoachingMemory,
  AiMonthlyTrainingSummary,
  AiTrainingHistory,
  AthleteContextForAi,
} from '../types/athleteContext.js';
import { getCurrentWeekRange } from '../utils/dateUtils.js';

const RECENT_ACTIVITIES_LIMIT = 10;
const UPCOMING_DAYS = 14;
const HISTORY_MONTHS = 12;
const MEMORY_CHAR_BUDGET = 2000;

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

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function toIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function buildTrainingHistory(
  activities: { sport: string; startTime: Date; durationSeconds: number; distanceMeters: number | null }[],
  totalActivitiesAllTime: number,
): AiTrainingHistory | undefined {
  if (activities.length === 0 && totalActivitiesAllTime === 0) return undefined;

  const byMonth = new Map<string, AiMonthlyTrainingSummary>();
  const byWeek = new Map<string, number>();

  for (const act of activities) {
    const month = toMonthKey(act.startTime);
    const week = toIsoWeekKey(act.startTime);
    const sport = act.sport.toLowerCase();

    if (!byMonth.has(month)) {
      byMonth.set(month, { month, totalDurationSeconds: 0, activityCount: 0, sportBreakdown: {} });
    }
    const ms = byMonth.get(month)!;
    ms.totalDurationSeconds += act.durationSeconds;
    ms.activityCount += 1;
    if (act.distanceMeters != null) {
      ms.totalDistanceMeters = (ms.totalDistanceMeters ?? 0) + act.distanceMeters;
    }
    ms.sportBreakdown[sport] = (ms.sportBreakdown[sport] ?? 0) + act.durationSeconds;

    byWeek.set(week, (byWeek.get(week) ?? 0) + act.durationSeconds);
  }

  const monthlyStats = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const peakWeekDurationSeconds =
    byWeek.size > 0 ? Math.max(...byWeek.values()) : undefined;

  return {
    monthlyStats,
    ...(peakWeekDurationSeconds != null && { peakWeekDurationSeconds }),
    ...(totalActivitiesAllTime > 0 && { totalActivitiesAllTime }),
  };
}

function buildCoachingMemory(entries: { entryText: string }[], totalCount: number): AiCoachingMemory | undefined {
  if (entries.length === 0) return undefined;

  // Entries come in newest-first order from the DB; we keep that order so AI sees most recent first
  const recentEntries: string[] = [];
  let charCount = 0;

  for (const entry of entries) {
    if (charCount + entry.entryText.length > MEMORY_CHAR_BUDGET) break;
    recentEntries.push(entry.entryText);
    charCount += entry.entryText.length;
  }

  const hiddenCount = totalCount - recentEntries.length;
  const olderSummary =
    hiddenCount > 0
      ? `Plus ${hiddenCount} older coaching session${hiddenCount === 1 ? '' : 's'} not shown.`
      : undefined;

  return {
    recentEntries,
    ...(olderSummary != null && { olderSummary }),
  };
}

export async function buildContext(athleteProfileId: string): Promise<AthleteContextForAi> {
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const upcomingEnd = new Date(weekStart);
  upcomingEnd.setUTCDate(weekStart.getUTCDate() + UPCOMING_DAYS);

  const historyFrom = new Date();
  historyFrom.setUTCMonth(historyFrom.getUTCMonth() - HISTORY_MONTHS);

  const [
    profile,
    goals,
    availability,
    zoneSets,
    recentActivities,
    weekActivities,
    upcomingWorkouts,
    historyActivities,
    totalActivitiesAllTime,
    memoryEntries,
    totalMemoryCount,
  ] = await Promise.all([
    AthleteRepository.findAthleteProfileById(athleteProfileId),
    AthleteRepository.findAthleteGoals(athleteProfileId),
    AthleteRepository.findAthleteAvailability(athleteProfileId),
    AthleteRepository.findAthleteZoneSets(athleteProfileId),
    ActivityRepository.findActivities(athleteProfileId, {}, RECENT_ACTIVITIES_LIMIT),
    ActivityRepository.findActivities(athleteProfileId, {
      startTimeFrom: weekStart,
      startTimeTo: weekEnd,
    }),
    TrainingRepository.listWorkouts(athleteProfileId, weekStart, upcomingEnd),
    ActivityRepository.findActivitiesForHistory(athleteProfileId, historyFrom),
    ActivityRepository.countActivitiesAllTime(athleteProfileId),
    CoachingMemoryRepository.findRecentEntries(athleteProfileId),
    CoachingMemoryRepository.countEntries(athleteProfileId),
  ]);

  if (profile == null) throw ApiError.notFound('Athlete profile not found');

  // Current-week planned workouts (subset of upcoming)
  const weekWorkouts = upcomingWorkouts.filter((w) => {
    const d = new Date(w.scheduledDate);
    return d >= weekStart && d < weekEnd;
  });

  // Aggregate completed duration by sport for current week
  const completedDurationBySport: Record<string, number> = {};
  let totalCompletedDurationSeconds = 0;
  for (const act of weekActivities) {
    totalCompletedDurationSeconds += act.durationSeconds;
    const sport = act.sport.toLowerCase();
    completedDurationBySport[sport] = (completedDurationBySport[sport] ?? 0) + act.durationSeconds;
  }

  const totalPlannedDurationSeconds = weekWorkouts.reduce(
    (sum, w) => sum + (w.plannedDurationSeconds ?? 0),
    0,
  );

  return {
    version: 'v1',
    generatedAt: new Date().toISOString(),

    athlete: {
      displayName: profile.displayName,
      bodyWeightKg: profile.bodyWeightKg != null ? Number(profile.bodyWeightKg) : undefined,
      heightCm: profile.heightCm ?? undefined,
      primarySports: profile.primarySports.map((s) => s.toLowerCase()),
      currentFtpWatts: profile.currentFtpWatts ?? undefined,
      cyclingThresholdHrBpm: profile.cyclingThresholdHrBpm ?? undefined,
      maxHeartRateBpm: profile.maxHeartRateBpm ?? undefined,
      restingHeartRateBpm: profile.restingHeartRateBpm ?? undefined,
      runningThresholdHrBpm: profile.runningThresholdHrBpm ?? undefined,
      runningThresholdPaceSecPerKm: profile.runningThresholdPaceSecPerKm ?? undefined,
      swimmingThresholdPaceSecPer100m: profile.swimmingThresholdPaceSecPer100m ?? undefined,
    },

    goals: goals.map((g) => ({
      title: g.title,
      goalType: g.goalType.toLowerCase(),
      targetDate: g.targetDate != null ? toDateString(g.targetDate) : undefined,
      sport: g.sport != null ? g.sport.toLowerCase() : undefined,
      priority: g.priority.toLowerCase(),
      targetDistanceMeters: g.targetDistanceMeters ?? undefined,
      targetDurationSeconds: g.targetDurationSeconds ?? undefined,
      targetPaceSecPerKm: g.targetPaceSecPerKm ?? undefined,
      targetPowerWatts: g.targetPowerWatts ?? undefined,
      targetSwimPaceSecPer100m: g.targetSwimPaceSecPer100m ?? undefined,
    })),

    availability: [...availability]
      .sort((a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday])
      .map((av) => ({
        weekday: av.weekday.toLowerCase(),
        available: av.available,
        maxDurationMinutes: av.maxDurationMinutes ?? undefined,
        preferredSports:
          av.preferredSports.length > 0 ? av.preferredSports.map((s) => s.toLowerCase()) : undefined,
        notes: av.notes ?? undefined,
      })),

    trainingZones: zoneSets.map((zs) => ({
      zoneType: zs.zoneType.toLowerCase(),
      sport: zs.sport != null ? zs.sport.toLowerCase() : undefined,
      zones: zs.zones.map((z) => ({
        zoneNumber: z.zoneNumber,
        name: z.name,
        lowerBound: z.lowerBound ?? undefined,
        upperBound: z.upperBound ?? undefined,
        unit: z.unit.toLowerCase(),
      })),
    })),

    recentActivities: recentActivities.map((act) => ({
      sport: act.sport.toLowerCase(),
      startTime: act.startTime.toISOString(),
      durationSeconds: act.durationSeconds,
      distanceMeters: act.distanceMeters ?? undefined,
      averageHeartRateBpm: act.averageHeartRateBpm ?? undefined,
      averagePowerWatts: act.averagePowerWatts ?? undefined,
      averagePaceSecPerKm: act.averagePaceSecPerKm ?? undefined,
      perceivedExertion: act.perceivedExertion ?? undefined,
    })),

    currentWeek: {
      weekStartDate: toDateString(weekStart),
      plannedWorkoutCount: weekWorkouts.length,
      completedActivityCount: weekActivities.length,
      plannedDurationSeconds: totalPlannedDurationSeconds > 0 ? totalPlannedDurationSeconds : undefined,
      completedDurationSeconds:
        totalCompletedDurationSeconds > 0 ? totalCompletedDurationSeconds : undefined,
      completedDurationBySport:
        Object.keys(completedDurationBySport).length > 0 ? completedDurationBySport : undefined,
    },

    plannedWorkouts:
      upcomingWorkouts.length > 0
        ? upcomingWorkouts.map((w) => ({
            sport: w.sport.toLowerCase(),
            title: w.title,
            scheduledDate: toDateString(w.scheduledDate),
            plannedDurationSeconds: w.plannedDurationSeconds ?? undefined,
            intensity: w.intensity.toLowerCase(),
            status: w.status.toLowerCase(),
          }))
        : undefined,

    trainingHistory: buildTrainingHistory(historyActivities, totalActivitiesAllTime),

    coachingMemory: buildCoachingMemory(memoryEntries, totalMemoryCount),
  };
}

export async function persistSnapshot(
  athleteProfileId: string,
  context: AthleteContextForAi,
): Promise<AthleteContextSnapshot> {
  const goalSummary =
    context.goals.length > 0
      ? `${context.goals.length} active goal(s). Primary: ${context.goals[0].title}.`
      : undefined;

  const recentTrainingSummary =
    context.recentActivities.length > 0
      ? `${context.recentActivities.length} recent activities. Last: ${context.recentActivities[0].sport} on ${context.recentActivities[0].startTime.split('T')[0]}.`
      : undefined;

  const availableDays = context.availability.filter((a) => a.available).length;
  const availabilitySummary =
    availableDays > 0 ? `${availableDays} available training day(s) per week.` : undefined;

  const zoneSummary =
    context.trainingZones.length > 0
      ? `${context.trainingZones.length} zone set(s) configured.`
      : undefined;

  return prisma.athleteContextSnapshot.create({
    data: {
      athleteProfileId,
      contextVersion: context.version,
      generatedAt: new Date(context.generatedAt),
      structuredContext: context as unknown as Prisma.InputJsonValue,
      ...(goalSummary != null && { goalSummary }),
      ...(recentTrainingSummary != null && { recentTrainingSummary }),
      ...(availabilitySummary != null && { availabilitySummary }),
      ...(zoneSummary != null && { zoneSummary }),
    },
  });
}
