import { useCallback, useEffect, useRef, useState } from 'react';
import { EmptyState, SportBadge, ZoneBand, ZoneList } from '../components';
import { usePrototypeAthleteContext } from '../context/prototypeAthleteContextValue';
import { PageShell } from '../layout/PageShell';
import {
  getActiveTrainingZoneSets,
  getActiveTrainingZoneSetsByType,
  getTrainingZonesBySetId,
} from '../mock/prototypeData.helpers';
import {
  formatDuration,
  formatPace,
  goalPriorityLabels,
} from '../components/prototypeFormatters';
import {
  formatZonePaceShort,
} from '../components/zoneVisuals';
import type {
  GoalPriority,
  SportType,
  TrainingGoal,
} from '../mock/prototypeData.types';

const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const GOAL_PRIORITY_OPTIONS: GoalPriority[] = [
  'main_goal',
  'secondary_goal',
  'watchlist',
];

const GOAL_PRIORITY_DESCRIPTIONS: Record<GoalPriority, string> = {
  main_goal: 'Primary training target for the coach.',
  secondary_goal: 'Included in planning when it fits the main goal.',
  watchlist: 'Tracked on the side without dedicated training.',
};

function formatGoalDate(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}

function getGoalMetric(goal: TrainingGoal): string | undefined {
  if (goal.targetDurationSeconds) return formatDuration(goal.targetDurationSeconds);
  if (goal.targetPaceSecPerKm) return formatPace(goal.targetPaceSecPerKm);
  if (goal.targetPowerWatts) return `${goal.targetPowerWatts} W`;
  if (goal.targetSwimPaceSecPer100m) {
    return `${formatZonePaceShort(goal.targetSwimPaceSecPer100m)} /100m`;
  }
  return undefined;
}

