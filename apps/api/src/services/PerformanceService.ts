import type { PerformanceStatsDto } from '@pp-trainer/shared';

import { mapPerformanceSportMetric, mapRacePrediction } from '../mappers/mapPerformance.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';
import * as PerformanceRepository from '../repositories/PerformanceRepository.js';

export async function getPerformanceStats(): Promise<PerformanceStatsDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    return { sportMetrics: [], racePredictions: [] };
  }

  const [metrics, predictions] = await Promise.all([
    PerformanceRepository.findPerformanceMetrics(profile.id),
    PerformanceRepository.findRacePredictions(profile.id),
  ]);

  return {
    sportMetrics: metrics.map(mapPerformanceSportMetric),
    racePredictions: predictions.map(mapRacePrediction),
  };
}
