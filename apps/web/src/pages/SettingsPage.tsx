import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AthleteProfileDto,
  CreateZoneInput,
  CreateZoneSetInput,
  GoalPriorityDto,
  SportTypeDto,
  TrainingAvailabilityDto,
  TrainingGoalDto,
  TrainingZoneSetDto,
  TrainingZoneTypeDto,
  TrainingZoneUnitDto,
} from '@pp-trainer/shared';

import {
  deleteGoal,
  deleteZoneSet,
  createZone,
  createZoneSet,
  patchAthleteProfile,
  patchAvailabilityDay,
  updateGoal,
} from '../api/athleteApi';
import { EmptyState, SportBadge, ZoneBand, ZoneList } from '../components';
import { GoalFormModal } from '../components/GoalFormModal';
import { SelectMenu } from '../components/SelectMenu';
import { formatDuration, formatPace } from '../components/prototypeFormatters';
import { formatZonePaceShort } from '../components/zoneVisuals';
import { DATA_MODE } from '../config/dataMode';
import { useAthleteSettings } from '../hooks/useAthleteSettings';
import { PageShell } from '../layout/PageShell';

// ── prototype mock mode (kept for DATA_MODE=mock) ────────────────────────────

import {
  getActiveTrainingZoneSets,
  getActiveTrainingZoneSetsByType,
  getTrainingZonesBySetId,
} from '../mock/prototypeData.helpers';
import { goalPriorityLabels } from '../components/prototypeFormatters';
import { usePrototypeAthleteContext } from '../context/prototypeAthleteContextValue';
import type { GoalPriority, SportType, TrainingGoal } from '../mock/prototypeData.types';

// ── constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const ALL_SPORTS: SportTypeDto[] = ['cycling', 'running', 'swimming', 'strength', 'mobility', 'other'];
const SPORT_LABELS: Record<SportTypeDto, string> = {
  cycling: 'Cycling', running: 'Running', swimming: 'Swimming',
  strength: 'Strength', mobility: 'Mobility', other: 'Other',
};

const GOAL_PRIORITY_OPTIONS: GoalPriorityDto[] = ['main_goal', 'secondary_goal', 'watchlist'];
const GOAL_PRIORITY_LABELS: Record<GoalPriorityDto, string> = {
  main_goal: 'Main goal',
  secondary_goal: 'Secondary goal',
  watchlist: 'Watchlist',
};
const GOAL_PRIORITY_DESCRIPTIONS: Record<GoalPriorityDto, string> = {
  main_goal: 'Primary training target for the coach.',
  secondary_goal: 'Included in planning when it fits the main goal.',
  watchlist: 'Tracked on the side without dedicated training.',
};

const ZONE_TYPE_LABELS: Record<TrainingZoneTypeDto, string> = {
  heart_rate: 'Heart Rate',
  cycling_power: 'Cycling Power',
  running_pace: 'Running Pace',
  swimming_pace: 'Swimming Pace',
  perceived_effort: 'Perceived Effort',
};
const ZONE_TYPE_OPTIONS = [
  { value: 'heart_rate', label: 'Heart Rate' },
  { value: 'cycling_power', label: 'Cycling Power' },
  { value: 'running_pace', label: 'Running Pace' },
  { value: 'swimming_pace', label: 'Swimming Pace' },
  { value: 'perceived_effort', label: 'Perceived Effort' },
] as const;
const ZONE_UNIT_OPTIONS = [
  { value: 'bpm', label: 'BPM' },
  { value: 'watts', label: 'Watts' },
  { value: 'sec_per_km', label: 'Pace /km' },
  { value: 'sec_per_100m', label: 'Pace /100m' },
  { value: 'rpe', label: 'RPE' },
] as const;
const SPORT_SELECT_OPTIONS = [
  { value: '', label: 'No specific sport' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'running', label: 'Running' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'other', label: 'Other' },
] as const;

