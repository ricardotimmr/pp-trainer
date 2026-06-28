import type { DailyHealthSummary, HrvStatus, SleepSession } from '@prisma/client';
import type {
  DailyHealthResponseDto,
  DailyHealthSummaryDto,
  HrvStatusDto,
  HrvStatusResponseDto,
  SleepSessionDto,
  SleepSessionResponseDto,
} from '@pp-trainer/shared';

import { DATA_SOURCE_TYPE_MAP } from '../mappers/enumMaps.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as DailyHealthRepository from '../repositories/DailyHealthRepository.js';
import * as HrvStatusRepository from '../repositories/HrvStatusRepository.js';
import * as SleepSessionRepository from '../repositories/SleepSessionRepository.js';

function mapDailyHealth(r: DailyHealthSummary): DailyHealthSummaryDto {
  return {
    id: r.id,
    date: r.date.toISOString(),
    source: DATA_SOURCE_TYPE_MAP[r.source],
    restingHeartRate: r.restingHeartRate ?? undefined,
    steps: r.steps ?? undefined,
    floors: r.floors ?? undefined,
    activeCalories: r.activeCalories ?? undefined,
    totalCalories: r.totalCalories ?? undefined,
    avgStressLevel: r.avgStressLevel ?? undefined,
    bodyBatteryLow: r.bodyBatteryLow ?? undefined,
    bodyBatteryHigh: r.bodyBatteryHigh ?? undefined,
    avgRespiration: r.avgRespiration ?? undefined,
    avgSpo2: r.avgSpo2 ?? undefined,
  };
}

function mapSleepSession(r: SleepSession): SleepSessionDto {
  return {
    id: r.id,
    date: r.date.toISOString(),
    source: DATA_SOURCE_TYPE_MAP[r.source],
    startTime: r.startTime?.toISOString(),
    endTime: r.endTime?.toISOString(),
    totalSleepSeconds: r.totalSleepSeconds ?? undefined,
    deepSleepSeconds: r.deepSleepSeconds ?? undefined,
    lightSleepSeconds: r.lightSleepSeconds ?? undefined,
    remSleepSeconds: r.remSleepSeconds ?? undefined,
    awakeSeconds: r.awakeSeconds ?? undefined,
    sleepScore: r.sleepScore ?? undefined,
    avgStress: r.avgStress ?? undefined,
    avgSpo2: r.avgSpo2 ?? undefined,
  };
}

function mapHrvStatus(r: HrvStatus): HrvStatusDto {
  return {
    id: r.id,
    date: r.date.toISOString(),
    source: DATA_SOURCE_TYPE_MAP[r.source],
    weeklyAvgHrv: r.weeklyAvgHrv ?? undefined,
    lastNightAvgHrv: r.lastNightAvgHrv ?? undefined,
    lastNightFiveMinHigh: r.lastNightFiveMinHigh ?? undefined,
    status: (r.status ?? undefined) as HrvStatusDto['status'],
  };
}

async function resolveAthleteId(): Promise<string | null> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  return profile?.id ?? null;
}

export async function getDailyHealth(from: Date, to: Date): Promise<DailyHealthResponseDto> {
  const athleteProfileId = await resolveAthleteId();
  if (athleteProfileId == null) return { days: [] };
  const rows = await DailyHealthRepository.findDailyHealth(athleteProfileId, from, to);
  return { days: rows.map(mapDailyHealth) };
}

export async function getSleepSessions(from: Date, to: Date): Promise<SleepSessionResponseDto> {
  const athleteProfileId = await resolveAthleteId();
  if (athleteProfileId == null) return { sessions: [] };
  const rows = await SleepSessionRepository.findSleepSessions(athleteProfileId, from, to);
  return { sessions: rows.map(mapSleepSession) };
}

export async function getHrvStatuses(from: Date, to: Date): Promise<HrvStatusResponseDto> {
  const athleteProfileId = await resolveAthleteId();
  if (athleteProfileId == null) return { statuses: [] };
  const rows = await HrvStatusRepository.findHrvStatuses(athleteProfileId, from, to);
  return { statuses: rows.map(mapHrvStatus) };
}
