import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { readFile, rm } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/ lives at the monorepo root — 4 levels up from apps/api/src/services/
const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../scripts');

import type { SyncJob } from '@prisma/client';

import { getApiConfig } from '../config/env.js';
import { runImportPipeline } from '../import/pipeline/runImportPipeline.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as DataSourceConnectionRepository from '../repositories/DataSourceConnectionRepository.js';
import * as DailyHealthRepository from '../repositories/DailyHealthRepository.js';
import * as HrvStatusRepository from '../repositories/HrvStatusRepository.js';
import * as SleepSessionRepository from '../repositories/SleepSessionRepository.js';
import * as SyncJobService from './SyncJobService.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type GarminSyncMode = 'activities' | 'health' | 'all';

export type GarminSyncParams = {
  since?: Date;
  days?: number;
  forceImport?: boolean;
  mode?: GarminSyncMode;
  mfaCode?: string;
};

export type GarminSyncResult = {
  syncJob: SyncJob;
};

type PythonActivity = {
  garminId: string;
  fitFilePath: string;
  sport: string;
  startTime: string;
  durationSeconds: number;
};

type PythonHealthDay = {
  date: string;
  dailySummary: Record<string, number | null> | null;
  sleep: Record<string, number | string | null> | null;
  hrv: Record<string, number | string | null> | null;
};

type PythonManifest = {
  tmpDir: string;
  activities: PythonActivity[];
  healthDays: PythonHealthDay[];
  error: string | null;
};

// ── Python resolution ────────────────────────────────────────────────────────

async function resolvePythonExecutable(): Promise<string> {
  const venvPython = path.join(SCRIPTS_DIR, '.venv/bin/python3');
  try {
    await access(venvPython);
    return venvPython;
  } catch {
    return 'python3';
  }
}

// ── Credential resolution ────────────────────────────────────────────────────

async function resolveCredentials(
  athleteProfileId: string,
): Promise<{ email: string; password: string } | null> {
  const connection = await DataSourceConnectionRepository.findConnection(
    athleteProfileId,
    'GarminUnofficial',
  );
  if (connection?.username && connection.password) {
    return { email: connection.username, password: connection.password };
  }
  const config = getApiConfig();
  if (config.garminEmail && config.garminPassword) {
    return { email: config.garminEmail, password: config.garminPassword };
  }
  return null;
}

// ── Python spawn ─────────────────────────────────────────────────────────────