const DURATION_OPTIONS = [
  { value: '', label: 'Off' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 h' },
  { value: '75', label: '1 h 15 min' },
  { value: '90', label: '1 h 30 min' },
  { value: '105', label: '1 h 45 min' },
  { value: '120', label: '2 h' },
  { value: '135', label: '2 h 15 min' },
  { value: '150', label: '2 h 30 min' },
  { value: '165', label: '2 h 45 min' },
  { value: '180', label: '3 h' },
  { value: 'open', label: 'Open end' },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function formatGoalDate(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}

function getGoalMetric(goal: TrainingGoalDto): string | undefined {
  if (goal.targetDurationSeconds) return formatDuration(goal.targetDurationSeconds);
  if (goal.targetPaceSecPerKm) return formatPace(goal.targetPaceSecPerKm) ?? undefined;
  if (goal.targetPowerWatts) return `${goal.targetPowerWatts} W`;
  if (goal.targetSwimPaceSecPer100m) return `${formatZonePaceShort(goal.targetSwimPaceSecPer100m)} /100m`;
  return undefined;
}

function buildAvailMap(availability: TrainingAvailabilityDto[]): Record<string, TrainingAvailabilityDto> {
  const map: Record<string, TrainingAvailabilityDto> = {};
  for (const a of availability) map[a.weekday] = a;
  for (const day of WEEKDAYS) {
    if (!map[day]) map[day] = { weekday: day, available: false, preferredSports: [] };
  }
  return map;
}

function durationToOption(mins?: number | null): string {
  if (mins == null) return 'open';
  if (mins === 0) return '';
  return String(mins);
}

function optionToDuration(val: string): number | null | undefined {
  if (val === '' || val === 'off') return undefined;
  if (val === 'open') return null;
  return parseInt(val, 10);
}

// ── main export ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  if (DATA_MODE === 'api') return <SettingsPageApiMode />;
  return <SettingsPageMockMode />;
}

// ── API mode ──────────────────────────────────────────────────────────────────

function SettingsPageApiMode() {
  const state = useAthleteSettings();

  if (state.status === 'loading') {
    return (
      <PageShell title="Settings" eyebrow="Athlete context · Configuration">
        <div className="settings-page"><p className="settings-loading">Loading settings…</p></div>
      </PageShell>
    );
  }

  if (state.status === 'error') {
    return (
      <PageShell title="Settings" eyebrow="Athlete context · Configuration">
        <div className="settings-page">
          <p className="settings-error">Failed to load settings. Please refresh the page.</p>
        </div>
      </PageShell>
    );
  }

  const { data, refresh } = state;

  return (
    <PageShell title="Settings" eyebrow="Athlete context · Configuration">
      <div className="settings-page">
        <ProfileSection profile={data.athleteProfile} refresh={refresh} />
        <PlanningSection goals={data.goals} availability={data.availability} refresh={refresh} />
        <ZonesSection zoneSets={data.trainingZoneSets} refresh={refresh} />
      </div>
    </PageShell>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection({
  profile,
  refresh,
}: {
  profile: AthleteProfileDto;
  refresh: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(() => profileToDraft(profile));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sportSaving, setSportSaving] = useState(false);

  function profileToDraft(p: AthleteProfileDto) {
    return {
      displayName: p.displayName,
      birthYear: p.birthYear ? String(p.birthYear) : '',
      bodyWeightKg: p.bodyWeightKg ? String(p.bodyWeightKg) : '',
      heightCm: p.heightCm ? String(p.heightCm) : '',
      ftpWatts: p.thresholds.currentFtpWatts ? String(p.thresholds.currentFtpWatts) : '',
      maxHr: p.thresholds.maxHeartRateBpm ? String(p.thresholds.maxHeartRateBpm) : '',
      restingHr: p.thresholds.restingHeartRateBpm ? String(p.thresholds.restingHeartRateBpm) : '',
      runPace: p.thresholds.runningThresholdPaceSecPerKm
        ? formatZonePaceShort(p.thresholds.runningThresholdPaceSecPerKm)
        : '',
      swimPace: p.thresholds.swimmingThresholdPaceSecPer100m
        ? formatZonePaceShort(p.thresholds.swimmingThresholdPaceSecPer100m)
        : '',
    };
  }

  function parsePaceSecs(val: string): number | undefined {
    const m = /^(\d+):(\d{2})$/.exec(val.trim());
    if (!m) return undefined;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function setField(key: keyof typeof draft) {
    return (val: string) => {
      setDraft((d) => ({ ...d, [key]: val }));
      setDirty(true);
    };
  }

  function handleEditClick() {
    setDraft(profileToDraft(profile));
    setDirty(false);
    setSaveError(null);
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    setDirty(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await patchAthleteProfile({
        displayName: draft.displayName || undefined,
        birthYear: draft.birthYear ? parseInt(draft.birthYear, 10) : undefined,
        bodyWeightKg: draft.bodyWeightKg ? parseFloat(draft.bodyWeightKg) : undefined,
        heightCm: draft.heightCm ? parseInt(draft.heightCm, 10) : undefined,
        thresholds: {
          currentFtpWatts: draft.ftpWatts ? parseInt(draft.ftpWatts, 10) : undefined,
          maxHeartRateBpm: draft.maxHr ? parseInt(draft.maxHr, 10) : undefined,
          restingHeartRateBpm: draft.restingHr ? parseInt(draft.restingHr, 10) : undefined,
          runningThresholdPaceSecPerKm: draft.runPace ? parsePaceSecs(draft.runPace) : undefined,
          swimmingThresholdPaceSecPer100m: draft.swimPace ? parsePaceSecs(draft.swimPace) : undefined,
        },
      });
      setEditMode(false);
      setDirty(false);
      refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSport(sport: SportTypeDto) {
    setSportSaving(true);
    const current = profile.primarySports;
    const updated = current.includes(sport)
      ? current.filter((s) => s !== sport)
      : [...current, sport];
    try {
      await patchAthleteProfile({ primarySports: updated });
      refresh();
    } catch {
      // ignore
    } finally {
      setSportSaving(false);
    }
  }

  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : undefined;
  const t = profile.thresholds;

  return (
    <section className="settings-section settings-section--context">
      <header className="settings-section-head">
        <div>
          <p>Athlete context</p>
          <h2>Profile and performance baselines</h2>
        </div>
        <div className="settings-profile-head-actions">
          {editMode ? (
            <>
              <button
                type="button"
                className="button--secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button--primary"
                onClick={() => void handleSave()}
                disabled={saving || !dirty}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button type="button" className="button--secondary" onClick={handleEditClick}>
              Edit profile
            </button>
          )}
        </div>
      </header>

      <div className="settings-context-grid">
        <div className="settings-identity">
          <p className="settings-identity__eyebrow">Single athlete profile</p>
          <h3>{profile.displayName}</h3>
          <div className="settings-sports">
            {ALL_SPORTS.map((sport) => (
              <button
                key={sport}
                type="button"
                className={[
                  'settings-sport-toggle',
                  profile.primarySports.includes(sport) ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={profile.primarySports.includes(sport)}
                disabled={sportSaving}
                onClick={() => void handleToggleSport(sport)}
              >
                <SportBadge sport={sport} />
                <span aria-hidden="true">{profile.primarySports.includes(sport) ? '×' : '+'}</span>
              </button>
            ))}
          </div>
          {profile.notes && <p className="settings-notes">{profile.notes}</p>}
        </div>

        {editMode ? (
          <div className="settings-profile-edit">
            {saveError && <p className="settings-profile-edit__error">{saveError}</p>}
            <div className="settings-profile-edit__grid">
              <label>
                <span>Name</span>
                <input className="cw-input" value={draft.displayName} onChange={(e) => setField('displayName')(e.target.value)} />
              </label>
              <label>
                <span>Birth year</span>
                <input className="cw-input" type="number" placeholder="e.g. 1998" value={draft.birthYear} onChange={(e) => setField('birthYear')(e.target.value)} />
              </label>
              <label>
                <span>Weight (kg)</span>
                <input className="cw-input" type="number" step="0.1" placeholder="e.g. 76" value={draft.bodyWeightKg} onChange={(e) => setField('bodyWeightKg')(e.target.value)} />
              </label>
              <label>
                <span>Height (cm)</span>
                <input className="cw-input" type="number" placeholder="e.g. 181" value={draft.heightCm} onChange={(e) => setField('heightCm')(e.target.value)} />
              </label>
              <label>
                <span>Bike FTP (W)</span>
                <input className="cw-input" type="number" placeholder="e.g. 285" value={draft.ftpWatts} onChange={(e) => setField('ftpWatts')(e.target.value)} />
              </label>
              <label>
                <span>Max HR (bpm)</span>
                <input className="cw-input" type="number" placeholder="e.g. 194" value={draft.maxHr} onChange={(e) => setField('maxHr')(e.target.value)} />
              </label>
              <label>
                <span>Resting HR (bpm)</span>
                <input className="cw-input" type="number" placeholder="e.g. 47" value={draft.restingHr} onChange={(e) => setField('restingHr')(e.target.value)} />
              </label>
              <label>
                <span>Run threshold (mm:ss /km)</span>
                <input className="cw-input" placeholder="e.g. 4:18" value={draft.runPace} onChange={(e) => setField('runPace')(e.target.value)} />
              </label>
              <label>
                <span>Swim threshold (mm:ss /100m)</span>
                <input className="cw-input" placeholder="e.g. 1:45" value={draft.swimPace} onChange={(e) => setField('swimPace')(e.target.value)} />
              </label>
            </div>
          </div>
        ) : (
          <dl className="settings-metric-strip">
            {age !== undefined && (
              <div><dt>Age</dt><dd>{age} yrs</dd></div>
            )}
            {profile.bodyWeightKg !== undefined && (
              <div><dt>Weight</dt><dd>{profile.bodyWeightKg} kg</dd></div>
            )}
            {profile.heightCm !== undefined && (
              <div><dt>Height</dt><dd>{profile.heightCm} cm</dd></div>
            )}
            {t.currentFtpWatts !== undefined && (
              <div className="is-accent"><dt>Bike FTP</dt><dd>{t.currentFtpWatts} W</dd></div>
            )}
            {t.maxHeartRateBpm !== undefined && (
              <div><dt>Max HR</dt><dd>{t.maxHeartRateBpm} bpm</dd></div>
            )}
            {t.restingHeartRateBpm !== undefined && (
              <div><dt>Resting HR</dt><dd>{t.restingHeartRateBpm} bpm</dd></div>
            )}
            {t.runningThresholdPaceSecPerKm !== undefined && (
              <div><dt>Run threshold</dt><dd>{formatPace(t.runningThresholdPaceSecPerKm)}</dd></div>
            )}
            {t.swimmingThresholdPaceSecPer100m !== undefined && (
              <div><dt>Swim threshold</dt><dd>{formatZonePaceShort(t.swimmingThresholdPaceSecPer100m)} /100m</dd></div>
            )}
            {!t.currentFtpWatts && !t.maxHeartRateBpm && !t.restingHeartRateBpm && !t.runningThresholdPaceSecPerKm && !t.swimmingThresholdPaceSecPer100m && (
              <div><dt>Thresholds</dt><dd>No threshold baselines set — click "Edit profile" to add them.</dd></div>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}

// ── Planning section (goals + availability) ───────────────────────────────────

function PlanningSection({
  goals,
  availability,
  refresh,
}: {
  goals: TrainingGoalDto[];
  availability: TrainingAvailabilityDto[];
  refresh: () => void;
}) {
  const [openGoalMenu, setOpenGoalMenu] = useState(false);
  const [openPriorityMenu, setOpenPriorityMenu] = useState<string | null>(null);
  const [openSportsMenu, setOpenSportsMenu] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState<
    null | { mode: 'create' } | { mode: 'edit'; goal: TrainingGoalDto }
  >(null);
  const [availMap, setAvailMap] = useState(() => buildAvailMap(availability));

  const addGoalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const priorityTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const sportsTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Sync availability when data changes from refresh
  useEffect(() => {
    setAvailMap(buildAvailMap(availability));
  }, [availability]);

  const focusMenuTrigger = useCallback((trigger?: HTMLButtonElement | null) => {
    window.requestAnimationFrame(() => { trigger?.focus(); });
  }, []);

  const closeMenus = useCallback((restoreFocus = false) => {
    setOpenGoalMenu(false);
    setOpenPriorityMenu(null);
    setOpenSportsMenu(null);
    if (restoreFocus) focusMenuTrigger(lastMenuTriggerRef.current);
  }, [focusMenuTrigger]);

  useEffect(() => {
    const closeOnOutside = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-settings-menu-root]')) return;
      closeMenus(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [closeMenus]);

  useEffect(() => {
    const hasOpen = openGoalMenu || openPriorityMenu || openSportsMenu;
    if (!hasOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeMenus(true); }
    };
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-settings-menu-root]')) return;
      closeMenus(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
    };
  }, [closeMenus, openGoalMenu, openPriorityMenu, openSportsMenu]);

  async function handleDeleteGoal(id: string) {
    try {
      await deleteGoal(id);
      refresh();
    } catch { /* ignore */ }
  }

  async function handleChangePriority(goalId: string, priority: GoalPriorityDto) {
    try {
      await updateGoal(goalId, { priority });
      closeMenus(false);
      focusMenuTrigger(priorityTriggerRefs.current.get(goalId));
      refresh();
    } catch { /* ignore */ }
  }

  // Availability interactions — optimistic local state
  async function handleToggleDay(weekday: string) {
    const current = availMap[weekday];
    const newAvailable = !current.available;
    setAvailMap((m) => ({ ...m, [weekday]: { ...current, available: newAvailable } }));
    try {
      await patchAvailabilityDay(weekday, { available: newAvailable });
    } catch {
      setAvailMap((m) => ({ ...m, [weekday]: current }));
    }
  }

  async function handleDurationChange(weekday: string, val: string) {
    const current = availMap[weekday];
    const maxDurationMinutes = optionToDuration(val);
    setAvailMap((m) => ({
      ...m,
      [weekday]: { ...current, maxDurationMinutes: maxDurationMinutes ?? undefined },
    }));
    try {
      await patchAvailabilityDay(weekday, { maxDurationMinutes });
    } catch {
      setAvailMap((m) => ({ ...m, [weekday]: current }));
    }
  }

  async function handleRemoveSport(weekday: string, sport: SportTypeDto) {
    const current = availMap[weekday];
    const updated = (current.preferredSports ?? []).filter((s) => s !== sport);
    setAvailMap((m) => ({ ...m, [weekday]: { ...current, preferredSports: updated } }));
    try {
      await patchAvailabilityDay(weekday, { preferredSports: updated });
    } catch {
      setAvailMap((m) => ({ ...m, [weekday]: current }));
    }
  }

  async function handleAddSport(weekday: string, sport: SportTypeDto) {
    const current = availMap[weekday];
    if ((current.preferredSports ?? []).includes(sport)) return;
    const updated = [...(current.preferredSports ?? []), sport];
    setAvailMap((m) => ({ ...m, [weekday]: { ...current, preferredSports: updated } }));
    closeMenus(false);
    try {
      await patchAvailabilityDay(weekday, { preferredSports: updated });
    } catch {
      setAvailMap((m) => ({ ...m, [weekday]: current }));
    }
  }

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <div>
          <p>Planning context</p>
          <h2>Goals and training availability</h2>
        </div>
      </header>

      <div className="settings-planning-grid">
        {/* ── Active goals ── */}
        <div className="settings-goal">
          <div className="settings-goal__head">
            <p className="settings-section__label">Active goals</p>
            <div className="settings-goal-actions" data-settings-menu-root>
              <span>{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
              <button
                type="button"
                ref={addGoalTriggerRef}
                className={['settings-goal-add', openGoalMenu ? 'is-open' : ''].filter(Boolean).join(' ')}
                aria-label="Add goal"
                aria-expanded={openGoalMenu}
                aria-haspopup="menu"
                onClick={(e) => {
                  lastMenuTriggerRef.current = e.currentTarget;
                  setOpenPriorityMenu(null);
                  setOpenSportsMenu(null);
                  setOpenGoalMenu((v) => !v);
                }}
              >
                +
              </button>
              <div
                className={['settings-goal-menu', openGoalMenu ? 'is-open' : ''].filter(Boolean).join(' ')}
                role="menu"
                aria-hidden={!openGoalMenu}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenus(false);
                    setGoalModal({ mode: 'create' });
                  }}
                >
                  <span>Add new goal</span>
                  <small>Create a training goal</small>
                </button>
              </div>
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="settings-goal-list">
              {[...goals]
                .sort((a, b) => {
                  const order: Record<GoalPriorityDto, number> = { main_goal: 0, secondary_goal: 1, watchlist: 2 };
                  return order[a.priority] - order[b.priority];
                })
                .map((goal) => {
                  const goalMetric = getGoalMetric(goal);
                  return (
                    <article key={goal.id} className="settings-goal-card">
                      <div className="settings-goal-card__main">
                        <div className="settings-goal-card__meta">
                          {goal.sport && <SportBadge sport={goal.sport} />}
                          {goal.targetDate && <span>{formatGoalDate(goal.targetDate)}</span>}
                          <button
                            type="button"
                            className="settings-goal-edit"
                            aria-label={`Edit ${goal.title}`}
                            onClick={() => setGoalModal({ mode: 'edit', goal })}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="settings-goal-remove"
                            aria-label={`Delete ${goal.title}`}
                            onClick={() => void handleDeleteGoal(goal.id)}
                          >
                            −
                          </button>
                        </div>
                        <h3>{goal.title}</h3>
                        {goal.description && <p>{goal.description}</p>}
                      </div>
                      <div className="settings-goal-card__side">
                        <div className="settings-goal-priority" data-settings-menu-root>
                          <span>Priority</span>
                          <button
                            type="button"
                            ref={(el) => {
                              if (el) priorityTriggerRefs.current.set(goal.id, el);
                              else priorityTriggerRefs.current.delete(goal.id);
                            }}
                            className={['settings-goal-priority__trigger', openPriorityMenu === goal.id ? 'is-open' : ''].filter(Boolean).join(' ')}
                            aria-expanded={openPriorityMenu === goal.id}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              lastMenuTriggerRef.current = e.currentTarget;
                              setOpenGoalMenu(false);
                              setOpenSportsMenu(null);
                              setOpenPriorityMenu((v) => v === goal.id ? null : goal.id);
                            }}
                          >
                            {GOAL_PRIORITY_LABELS[goal.priority]}
                          </button>
                          <div
                            className={['settings-goal-priority__menu', openPriorityMenu === goal.id ? 'is-open' : ''].filter(Boolean).join(' ')}
                            role="menu"
                            aria-hidden={openPriorityMenu !== goal.id}
                          >
                            {GOAL_PRIORITY_OPTIONS.map((option) => (
                              <button
                                key={option}
                                type="button"
                                role="menuitem"
                                className={option === goal.priority ? 'is-selected' : ''}
                                onClick={() => void handleChangePriority(goal.id, option)}
                              >
                                <span>{GOAL_PRIORITY_LABELS[option]}</span>
                                <small>{GOAL_PRIORITY_DESCRIPTIONS[option]}</small>
                              </button>
                            ))}
                          </div>
                        </div>
                        <p>{GOAL_PRIORITY_DESCRIPTIONS[goal.priority]}</p>
                        <dl>
                          {goal.targetDistanceMeters !== undefined && (
                            <div>
                              <dt>Distance</dt>
                              <dd>{(goal.targetDistanceMeters / 1000).toFixed(1)} km</dd>
                            </div>
                          )}
                          {goalMetric && (
                            <div><dt>Target</dt><dd>{goalMetric}</dd></div>
                          )}
                        </dl>
                      </div>
                    </article>
                  );
                })}
            </div>
          ) : (
            <EmptyState title="No goals yet — click + to add one" variant="inline" />
          )}
        </div>

        {/* ── Training availability ── */}
        <div className="settings-availability-panel">
          <div className="settings-availability-head">
            <p className="settings-section__label">Training availability</p>
            <span>Preferred sports</span>
          </div>
          <ul className="settings-availability">
            {WEEKDAYS.map((day) => {
              const avail = availMap[day];
              const durationVal = avail.available
                ? durationToOption(avail.maxDurationMinutes)
                : '';
              const sports = avail.preferredSports ?? [];

              return (
                <li key={day} className="settings-availability__day">
                  <button
                    type="button"
                    className={['settings-availability__toggle', avail.available ? 'is-on' : ''].filter(Boolean).join(' ')}
                    role="switch"
                    aria-checked={avail.available}
                    aria-label={`${WEEKDAY_SHORT[day]} ${avail.available ? 'available' : 'unavailable'}`}
                    onClick={() => void handleToggleDay(day)}
                  />
                  <span className="settings-availability__weekday">{WEEKDAY_SHORT[day]}</span>
                  {avail.available ? (
                    <SelectMenu
                      value={durationVal}
                      options={DURATION_OPTIONS.filter((o) => o.value !== '')}
                      onChange={(val) => void handleDurationChange(day, val)}
                      className="settings-availability__duration-select"
                      aria-label={`Training duration for ${WEEKDAY_SHORT[day]}`}
                    />
                  ) : (
                    <span className="settings-availability__duration">Rest day</span>
                  )}
                  <div className="settings-availability__sports-field" data-settings-menu-root>
                    <span className="settings-availability__sports" aria-label="Preferred sports">
                      {sports.length > 0
                        ? sports.map((sport) => (
                            <button
                              key={sport}
                              type="button"
                              className="settings-availability__sport-remove"
                              aria-label={`Remove ${sport}`}
                              title={`Remove ${SPORT_LABELS[sport]}`}
                              onClick={() => void handleRemoveSport(day, sport)}
                            >
                              <SportBadge sport={sport} />
                            </button>
                          ))
                        : <em>None</em>}
                    </span>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) sportsTriggerRefs.current.set(day, el);
                        else sportsTriggerRefs.current.delete(day);
                      }}
                      className={['settings-availability__add', openSportsMenu === day ? 'is-open' : ''].filter(Boolean).join(' ')}
                      aria-label={`Add preferred sport for ${WEEKDAY_SHORT[day]}`}
                      aria-expanded={openSportsMenu === day}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        lastMenuTriggerRef.current = e.currentTarget;
                        setOpenGoalMenu(false);
                        setOpenPriorityMenu(null);
                        setOpenSportsMenu((v) => v === day ? null : day);
                      }}
                    >
                      +
                    </button>
                    <div
                      className={['settings-availability__menu', openSportsMenu === day ? 'is-open' : ''].filter(Boolean).join(' ')}
                      role="menu"
                      aria-hidden={openSportsMenu !== day}
                    >
                      {ALL_SPORTS.filter((s) => !sports.includes(s)).map((sport) => (
                        <button
                          key={sport}
                          type="button"
                          role="menuitem"
                          onClick={() => void handleAddSport(day, sport)}
                        >
                          <SportBadge sport={sport} />
                        </button>
                      ))}
                      {ALL_SPORTS.every((s) => sports.includes(s)) && (
                        <span className="settings-availability__menu-empty">All sports added</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Goal modal */}
      {goalModal && (
        goalModal.mode === 'create'
          ? (
            <GoalFormModal
              mode="create"
              onSave={() => { setGoalModal(null); refresh(); }}
              onClose={() => setGoalModal(null)}
            />
          )
          : (
            <GoalFormModal
              mode="edit"
              goal={goalModal.goal}
              onSave={() => { setGoalModal(null); refresh(); }}
              onClose={() => setGoalModal(null)}
            />
          )
      )}
    </section>
  );
}

// ── Zones section ─────────────────────────────────────────────────────────────

function ZonesSection({
  zoneSets,
  refresh,
}: {
  zoneSets: TrainingZoneSetDto[];
  refresh: () => void;
}) {
  const [hrSport, setHrSport] = useState<'cycling' | 'running'>('cycling');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDraft, setAddDraft] = useState<Partial<CreateZoneSetInput>>({ zoneType: 'heart_rate', name: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const hrZoneSets = zoneSets.filter((zs) => zs.zoneType === 'heart_rate');
  const otherZoneSets = zoneSets.filter((zs) => zs.zoneType !== 'heart_rate');
  const activeHrZoneSet = hrZoneSets.find((zs) => zs.sport === hrSport) ?? hrZoneSets[0];

  async function handleDeleteZoneSet(id: string) {
    try { await deleteZoneSet(id); refresh(); } catch { /* ignore */ }
  }

  async function handleAddZoneSet() {
    if (!addDraft.name?.trim() || !addDraft.zoneType) {
      setAddError('Name and zone type are required.');
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      await createZoneSet({
        name: addDraft.name.trim(),
        zoneType: addDraft.zoneType,
        sport: addDraft.sport || undefined,
        basedOn: addDraft.basedOn || undefined,
      });
      setShowAddForm(false);
      setAddDraft({ zoneType: 'heart_rate', name: '' });
      refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create zone set');
    } finally {
      setAddSaving(false);
    }
  }

  function renderZoneSet(zoneSet: TrainingZoneSetDto) {
    return (
      <ZoneSetCard key={zoneSet.id} zoneSet={zoneSet} refresh={refresh} onDelete={() => void handleDeleteZoneSet(zoneSet.id)} />
    );
  }

  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <div>
          <p>Training zones</p>
          <h2>Intensity model</h2>
        </div>
        <button
          type="button"
          className="button--secondary"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? 'Cancel' : 'Add zone set'}
        </button>
      </header>

      <div className="settings-zones-grid">
        {hrZoneSets.length > 0 && (
          <section className="settings-zone-card">
            <div className="settings-zone-card__top">
              <p className="settings-section__label">Heart Rate Zones</p>
              {hrZoneSets.length > 1 && (
                <div className="segmented-control settings-zone-toggle" role="tablist" aria-label="HR zone sport">
                  <span
                    className="segmented-control__indicator"
                    aria-hidden="true"
                    style={{ left: hrSport === 'cycling' ? '0%' : '50%', width: '50%' }}
                  />
                  <button type="button" role="tab" aria-selected={hrSport === 'cycling'} className={`segmented-control__tab${hrSport === 'cycling' ? ' is-active' : ''}`} onClick={() => setHrSport('cycling')}>Cycling</button>
                  <button type="button" role="tab" aria-selected={hrSport === 'running'} className={`segmented-control__tab${hrSport === 'running' ? ' is-active' : ''}`} onClick={() => setHrSport('running')}>Running</button>
                </div>
              )}
              {activeHrZoneSet && (
                <button
                  type="button"
                  className="settings-zone-delete"
                  aria-label={`Delete ${activeHrZoneSet.name}`}
                  onClick={() => void handleDeleteZoneSet(activeHrZoneSet.id)}
                >
                  ×
                </button>
              )}
            </div>
            {activeHrZoneSet?.basedOn && <p className="settings-zone-basis">{activeHrZoneSet.basedOn}</p>}
            {activeHrZoneSet && (
              <>
                <ZoneBand zones={activeHrZoneSet.zones as never} className="settings-zone-band" />
                <ZoneList zones={activeHrZoneSet.zones as never} className="zone-table" rowClassName="zone-row" dotClassName="zone-row__dot" numberClassName="zone-row__num" nameClassName="zone-row__name" rangeClassName="zone-row__range" />
              </>
            )}
            {hrZoneSets.map((zs) => (
              <ZoneAddRow key={zs.id} zoneSet={zs} refresh={refresh} />
            ))}
          </section>
        )}

        {otherZoneSets.map(renderZoneSet)}
      </div>

      {showAddForm && (
        <div className="settings-zone-set-form">
          <h3>New zone set</h3>
          <div className="settings-zone-set-form__fields">
            <label>
              <span>Name *</span>
              <input
                className="cw-input"
                placeholder="e.g. FTP Power Zones"
                value={addDraft.name ?? ''}
                onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label>
              <span>Zone type *</span>
              <SelectMenu
                value={addDraft.zoneType ?? 'heart_rate'}
                options={ZONE_TYPE_OPTIONS}
                onChange={(v) => setAddDraft((d) => ({ ...d, zoneType: v as TrainingZoneTypeDto }))}
                aria-label="Zone type"
              />
            </label>
            <label>
              <span>Sport</span>
              <SelectMenu
                value={addDraft.sport ?? ''}
                options={SPORT_SELECT_OPTIONS}
                onChange={(v) => setAddDraft((d) => ({ ...d, sport: (v || undefined) as SportTypeDto | undefined }))}
                aria-label="Sport"
              />
            </label>
            <label>
              <span>Based on</span>
              <input
                className="cw-input"
                placeholder="e.g. Max heart rate 194 bpm"
                value={addDraft.basedOn ?? ''}
                onChange={(e) => setAddDraft((d) => ({ ...d, basedOn: e.target.value }))}
              />
            </label>
          </div>
          {addError && <p className="settings-zone-set-form__error">{addError}</p>}
          <div className="settings-zone-set-form__actions">
            <button type="button" className="button--secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="button" className="button--primary" disabled={addSaving} onClick={() => void handleAddZoneSet()}>
              {addSaving ? 'Creating…' : 'Create zone set'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ── ZoneSetCard (non-HR zone sets) ────────────────────────────────────────────

function ZoneSetCard({
  zoneSet,
  refresh,
  onDelete,
}: {
  zoneSet: TrainingZoneSetDto;
  refresh: () => void;
  onDelete: () => void;
}) {
  const { zones } = zoneSet;
  if (zones.length === 0) return null;

  return (
    <section className="settings-zone-card">
      <div className="settings-zone-card__top">
        <p className="settings-section__label">{zoneSet.name}</p>
        <span className="settings-zone-type-label">{ZONE_TYPE_LABELS[zoneSet.zoneType]}</span>
        <button type="button" className="settings-zone-delete" aria-label={`Delete ${zoneSet.name}`} onClick={onDelete}>×</button>
      </div>
      {zoneSet.basedOn && <p className="settings-zone-basis">{zoneSet.basedOn}</p>}
      <ZoneBand zones={zones as never} className="settings-zone-band" />
      <ZoneList zones={zones as never} className="zone-table" rowClassName="zone-row" dotClassName="zone-row__dot" numberClassName="zone-row__num" nameClassName="zone-row__name" rangeClassName="zone-row__range" />
      <ZoneAddRow zoneSet={zoneSet} refresh={refresh} />
    </section>
  );
}

// ── ZoneAddRow — inline zone creation ─────────────────────────────────────────

function ZoneAddRow({ zoneSet, refresh }: { zoneSet: TrainingZoneSetDto; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<CreateZoneInput>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultUnit: TrainingZoneUnitDto =
    zoneSet.zoneType === 'heart_rate' ? 'bpm'
      : zoneSet.zoneType === 'cycling_power' ? 'watts'
      : zoneSet.zoneType === 'running_pace' ? 'sec_per_km'
      : zoneSet.zoneType === 'swimming_pace' ? 'sec_per_100m'
      : 'rpe';

  async function handleCreate() {
    if (!draft.name?.trim() || !draft.zoneNumber) {
      setError('Zone number and name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createZone(zoneSet.id, {
        zoneNumber: draft.zoneNumber,
        name: draft.name.trim(),
        lowerBound: draft.lowerBound,
        upperBound: draft.upperBound,
        unit: draft.unit ?? defaultUnit,
        description: draft.description || undefined,
      });
      setDraft({});
      setOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create zone');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="settings-zone-add-btn" onClick={() => setOpen(true)}>
        + Add zone
      </button>
    );
  }

  return (
    <div className="settings-zone-inline-form">
      <div className="settings-zone-inline-form__fields">
        <input
          className="cw-input settings-zone-inline-form__num"
          type="number"
          placeholder="#"
          min="1"
          value={draft.zoneNumber ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, zoneNumber: parseInt(e.target.value, 10) || undefined }))}
        />
        <input
          className="cw-input"
          placeholder="Zone name"
          value={draft.name ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
        <input
          className="cw-input settings-zone-inline-form__bound"
          type="number"
          placeholder="From"
          value={draft.lowerBound ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, lowerBound: parseFloat(e.target.value) || undefined }))}
        />
        <input
          className="cw-input settings-zone-inline-form__bound"
          type="number"
          placeholder="To"
          value={draft.upperBound ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, upperBound: parseFloat(e.target.value) || undefined }))}
        />
        <SelectMenu
          value={draft.unit ?? defaultUnit}
          options={ZONE_UNIT_OPTIONS}
          onChange={(v) => setDraft((d) => ({ ...d, unit: v as TrainingZoneUnitDto }))}
          aria-label="Unit"
        />
      </div>
      {error && <p className="settings-zone-inline-form__error">{error}</p>}
      <div className="settings-zone-inline-form__actions">
        <button type="button" className="button--secondary" onClick={() => { setOpen(false); setDraft({}); }}>Cancel</button>
        <button type="button" className="button--primary" disabled={saving} onClick={() => void handleCreate()}>
          {saving ? 'Adding…' : 'Add zone'}
        </button>
      </div>
    </div>
  );
}

// ── Mock mode (prototype, kept until P8-003) ──────────────────────────────────

function SettingsPageMockMode() {
  const {
    activeGoals,
    addActiveGoal,
    allGoals,
    availableSports,
    focusedSports,
    profile,
    removeActiveGoal,
    setGoalPriority,
    toggleFocusedSport,
    visibleGoalIds,
  } = usePrototypeAthleteContext();
  const [hrSport, setHrSport] = useState<'cycling' | 'running'>('cycling');
  const [openSportsMenu, setOpenSportsMenu] = useState<string | null>(null);
  const [openGoalMenu, setOpenGoalMenu] = useState(false);
  const [openPriorityMenu, setOpenPriorityMenu] = useState<string | null>(null);
  const addGoalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const priorityTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const sportsTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const focusMenuTrigger = useCallback((trigger?: HTMLButtonElement | null) => {
    window.requestAnimationFrame(() => { trigger?.focus(); });
  }, []);

  const closeSettingsMenus = useCallback((restoreFocus = false) => {
    setOpenGoalMenu(false);
    setOpenPriorityMenu(null);
    setOpenSportsMenu(null);
    if (restoreFocus) focusMenuTrigger(lastMenuTriggerRef.current);
  }, [focusMenuTrigger]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-settings-menu-root]')) return;
      closeSettingsMenus(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [closeSettingsMenus]);

  useEffect(() => {
    const hasOpen = openGoalMenu || openPriorityMenu || openSportsMenu;
    if (!hasOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); closeSettingsMenus(true); } };
    const onFocus = (e: FocusEvent) => { if (e.target instanceof Element && e.target.closest('[data-settings-menu-root]')) return; closeSettingsMenus(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('focusin', onFocus); };
  }, [closeSettingsMenus, openGoalMenu, openPriorityMenu, openSportsMenu]);

  const availableGoalOptions = allGoals.filter((g) => !visibleGoalIds.includes(g.id));
  const hrZoneSets = getActiveTrainingZoneSetsByType('heart_rate');
  const otherZoneSets = getActiveTrainingZoneSets().filter((zs) => zs.zoneType !== 'heart_rate');
  const activeHrZoneSet = hrZoneSets.find((zs) => zs.sport === hrSport) ?? hrZoneSets[0];
  const hrZones = activeHrZoneSet ? getTrainingZonesBySetId(activeHrZoneSet.id) : [];
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : undefined;
  const sportOptions: SportType[] = availableSports;

  function getGoalMetricMock(goal: TrainingGoal): string | undefined {
    const { formatZonePaceShort: fmtSwim } = { formatZonePaceShort };
    if (goal.targetDurationSeconds) return formatDuration(goal.targetDurationSeconds);
    if (goal.targetPaceSecPerKm) return formatPace(goal.targetPaceSecPerKm) ?? undefined;
    if (goal.targetPowerWatts) return `${goal.targetPowerWatts} W`;
    if (goal.targetSwimPaceSecPer100m) return `${fmtSwim(goal.targetSwimPaceSecPer100m)} /100m`;
    return undefined;
  }

  const MOCK_GOAL_PRIORITY_OPTIONS: GoalPriority[] = ['main_goal', 'secondary_goal', 'watchlist'];
  const MOCK_PRIORITY_DESCRIPTIONS: Record<GoalPriority, string> = {
    main_goal: 'Primary training target for the coach.',
    secondary_goal: 'Included in planning when it fits the main goal.',
    watchlist: 'Tracked on the side without dedicated training.',
  };

  return (
    <PageShell
      title="Settings"
      eyebrow="Athlete context · Configuration"
      description={
        <span className="settings__prototype-notice">
          Session prototype — changes reset on reload and are not persisted
        </span>
      }
    >
      <div className="settings-page">
        <section className="settings-section settings-section--context">
          <header className="settings-section-head">
            <div>
              <p>Athlete context</p>
              <h2>Profile and performance baselines</h2>
            </div>
            <span>Prototype only</span>
          </header>
          <div className="settings-context-grid">
            <div className="settings-identity">
              <p className="settings-identity__eyebrow">Single athlete profile</p>
              <h3>{profile.displayName}</h3>
              <div className="settings-sports">
                {availableSports.map((sport) => (
                  <button key={sport} type="button" className={['settings-sport-toggle', focusedSports.includes(sport) ? 'is-active' : ''].filter(Boolean).join(' ')} aria-pressed={focusedSports.includes(sport)} onClick={() => toggleFocusedSport(sport)}>
                    <SportBadge sport={sport} />
                    <span aria-hidden="true">{focusedSports.includes(sport) ? '×' : '+'}</span>
                  </button>
                ))}
              </div>
              {profile.notes && <p className="settings-notes">{profile.notes}</p>}
            </div>
            <dl className="settings-metric-strip">
              {age && <div><dt>Age</dt><dd>{age} yrs</dd></div>}
              {profile.bodyWeightKg && <div><dt>Weight</dt><dd>{profile.bodyWeightKg} kg</dd></div>}
              {profile.heightCm && <div><dt>Height</dt><dd>{profile.heightCm} cm</dd></div>}
              {profile.currentFtpWatts && <div className="is-accent"><dt>Bike FTP</dt><dd>{profile.currentFtpWatts} W</dd></div>}
              {profile.maxHeartRateBpm && <div><dt>Max HR</dt><dd>{profile.maxHeartRateBpm} bpm</dd></div>}
              {profile.restingHeartRateBpm && <div><dt>Resting HR</dt><dd>{profile.restingHeartRateBpm} bpm</dd></div>}
              {profile.runningThresholdPaceSecPerKm && <div><dt>Run threshold</dt><dd>{formatPace(profile.runningThresholdPaceSecPerKm)}</dd></div>}
              {profile.swimmingThresholdPaceSecPer100m && <div><dt>Swim threshold</dt><dd>{formatZonePaceShort(profile.swimmingThresholdPaceSecPer100m)} /100m</dd></div>}
            </dl>
          </div>
        </section>

        <section className="settings-section">
          <header className="settings-section-head">
            <div><p>Planning context</p><h2>Goal and training availability</h2></div>
          </header>
          <div className="settings-planning-grid">
            <div className="settings-goal">
              <div className="settings-goal__head">
                <p className="settings-section__label">Active goals</p>
                <div className="settings-goal-actions" data-settings-menu-root>
                  <span>{activeGoals.length} / 3</span>
                  <button type="button" ref={addGoalTriggerRef} className={['settings-goal-add', openGoalMenu ? 'is-open' : ''].filter(Boolean).join(' ')} aria-label="Add active goal" aria-expanded={openGoalMenu} aria-haspopup="menu" disabled={activeGoals.length >= 3 || availableGoalOptions.length === 0} onClick={(e) => { lastMenuTriggerRef.current = e.currentTarget; setOpenPriorityMenu(null); setOpenSportsMenu(null); setOpenGoalMenu((v) => !v); }}>+</button>
                  <div className={['settings-goal-menu', openGoalMenu ? 'is-open' : ''].filter(Boolean).join(' ')} role="menu" aria-hidden={!openGoalMenu}>
                    {availableGoalOptions.length > 0
                      ? availableGoalOptions.map((goal) => (
                          <button key={goal.id} type="button" role="menuitem" onClick={() => { addActiveGoal(goal.id); closeSettingsMenus(false); focusMenuTrigger(addGoalTriggerRef.current); }}>
                            <span>{goal.title}</span><small>{goalPriorityLabels[goal.priority]}</small>
                          </button>
                        ))
                      : <span>No more goals</span>}
                  </div>
                </div>
              </div>
              {activeGoals.length > 0 ? (
                <div className="settings-goal-list">
                  {activeGoals.map((goal) => {
                    const priority = goal.priority;
                    const goalMetric = getGoalMetricMock(goal);
                    return (
                      <article key={goal.id} className="settings-goal-card">
                        <div className="settings-goal-card__main">
                          <div className="settings-goal-card__meta">
                            {goal.sport ? <SportBadge sport={goal.sport} /> : null}
                            {goal.targetDate ? <span>{new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${goal.targetDate}T12:00:00Z`))}</span> : null}
                            <button type="button" className="settings-goal-remove" aria-label={`Remove ${goal.title} from active goals`} onClick={() => removeActiveGoal(goal.id)}>−</button>
                          </div>
                          <h3>{goal.title}</h3>
                          {goal.description ? <p>{goal.description}</p> : null}
                        </div>
                        <div className="settings-goal-card__side">
                          <div className="settings-goal-priority" data-settings-menu-root>
                            <span>Priority</span>
                            <button type="button" ref={(el) => { if (el) priorityTriggerRefs.current.set(goal.id, el); else priorityTriggerRefs.current.delete(goal.id); }} className={['settings-goal-priority__trigger', openPriorityMenu === goal.id ? 'is-open' : ''].filter(Boolean).join(' ')} aria-expanded={openPriorityMenu === goal.id} aria-haspopup="menu" onClick={(e) => { lastMenuTriggerRef.current = e.currentTarget; setOpenGoalMenu(false); setOpenSportsMenu(null); setOpenPriorityMenu((v) => v === goal.id ? null : goal.id); }}>
                              {goalPriorityLabels[priority]}
                            </button>
                            <div className={['settings-goal-priority__menu', openPriorityMenu === goal.id ? 'is-open' : ''].filter(Boolean).join(' ')} role="menu" aria-hidden={openPriorityMenu !== goal.id}>
                              {MOCK_GOAL_PRIORITY_OPTIONS.map((option) => (
                                <button key={option} type="button" role="menuitem" className={option === priority ? 'is-selected' : ''} onClick={() => { setGoalPriority(goal.id, option); closeSettingsMenus(false); focusMenuTrigger(priorityTriggerRefs.current.get(goal.id)); }}>
                                  <span>{goalPriorityLabels[option]}</span><small>{MOCK_PRIORITY_DESCRIPTIONS[option]}</small>
                                </button>
                              ))}
                            </div>
                          </div>
                          <p>{MOCK_PRIORITY_DESCRIPTIONS[priority]}</p>
                          <dl>
                            {goal.targetDistanceMeters ? <div><dt>Distance</dt><dd>{(goal.targetDistanceMeters / 1000).toFixed(1)} km</dd></div> : null}
                            {goalMetric ? <div><dt>Target</dt><dd>{goalMetric}</dd></div> : null}
                          </dl>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No active goal set" variant="inline" />
              )}
            </div>

            {profile.preferredTrainingDays && profile.preferredTrainingDays.length > 0 && (
              <div className="settings-availability-panel">
                <div className="settings-availability-head">
                  <p className="settings-section__label">Training availability</p>
                  <span>Preferred sports</span>
                </div>
                <ul className="settings-availability">
                  {profile.preferredTrainingDays.map((day) => (
                    <li key={day.weekday} className="settings-availability__day">
                      <span className={['settings-availability__toggle', day.available ? 'is-on' : ''].filter(Boolean).join(' ')} aria-label={`${WEEKDAY_SHORT[day.weekday]} ${day.available ? 'available' : 'unavailable'}`} role="switch" aria-checked={day.available} />
                      <span className="settings-availability__weekday">{WEEKDAY_SHORT[day.weekday]}</span>
                      <span className="settings-availability__duration">{day.available && day.maxDurationMinutes ? `${day.maxDurationMinutes} min` : 'Off'}</span>
                      <div className="settings-availability__sports-field" data-settings-menu-root>
                        <span className="settings-availability__sports" aria-label="Preferred sports">
                          {day.preferredSports?.length ? day.preferredSports.map((sport) => <SportBadge key={sport} sport={sport} />) : <em>None</em>}
                        </span>
                        <button type="button" ref={(el) => { if (el) sportsTriggerRefs.current.set(day.weekday, el); else sportsTriggerRefs.current.delete(day.weekday); }} className={['settings-availability__add', openSportsMenu === day.weekday ? 'is-open' : ''].filter(Boolean).join(' ')} aria-label={`Add preferred sport for ${WEEKDAY_SHORT[day.weekday]}`} aria-expanded={openSportsMenu === day.weekday} aria-haspopup="menu" onClick={(e) => { lastMenuTriggerRef.current = e.currentTarget; setOpenGoalMenu(false); setOpenPriorityMenu(null); setOpenSportsMenu((v) => v === day.weekday ? null : day.weekday); }}>+</button>
                        <div className={['settings-availability__menu', openSportsMenu === day.weekday ? 'is-open' : ''].filter(Boolean).join(' ')} role="menu" aria-hidden={openSportsMenu !== day.weekday}>
                          {sportOptions.map((sport) => <button key={sport} type="button" role="menuitem" disabled><SportBadge sport={sport} /></button>)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="settings-section">
          <header className="settings-section-head">
            <div><p>Training zones</p><h2>Intensity model</h2></div>
          </header>
          <div className="settings-zones-grid">
            {hrZoneSets.length > 0 && (
              <section className="settings-zone-card">
                <div className="settings-zone-card__top">
                  <p className="settings-section__label">Heart Rate Zones</p>
                  {hrZoneSets.length > 1 && (
                    <div className="segmented-control settings-zone-toggle" role="tablist" aria-label="HR zone sport">
                      <span className="segmented-control__indicator" aria-hidden="true" style={{ left: hrSport === 'cycling' ? '0%' : '50%', width: '50%' }} />
                      <button type="button" role="tab" aria-selected={hrSport === 'cycling'} className={`segmented-control__tab${hrSport === 'cycling' ? ' is-active' : ''}`} onClick={() => setHrSport('cycling')}>Cycling</button>
                      <button type="button" role="tab" aria-selected={hrSport === 'running'} className={`segmented-control__tab${hrSport === 'running' ? ' is-active' : ''}`} onClick={() => setHrSport('running')}>Running</button>
                    </div>
                  )}
                </div>
                {activeHrZoneSet?.basedOn && <p className="settings-zone-basis">{activeHrZoneSet.basedOn}</p>}
                <ZoneBand zones={hrZones} className="settings-zone-band" />
                <ZoneList zones={hrZones} className="zone-table" rowClassName="zone-row" dotClassName="zone-row__dot" numberClassName="zone-row__num" nameClassName="zone-row__name" rangeClassName="zone-row__range" />
              </section>
            )}
            {otherZoneSets.map((zoneSet) => {
              const zones = getTrainingZonesBySetId(zoneSet.id);
              if (zones.length === 0) return null;
              return (
                <section key={zoneSet.id} className="settings-zone-card">
                  <div className="settings-zone-card__top">
                    <p className="settings-section__label">{zoneSet.name}</p>
                  </div>
                  {zoneSet.basedOn && <p className="settings-zone-basis">{zoneSet.basedOn}</p>}
                  <ZoneBand zones={zones} className="settings-zone-band" />
                  <ZoneList zones={zones} className="zone-table" rowClassName="zone-row" dotClassName="zone-row__dot" numberClassName="zone-row__num" nameClassName="zone-row__name" rangeClassName="zone-row__range" />
                </section>
              );
            })}
          </div>
        </section>

        <div className="settings-save">
          <span className="settings-save__status">Read-only prototype</span>
          <p className="settings-save__note">Persistence is not implemented in prototype mode. Switch to API mode to persist changes.</p>
        </div>
      </div>
    </PageShell>
  );
}
