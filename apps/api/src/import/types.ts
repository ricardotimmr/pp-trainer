import type { DataSourceType, SwimStrokeType } from '@prisma/client';

export type ImportSourceType = Extract<
  DataSourceType,
  | 'ManualJsonImport'
  | 'ManualFitUpload'
  | 'ManualGpxUpload'
  | 'ManualTcxUpload'
  | 'ManualCsvImport'
  | 'GarminUnofficial'
  | 'Strava'
>;

export type ParsedLap = {
  lapNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  averagePaceSecPerKm?: number;
  averageSpeedKmh?: number;
  averagePowerWatts?: number;
  averageCadence?: number;
  elevationGainMeters?: number;
};

export type ParsedSwimLap = {
  lapNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  strokeType?: SwimStrokeType;
  strokeCount?: number;
  swolfScore?: number;
  averagePaceSecPer100m?: number;
  averageHeartRateBpm?: number;
};

export type ParsedStrengthSet = {
  setNumber: number;
  exerciseName?: string;
  exerciseCategory?: string;
  muscleGroup?: string;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  restSeconds?: number;
  notes?: string;
};

export type ParsedMetricSample = {
  offsetSeconds: number;
  heartRateBpm?: number;
  powerWatts?: number;
  paceSecPerKm?: number;
  swimPaceSecPer100m?: number;
  speedKmh?: number;
  cadenceRpm?: number;
  elevationMeters?: number;
  latitude?: number;
  longitude?: number;
};

export type ParsedTimeInZone = {
  zoneNumber: number;
  zoneName: string;
  durationSeconds: number;
  percentage: number;
};

export type ParsedActivity = {
  source: ImportSourceType;
  externalId?: string;
  sport: string;
  startTime: Date;
  durationSeconds: number;
  title?: string;
  notes?: string;
  distanceMeters?: number;
  elevationGainMeters?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePowerWatts?: number;
  normalizedPowerWatts?: number;
  averageCadence?: number;
  averageSpeedKmh?: number;
  calories?: number;
  perceivedExertion?: number;
  poolLengthMeters?: number;
  dominantStrokeType?: SwimStrokeType;
  totalStrokeCount?: number;
  totalSets?: number;
  totalReps?: number;
  laps?: ParsedLap[];
  swimLaps?: ParsedSwimLap[];
  strengthSets?: ParsedStrengthSet[];
  metricSamples?: ParsedMetricSample[];
  timeInZones?: ParsedTimeInZone[];
};

export type ImportPipelineContext = {
  athleteProfileId: string;
  importJobId: string;
  rawPayloadHash?: string;
  importedFileId?: string;
};

export type ImportPipelineResult =
  | { status: 'success'; importJobId: string; activityId: string }
  | { status: 'duplicate'; importJobId: string; activityId: string; reason: string }
  | { status: 'failed'; importJobId: string; errorMessage: string; warningMessages?: string[] };
