import type { ActivitiesResponseDto, ActivityDetailDto, SportTypeDto } from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import { mapActivityDetail, mapActivitySummary } from '../mappers/mapActivity.js';
import { DTO_TO_PRISMA_SPORT_MAP } from '../mappers/enumMaps.js';
import * as ActivityRepository from '../repositories/ActivityRepository.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';

export type ActivityQueryFilters = {
  sport?: SportTypeDto;
  dateFrom?: string;
  dateTo?: string;
};

export async function getActivities(
  filters: ActivityQueryFilters = {},
): Promise<ActivitiesResponseDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    return { activities: [] };
  }

  let startTimeFrom: Date | undefined;
  let startTimeTo: Date | undefined;

  if (filters.dateFrom != null) {
    startTimeFrom = new Date(filters.dateFrom);
    if (isNaN(startTimeFrom.getTime())) {
      throw ApiError.badRequest('Invalid dateFrom — expected ISO 8601 date string');
    }
  }

  if (filters.dateTo != null) {
    startTimeTo = new Date(`${filters.dateTo}T23:59:59.999Z`);
    if (isNaN(startTimeTo.getTime())) {
      throw ApiError.badRequest('Invalid dateTo — expected ISO 8601 date string');
    }
  }

  const activities = await ActivityRepository.findActivities(profile.id, {
    sport: filters.sport != null ? DTO_TO_PRISMA_SPORT_MAP[filters.sport] : undefined,
    startTimeFrom,
    startTimeTo,
  });

  return { activities: activities.map(mapActivitySummary) };
}

export async function getActivityById(id: string): Promise<ActivityDetailDto> {
  const activity = await ActivityRepository.findActivityById(id);

  if (!activity) {
    throw ApiError.notFound('Activity not found');
  }

  return mapActivityDetail(activity);
}
