import type { Weekday } from '@prisma/client';
import type { AthleteSettingsDto } from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import {
  mapAthleteProfile,
  mapTrainingAvailability,
  mapTrainingGoal,
  mapTrainingZoneSet,
} from '../mappers/mapAthlete.js';
import * as AthleteRepository from '../repositories/AthleteRepository.js';

const WEEKDAY_ORDER: Record<Weekday, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

export async function getAthleteSettings(): Promise<AthleteSettingsDto> {
  const profile = await AthleteRepository.findFirstAthleteProfile();

  if (!profile) {
    throw ApiError.notFound('Athlete profile not found');
  }

  const [goals, availability, zoneSets] = await Promise.all([
    AthleteRepository.findAthleteGoals(profile.id),
    AthleteRepository.findAthleteAvailability(profile.id),
    AthleteRepository.findAthleteZoneSets(profile.id),
  ]);

  const sortedAvailability = [...availability].sort(
    (a, b) => WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday],
  );

  return {
    athleteProfile: mapAthleteProfile(profile),
    goals: goals.map(mapTrainingGoal),
    availability: sortedAvailability.map(mapTrainingAvailability),
    trainingZoneSets: zoneSets.map(mapTrainingZoneSet),
  };
}