export function SettingsPage() {
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
    window.requestAnimationFrame(() => {
      trigger?.focus();
    });
  }, []);

  const closeSettingsMenus = useCallback(
    (restoreFocus = false) => {
      setOpenGoalMenu(false);
      setOpenPriorityMenu(null);
      setOpenSportsMenu(null);

      if (restoreFocus) {
        focusMenuTrigger(lastMenuTriggerRef.current);
      }
    },
    [focusMenuTrigger],
  );

  useEffect(() => {
    const closeMenusOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Element
        && target.closest('[data-settings-menu-root]')
      ) {
        return;
      }

      closeSettingsMenus(false);
    };

    document.addEventListener('pointerdown', closeMenusOnOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', closeMenusOnOutsideClick);
    };
  }, [closeSettingsMenus]);

  useEffect(() => {
    const hasOpenMenu = openGoalMenu || openPriorityMenu || openSportsMenu;
    if (!hasOpenMenu) return;

    const closeMenusOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      closeSettingsMenus(true);
    };

    const closeMenusOnFocusLeave = (event: FocusEvent) => {
      const target = event.target;

      if (
        target instanceof Element
        && target.closest('[data-settings-menu-root]')
      ) {
        return;
      }

      closeSettingsMenus(false);
    };

    document.addEventListener('keydown', closeMenusOnEscape);
    document.addEventListener('focusin', closeMenusOnFocusLeave);

    return () => {
      document.removeEventListener('keydown', closeMenusOnEscape);
      document.removeEventListener('focusin', closeMenusOnFocusLeave);
    };
  }, [closeSettingsMenus, openGoalMenu, openPriorityMenu, openSportsMenu]);

  const availableGoalOptions = allGoals.filter(
    (goal) => !visibleGoalIds.includes(goal.id),
  );

  const hrZoneSets = getActiveTrainingZoneSetsByType('heart_rate');
  const otherZoneSets = getActiveTrainingZoneSets().filter(
    (zoneSet) => zoneSet.zoneType !== 'heart_rate',
  );
  const activeHrZoneSet = hrZoneSets.find((zs) => zs.sport === hrSport) ?? hrZoneSets[0];
  const hrZones = activeHrZoneSet ? getTrainingZonesBySetId(activeHrZoneSet.id) : [];

  const age = profile.birthYear
    ? new Date().getFullYear() - profile.birthYear
    : undefined;
  const sportOptions: SportType[] = availableSports;
  const hasThresholdBaselines = Boolean(
    profile.currentFtpWatts
      || profile.maxHeartRateBpm
      || profile.restingHeartRateBpm
      || profile.runningThresholdPaceSecPerKm
      || profile.swimmingThresholdPaceSecPer100m,
  );

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
                  <button
                    key={sport}
                    type="button"
                    className={[
                      'settings-sport-toggle',
                      focusedSports.includes(sport) ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={focusedSports.includes(sport)}
                    onClick={() => toggleFocusedSport(sport)}
                  >
                    <SportBadge sport={sport} />
                    <span aria-hidden="true">
                      {focusedSports.includes(sport) ? '×' : '+'}
                    </span>
                  </button>
                ))}
              </div>
              {profile.notes && (
                <p className="settings-notes">{profile.notes}</p>
              )}
            </div>

            <dl className="settings-metric-strip">
              {age && (
                <div>
                  <dt>Age</dt>
                  <dd>{age} yrs</dd>
                </div>
              )}
              {profile.bodyWeightKg && (
                <div>
                  <dt>Weight</dt>
                  <dd>{profile.bodyWeightKg} kg</dd>
                </div>
              )}
              {profile.heightCm && (
                <div>
                  <dt>Height</dt>
                  <dd>{profile.heightCm} cm</dd>
                </div>
              )}
              {profile.currentFtpWatts && (
                <div className="is-accent">
                  <dt>Bike FTP</dt>
                  <dd>{profile.currentFtpWatts} W</dd>
                </div>
              )}
              {profile.maxHeartRateBpm && (
                <div>
                  <dt>Max HR</dt>
                  <dd>{profile.maxHeartRateBpm} bpm</dd>
                </div>
              )}
              {profile.restingHeartRateBpm && (
                <div>
                  <dt>Resting HR</dt>
                  <dd>{profile.restingHeartRateBpm} bpm</dd>
                </div>
              )}
              {profile.runningThresholdPaceSecPerKm && (
                <div>
                  <dt>Run threshold</dt>
                  <dd>{formatPace(profile.runningThresholdPaceSecPerKm)}</dd>
                </div>
              )}
              {profile.swimmingThresholdPaceSecPer100m && (
                <div>
                  <dt>Swim threshold</dt>
                  <dd>
                    {formatZonePaceShort(profile.swimmingThresholdPaceSecPer100m)} /100m
                  </dd>
                </div>
              )}
              {!hasThresholdBaselines && (
                <div>
                  <dt>Thresholds</dt>
                  <dd>No threshold baselines available yet.</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <section className="settings-section">
          <header className="settings-section-head">
            <div>
              <p>Planning context</p>
              <h2>Goal and training availability</h2>
            </div>
          </header>

          <div className="settings-planning-grid">
            <div className="settings-goal">
              <div className="settings-goal__head">
                <p className="settings-section__label">Active goals</p>
                <div className="settings-goal-actions" data-settings-menu-root>
                  <span>{activeGoals.length} / 3</span>
                  <button
                    type="button"
                    ref={addGoalTriggerRef}
                    className={[
                      'settings-goal-add',
                      openGoalMenu ? 'is-open' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label="Add active goal"
                    aria-expanded={openGoalMenu}
                    aria-haspopup="menu"
                    disabled={activeGoals.length >= 3 || availableGoalOptions.length === 0}
                    onClick={(event) => {
                      lastMenuTriggerRef.current = event.currentTarget;
                      setOpenPriorityMenu(null);
                      setOpenSportsMenu(null);
                      setOpenGoalMenu((current) => !current);
                    }}
                  >
                    +
                  </button>
                  <div
                    className={[
                      'settings-goal-menu',
                      openGoalMenu ? 'is-open' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="menu"
                    aria-hidden={!openGoalMenu}
                  >
                    {availableGoalOptions.length > 0 ? (
                      availableGoalOptions.map((goal) => (
                        <button
                          key={goal.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            addActiveGoal(goal.id);
                            closeSettingsMenus(false);
                            focusMenuTrigger(addGoalTriggerRef.current);
                          }}
                        >
                          <span>{goal.title}</span>
                          <small>{goalPriorityLabels[goal.priority]}</small>
                        </button>
                      ))
                    ) : (
                      <span>No more goals</span>
                    )}
                  </div>
                </div>
              </div>
              {activeGoals.length > 0 ? (
                <div className="settings-goal-list">
                  {activeGoals.map((goal) => {
                    const priority = goal.priority;
                    const goalMetric = getGoalMetric(goal);

                    return (
                      <article key={goal.id} className="settings-goal-card">
                        <div className="settings-goal-card__main">
                          <div className="settings-goal-card__meta">
                            {goal.sport ? <SportBadge sport={goal.sport} /> : null}
                            {goal.targetDate ? <span>{formatGoalDate(goal.targetDate)}</span> : null}
                            <button
                              type="button"
                              className="settings-goal-remove"
                              aria-label={`Remove ${goal.title} from active goals`}
                              onClick={() =>
                                removeActiveGoal(goal.id)
                              }
                            >
                              −
                            </button>
                          </div>
                          <h3>{goal.title}</h3>
                          {goal.description ? (
                            <p>{goal.description}</p>
                          ) : null}
                        </div>
                        <div className="settings-goal-card__side">
                          <div className="settings-goal-priority" data-settings-menu-root>
                            <span>Priority</span>
                            <button
                              type="button"
                              ref={(element) => {
                                if (element) {
                                  priorityTriggerRefs.current.set(goal.id, element);
                                } else {
                                  priorityTriggerRefs.current.delete(goal.id);
                                }
                              }}
                              className={[
                                'settings-goal-priority__trigger',
                                openPriorityMenu === goal.id ? 'is-open' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              aria-expanded={openPriorityMenu === goal.id}
                              aria-haspopup="menu"
                              onClick={(event) => {
                                lastMenuTriggerRef.current = event.currentTarget;
                                setOpenGoalMenu(false);
                                setOpenSportsMenu(null);
                                setOpenPriorityMenu((current) =>
                                  current === goal.id ? null : goal.id,
                                );
                              }}
                            >
                              {goalPriorityLabels[priority]}
                            </button>
                            <div
                              className={[
                                'settings-goal-priority__menu',
                                openPriorityMenu === goal.id ? 'is-open' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              role="menu"
                              aria-hidden={openPriorityMenu !== goal.id}
                            >
                              {GOAL_PRIORITY_OPTIONS.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  role="menuitem"
                                  className={option === priority ? 'is-selected' : ''}
                                  onClick={() => {
                                    setGoalPriority(goal.id, option);
                                    closeSettingsMenus(false);
                                    focusMenuTrigger(
                                      priorityTriggerRefs.current.get(goal.id),
                                    );
                                  }}
                                >
                                  <span>{goalPriorityLabels[option]}</span>
                                  <small>{GOAL_PRIORITY_DESCRIPTIONS[option]}</small>
                                </button>
                              ))}
                            </div>
                          </div>
                          <p>{GOAL_PRIORITY_DESCRIPTIONS[priority]}</p>
                          <dl>
                            {goal.targetDistanceMeters ? (
                              <div>
                                <dt>Distance</dt>
                                <dd>{(goal.targetDistanceMeters / 1000).toFixed(1)} km</dd>
                              </div>
                            ) : null}
                            {goalMetric ? (
                              <div>
                                <dt>Target</dt>
                                <dd>{goalMetric}</dd>
                              </div>
                            ) : null}
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
            {allGoals.length === 0 && (
              <EmptyState title="No goals configured" variant="inline" />
            )}

            {profile.preferredTrainingDays && profile.preferredTrainingDays.length > 0 && (
              <div className="settings-availability-panel">
                <div className="settings-availability-head">
                  <p className="settings-section__label">Training availability</p>
                  <span>Preferred sports</span>
                </div>
                <ul className="settings-availability">
                  {profile.preferredTrainingDays.map((day) => (
                    <li key={day.weekday} className="settings-availability__day">
                      <span
                        className={[
                          'settings-availability__toggle',
                          day.available ? 'is-on' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-label={`${WEEKDAY_SHORT[day.weekday]} ${
                          day.available ? 'available' : 'unavailable'
                        }`}
                        role="switch"
                        aria-checked={day.available}
                      />
                      <span className="settings-availability__weekday">
                        {WEEKDAY_SHORT[day.weekday]}
                      </span>
                      <span className="settings-availability__duration">
                        {day.available && day.maxDurationMinutes
                          ? `${day.maxDurationMinutes} min`
                          : 'Off'}
                      </span>
                    <div className="settings-availability__sports-field" data-settings-menu-root>
                        <span className="settings-availability__sports" aria-label="Preferred sports">
                          {day.preferredSports?.length
                            ? day.preferredSports.map((sport) => (
                                <SportBadge key={sport} sport={sport} />
                              ))
                            : <em>None</em>}
                        </span>
                        <button
                          type="button"
                          ref={(element) => {
                            if (element) {
                              sportsTriggerRefs.current.set(day.weekday, element);
                            } else {
                              sportsTriggerRefs.current.delete(day.weekday);
                            }
                          }}
                          className={[
                            'settings-availability__add',
                            openSportsMenu === day.weekday ? 'is-open' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={`Add preferred sport for ${WEEKDAY_SHORT[day.weekday]}`}
                          aria-expanded={openSportsMenu === day.weekday}
                          aria-haspopup="menu"
                          onClick={(event) => {
                            lastMenuTriggerRef.current = event.currentTarget;
                            setOpenGoalMenu(false);
                            setOpenPriorityMenu(null);
                            setOpenSportsMenu((current) =>
                              current === day.weekday ? null : day.weekday,
                            );
                          }}
                        >
                          +
                        </button>
                        <div
                          className={[
                            'settings-availability__menu',
                            openSportsMenu === day.weekday ? 'is-open' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="menu"
                          aria-hidden={openSportsMenu !== day.weekday}
                        >
                          {sportOptions.map((sport) => (
                            <button
                              key={sport}
                              type="button"
                              role="menuitem"
                              disabled
                            >
                              <SportBadge sport={sport} />
                            </button>
                          ))}
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
            <div>
              <p>Training zones</p>
              <h2>Intensity model</h2>
            </div>
          </header>

          <div className="settings-zones-grid">
            {hrZoneSets.length > 0 && (
              <section className="settings-zone-card">
                <div className="settings-zone-card__top">
                  <p className="settings-section__label">Heart Rate Zones</p>
                  {hrZoneSets.length > 1 && (
                    <div
                      className="segmented-control settings-zone-toggle"
                      role="tablist"
                      aria-label="HR zone sport"
                    >
                      <span
                        className="segmented-control__indicator"
                        aria-hidden="true"
                        style={{
                          left: hrSport === 'cycling' ? '0%' : '50%',
                          width: '50%',
                        }}
                      />
                      <button
                        type="button"
                        role="tab"
                        aria-selected={hrSport === 'cycling'}
                        className={`segmented-control__tab${hrSport === 'cycling' ? ' is-active' : ''}`}
                        onClick={() => setHrSport('cycling')}
                      >
                        Cycling
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={hrSport === 'running'}
                        className={`segmented-control__tab${hrSport === 'running' ? ' is-active' : ''}`}
                        onClick={() => setHrSport('running')}
                      >
                        Running
                      </button>
                    </div>
                  )}
                </div>
                {activeHrZoneSet?.basedOn && (
                  <p className="settings-zone-basis">{activeHrZoneSet.basedOn}</p>
                )}
                <ZoneBand zones={hrZones} className="settings-zone-band" />
                <ZoneList
                  zones={hrZones}
                  className="zone-table"
                  rowClassName="zone-row"
                  dotClassName="zone-row__dot"
                  numberClassName="zone-row__num"
                  nameClassName="zone-row__name"
                  rangeClassName="zone-row__range"
                />
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
                  {zoneSet.basedOn && (
                    <p className="settings-zone-basis">{zoneSet.basedOn}</p>
                  )}
                  <ZoneBand zones={zones} className="settings-zone-band" />
                  <ZoneList
                    zones={zones}
                    className="zone-table"
                    rowClassName="zone-row"
                    dotClassName="zone-row__dot"
                    numberClassName="zone-row__num"
                    nameClassName="zone-row__name"
                    rangeClassName="zone-row__range"
                  />
                </section>
              );
            })}
          </div>
        </section>

        <div className="settings-save">
          <span className="settings-save__status">Read-only prototype</span>
          <p className="settings-save__note">
            Persistence is not implemented in Phase 2. These values represent the
            future athlete context configuration surface.
          </p>
        </div>
      </div>

    </PageShell>
  );
}