async function runPythonScript(
  email: string,
  password: string,
  params: GarminSyncParams,
  timeoutMs = 600_000,
): Promise<PythonManifest> {
  const python = await resolvePythonExecutable();
  const scriptPath = path.join(SCRIPTS_DIR, 'garmin_sync.py');

  const config = getApiConfig();
  const tokenStore = config.garminTokenStore ?? path.join(SCRIPTS_DIR, '.garmin_tokens');

  const args: string[] = [
    scriptPath,
    '--email', email,
    '--password', password,
    '--token-store', tokenStore,
    '--mode', params.mode ?? 'all',
  ];
  if (params.since != null) args.push('--since', params.since.toISOString().slice(0, 10));
  if (params.days != null) args.push('--days', String(params.days));
  if (params.mfaCode != null) args.push('--mfa-code', params.mfaCode);

  return new Promise((resolve, reject) => {
    const proc = spawn(python, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Python script timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error(
          `Python script produced no output (exit ${code}): ${stderr.slice(0, 400)}`,
        ));
        return;
      }
      try {
        resolve(JSON.parse(trimmed) as PythonManifest);
      } catch {
        reject(new Error(`Invalid JSON from Python script: ${trimmed.slice(0, 200)}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
  });
}

// ── Activity processing ──────────────────────────────────────────────────────

async function processFitFile(
  fitFilePath: string,
  garminId: string,
  athleteProfileId: string,
  syncJobId: string,
  forceImport: boolean,
): Promise<'imported' | 'duplicate' | 'failed'> {
  const buffer = await readFile(fitFilePath);
  const result = await runImportPipeline({
    athleteProfileId,
    source: 'GarminUnofficial',
    input: buffer,
    externalId: garminId,
    syncJobId,
    forceImport,
  });
  return result.status === 'success' ? 'imported'
    : result.status === 'duplicate' ? 'duplicate'
    : 'failed';
}

// ── Health day upsert ────────────────────────────────────────────────────────

async function upsertHealthDay(
  athleteProfileId: string,
  day: PythonHealthDay,
): Promise<void> {
  const date = new Date(`${day.date}T00:00:00.000Z`);

  if (day.dailySummary != null) {
    const s = day.dailySummary;
    await DailyHealthRepository.upsertDailyHealth(athleteProfileId, date, 'GarminUnofficial', {
      restingHeartRate: s.restingHeartRate != null ? Number(s.restingHeartRate) : undefined,
      steps:            s.steps != null ? Number(s.steps) : undefined,
      floors:           s.floors != null ? Number(s.floors) : undefined,
      activeCalories:   s.activeCalories != null ? Number(s.activeCalories) : undefined,
      totalCalories:    s.totalCalories != null ? Number(s.totalCalories) : undefined,
      avgStressLevel:   s.avgStressLevel != null ? Number(s.avgStressLevel) : undefined,
      bodyBatteryLow:   s.bodyBatteryLow != null ? Number(s.bodyBatteryLow) : undefined,
      bodyBatteryHigh:  s.bodyBatteryHigh != null ? Number(s.bodyBatteryHigh) : undefined,
      avgRespiration:   s.avgRespiration != null ? Number(s.avgRespiration) : undefined,
      avgSpo2:          s.avgSpo2 != null ? Number(s.avgSpo2) : undefined,
    });
  }

  if (day.sleep != null) {
    const sl = day.sleep;
    await SleepSessionRepository.upsertSleepSession(athleteProfileId, date, 'GarminUnofficial', {
      startTime:         sl.startTime != null ? new Date(String(sl.startTime)) : undefined,
      endTime:           sl.endTime != null ? new Date(String(sl.endTime)) : undefined,
      totalSleepSeconds: sl.totalSleepSeconds != null ? Number(sl.totalSleepSeconds) : undefined,
      deepSleepSeconds:  sl.deepSleepSeconds != null ? Number(sl.deepSleepSeconds) : undefined,
      lightSleepSeconds: sl.lightSleepSeconds != null ? Number(sl.lightSleepSeconds) : undefined,
      remSleepSeconds:   sl.remSleepSeconds != null ? Number(sl.remSleepSeconds) : undefined,
      awakeSeconds:      sl.awakeSeconds != null ? Number(sl.awakeSeconds) : undefined,
      sleepScore:        sl.sleepScore != null ? Number(sl.sleepScore) : undefined,
      avgStress:         sl.avgStress != null ? Number(sl.avgStress) : undefined,
      avgSpo2:           sl.avgSpo2 != null ? Number(sl.avgSpo2) : undefined,
    });
  }

  if (day.hrv != null) {
    const h = day.hrv;
    await HrvStatusRepository.upsertHrvStatus(athleteProfileId, date, 'GarminUnofficial', {
      weeklyAvgHrv:        h.weeklyAvgHrv != null ? Number(h.weeklyAvgHrv) : undefined,
      lastNightAvgHrv:     h.lastNightAvgHrv != null ? Number(h.lastNightAvgHrv) : undefined,
      lastNightFiveMinHigh: h.lastNightFiveMinHigh != null ? Number(h.lastNightFiveMinHigh) : undefined,
      status:              h.status != null ? String(h.status) : undefined,
    });
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function sync(params: GarminSyncParams = {}): Promise<GarminSyncResult> {
  const profile = await AthleteRepository.findFirstAthleteProfile();
  if (!profile) throw new Error('No athlete profile found');

  const credentials = await resolveCredentials(profile.id);
  if (!credentials) {
    throw new Error(
      'No Garmin credentials configured. Set GARMIN_EMAIL and GARMIN_PASSWORD in .env, ' +
      'or store credentials in the DataSourceConnection for this athlete.',
    );
  }

  const syncJob = await SyncJobService.startSyncJob(profile.id, 'GarminUnofficial');
  let tmpDir: string | null = null;

  try {
    const manifest = await runPythonScript(credentials.email, credentials.password, params);
    tmpDir = manifest.tmpDir;

    if (manifest.error != null) {
      return { syncJob: await SyncJobService.failSyncJob(syncJob.id, manifest.error) };
    }

    // Process activities
    const activitiesFound = manifest.activities.length;
    let activitiesImported = 0;
    let activitiesSkipped = 0;

    for (const act of manifest.activities) {
      const outcome = await processFitFile(
        act.fitFilePath,
        act.garminId,
        profile.id,
        syncJob.id,
        params.forceImport ?? false,
      );
      if (outcome === 'imported') activitiesImported++;
      else activitiesSkipped++;
    }

    // Process health days
    const healthDaysFound = manifest.healthDays.length;
    let healthDaysImported = 0;

    for (const day of manifest.healthDays) {
      await upsertHealthDay(profile.id, day);
      healthDaysImported++;
    }

    return {
      syncJob: await SyncJobService.completeSyncJob(syncJob.id, {
        activitiesFound,
        activitiesImported,
        activitiesSkipped,
        healthDaysFound,
        healthDaysImported,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { syncJob: await SyncJobService.failSyncJob(syncJob.id, message) };
  } finally {
    // Always clean up temp directory created by the Python script
    if (tmpDir != null) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
