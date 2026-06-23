import type { AthleteContextSnapshot, Weekday } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { ApiError } from '../errors/ApiError.js';
import { prisma } from '../lib/prisma.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as TrainingRepository from '../repositories/TrainingRepository.js';
import type { AthleteContextForAi } from '../types/athleteContext.js';
import { getCurrentWeekRange } from '../utils/dateUtils.js';

const RECENT_ACTIVITIES_LIMIT = 10;
const UPCOMING_DAYS = 14;

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

export async function buildContext(athleteProfileId: string): Promise<AthleteContextForAi> {
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const upcomingEnd = new Date(weekStart);
  upcomingEnd.setUTCDate(weekStart.getUTCDate() + UPCOMING_DAYS);

  const [profile, goals, availability, zoneSets, recentActivities, weekActivities, upcomingWorkouts] =
    await Promise.all([
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
      maxHeartRateBpm: profile.maxHeartRateBpm ?? undefined,
      restingHeartRateBpm: profile.restingHeartRateBpm ?? undefined,
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
