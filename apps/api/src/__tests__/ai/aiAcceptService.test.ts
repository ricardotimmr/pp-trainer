import { describe, expect, it } from 'vitest';

import { buildZoneLookup, resolveStepZoneFks } from '../../services/AiAcceptService.js';

describe('buildZoneLookup', () => {
  it('populates hr map from HeartRate zones', () => {
    const lookup = buildZoneLookup([{ id: 'hr-z2', name: 'Zone 2', zoneType: 'HeartRate' }]);
    expect(lookup.hr.get('zone 2')).toBe('hr-z2');
    expect(lookup.power.size).toBe(0);
    expect(lookup.pace.size).toBe(0);
  });

  it('populates power map from CyclingPower zones', () => {
    const lookup = buildZoneLookup([{ id: 'pw-z4', name: 'Zone 4', zoneType: 'CyclingPower' }]);
    expect(lookup.power.get('zone 4')).toBe('pw-z4');
    expect(lookup.hr.size).toBe(0);
    expect(lookup.pace.size).toBe(0);
  });

  it('populates pace map from RunningPace zones', () => {
    const lookup = buildZoneLookup([{ id: 'rp-z3', name: 'Zone 3', zoneType: 'RunningPace' }]);
    expect(lookup.pace.get('zone 3')).toBe('rp-z3');
  });

  it('populates pace map from SwimmingPace zones', () => {
    const lookup = buildZoneLookup([{ id: 'sp-z2', name: 'Zone 2', zoneType: 'SwimmingPace' }]);
    expect(lookup.pace.get('zone 2')).toBe('sp-z2');
  });

  it('normalizes zone names to lowercase and trims whitespace', () => {
    const lookup = buildZoneLookup([{ id: 'z1', name: '  Zone 2  ', zoneType: 'HeartRate' }]);
    expect(lookup.hr.get('zone 2')).toBe('z1');
  });

  it('returns empty maps when no zones provided', () => {
    const lookup = buildZoneLookup([]);
    expect(lookup.hr.size).toBe(0);
    expect(lookup.power.size).toBe(0);
    expect(lookup.pace.size).toBe(0);
  });

  it('ignores unknown zone types', () => {
    const lookup = buildZoneLookup([{ id: 'z1', name: 'Zone 1', zoneType: 'UnknownType' }]);
    expect(lookup.hr.size).toBe(0);
    expect(lookup.power.size).toBe(0);
    expect(lookup.pace.size).toBe(0);
  });

  it('handles multiple zones across types', () => {
    const lookup = buildZoneLookup([
      { id: 'hr-1', name: 'Zone 1', zoneType: 'HeartRate' },
      { id: 'hr-2', name: 'Zone 2', zoneType: 'HeartRate' },
      { id: 'pw-1', name: 'Zone 3', zoneType: 'CyclingPower' },
      { id: 'rp-1', name: 'Zone 2', zoneType: 'RunningPace' },
    ]);
    expect(lookup.hr.size).toBe(2);
    expect(lookup.power.size).toBe(1);
    expect(lookup.pace.size).toBe(1);
  });
});

describe('resolveStepZoneFks', () => {
  const lookup = buildZoneLookup([
    { id: 'hr-z2', name: 'Zone 2', zoneType: 'HeartRate' },
    { id: 'pw-z4', name: 'Zone 4', zoneType: 'CyclingPower' },
    { id: 'pace-z3', name: 'Zone 3', zoneType: 'RunningPace' },
  ]);

  it('resolves HR zone name to FK', () => {
    const fks = resolveStepZoneFks({ targetHeartRateZoneName: 'Zone 2' }, lookup);
    expect(fks.targetHeartRateZoneId).toBe('hr-z2');
    expect(fks.targetPowerZoneId).toBeUndefined();
    expect(fks.targetPaceZoneId).toBeUndefined();
  });

  it('resolves power zone name to FK', () => {
    const fks = resolveStepZoneFks({ targetPowerZoneName: 'Zone 4' }, lookup);
    expect(fks.targetPowerZoneId).toBe('pw-z4');
    expect(fks.targetHeartRateZoneId).toBeUndefined();
    expect(fks.targetPaceZoneId).toBeUndefined();
  });

  it('resolves pace zone name to FK', () => {
    const fks = resolveStepZoneFks({ targetPaceZoneName: 'Zone 3' }, lookup);
    expect(fks.targetPaceZoneId).toBe('pace-z3');
  });

  it('resolves all three FKs simultaneously', () => {
    const mixedLookup = buildZoneLookup([
      { id: 'hr-z2', name: 'Zone 2', zoneType: 'HeartRate' },
      { id: 'pw-z4', name: 'Zone 4', zoneType: 'CyclingPower' },
      { id: 'pace-z3', name: 'Zone 3', zoneType: 'RunningPace' },
    ]);
    const fks = resolveStepZoneFks(
      { targetHeartRateZoneName: 'Zone 2', targetPowerZoneName: 'Zone 4', targetPaceZoneName: 'Zone 3' },
      mixedLookup,
    );
    expect(fks.targetHeartRateZoneId).toBe('hr-z2');
    expect(fks.targetPowerZoneId).toBe('pw-z4');
    expect(fks.targetPaceZoneId).toBe('pace-z3');
  });

  it('returns no FK when zone name does not match', () => {
    const fks = resolveStepZoneFks({ targetHeartRateZoneName: 'Zone 99' }, lookup);
    expect(fks.targetHeartRateZoneId).toBeUndefined();
  });

  it('returns no FKs when step has no zone names', () => {
    const fks = resolveStepZoneFks({}, lookup);
    expect(fks.targetHeartRateZoneId).toBeUndefined();
    expect(fks.targetPowerZoneId).toBeUndefined();
    expect(fks.targetPaceZoneId).toBeUndefined();
  });

  it('returns no FKs with empty lookup (no zones configured)', () => {
    const emptyLookup = buildZoneLookup([]);
    const fks = resolveStepZoneFks(
      { targetHeartRateZoneName: 'Zone 2', targetPowerZoneName: 'Zone 4', targetPaceZoneName: 'Zone 3' },
      emptyLookup,
    );
    expect(fks.targetHeartRateZoneId).toBeUndefined();
    expect(fks.targetPowerZoneId).toBeUndefined();
    expect(fks.targetPaceZoneId).toBeUndefined();
  });

  it('matches case-insensitively', () => {
    const fks = resolveStepZoneFks({ targetHeartRateZoneName: 'ZONE 2' }, lookup);
    expect(fks.targetHeartRateZoneId).toBe('hr-z2');
  });

  it('matches after trimming whitespace', () => {
    const fks = resolveStepZoneFks({ targetPowerZoneName: '  Zone 4  ' }, lookup);
    expect(fks.targetPowerZoneId).toBe('pw-z4');
  });
});
