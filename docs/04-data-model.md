# Data Model

Stand: 15.06.2026

## 1. Ziel dieser Datei

Diese Datei beschreibt das konzeptuelle Datenmodell von `pp-trainer`.

Das Datenmodell bildet die Grundlage für:

* Datenimport
* Normalisierung externer Quellen
* Aktivitätsübersicht
* Aktivitätsdetailseiten
* Dashboard
* Trainingsplanung
* Workout Cards
* AI-Coach
* spätere Analysen und Integrationen

Das Ziel ist nicht, in dieser Datei bereits ein fertiges Datenbankschema oder Prisma-Schema zu definieren. Stattdessen beschreibt diese Datei die zentralen Entities, ihre Beziehungen und ihre Rolle im MVP sowie im langfristigen Endprodukt.

---

## 2. Grundprinzip

`pp-trainer` wird nicht um Garmin, Strava oder eine andere externe Quelle herum modelliert.

Der stabile Kern ist ein eigenes internes Trainingsdatenmodell.

Der zentrale Datenfluss lautet:

```txt
External Source
FIT / GPX / TCX / Garmin / Strava / Export / Mock Data
        ↓
Raw Data
        ↓
Normalization
        ↓
Canonical Training Data Model
        ↓
Analytics
        ↓
Athlete Context
        ↓
Dashboard / AI-Coach / Training Plan
```

Das bedeutet:

* externe Datenquellen sind austauschbar
* Rohdaten und normalisierte Daten werden getrennt betrachtet
* Dashboard und AI-Coach arbeiten nur mit internen App-Daten
* externe IDs und Quellen werden als Metadaten gespeichert
* fehlende Daten müssen erlaubt sein
* das Modell muss für MVP nutzbar bleiben und trotzdem spätere Erweiterungen ermöglichen

---

## 3. Modellierungsziele

Das Datenmodell soll folgende Ziele erfüllen:

* Aktivitäten aus verschiedenen Quellen einheitlich speichern
* manuelle Uploads und spätere API-Syncs unterstützen
* Sportarten wie Radfahren, Laufen, Schwimmen und Krafttraining abbilden
* geplante Workouts und abgeschlossene Aktivitäten trennen
* AI-generierte Trainingspläne strukturiert speichern
* Trainingszonen und Leistungswerte berücksichtigen
* Deduplizierung importierter Aktivitäten ermöglichen
* spätere Health- und Recovery-Daten vorbereiten
* spätere Exportfunktionen nicht blockieren
* MVP nicht unnötig überkomplex machen

---

## 4. Scope des Datenmodells

## 4.1 Muss im MVP modelliert werden

Das MVP-Datenmodell muss folgende Bereiche abbilden:

* Athlete Profile
* Training Zones
* Data Source Metadata
* Imported File oder Raw Data Reference
* Activity
* Activity Summary Metrics
* Training Plan
* Planned Workout
* Workout Step
* AI Coach Output
* Athlete Context Snapshot oder generierbarer Athlete Context

## 4.2 Sollte im MVP vorbereitet werden

Diese Bereiche sollten vorbereitet, aber nicht zwingend vollständig ausgebaut werden:

* Activity Lap
* Activity Metric Sample
* Import History
* Completed Workout Link
* Simple Weekly Summary
* Workout Status
* Basic Deduplication Metadata

## 4.3 Nicht vollständig im MVP nötig

Diese Bereiche sind wichtig, aber nicht Teil des ersten Datenmodell-Fokus:

* Multi-User-Rollen
* Coach-Athlet-Beziehungen
* Garmin OAuth Details
* Strava OAuth Details
* Aggregator-spezifische Modelle
* vollständige GPS-Track-Speicherung
* detaillierte Health-Datenhistorie
* langfristige Performance Scores
* medizinische Recovery-Modelle
* Payment oder Subscription Models
* Social Features

---

## 5. Namens- und Einheitenkonventionen

Damit Daten aus verschiedenen Quellen vergleichbar bleiben, werden einheitliche interne Einheiten verwendet.

## 5.1 Zeit

| Feldtyp     | Einheit / Format              |
| ----------- | ----------------------------- |
| Zeitstempel | ISO 8601                      |
| Speicherung | UTC                           |
| Dauer       | Sekunden                      |
| Wochenstart | ISO Date, vorzugsweise Montag |

Beispiele:

```txt
startTime: 2026-06-15T07:30:00.000Z
durationSeconds: 5400
```

## 5.2 Distanz und Geschwindigkeit

| Feldtyp         | Einheit                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| Distanz         | Meter                                                                                  |
| Höhe            | Meter                                                                                  |
| Pace            | Sekunden pro Kilometer                                                                 |
| Geschwindigkeit | Kilometer pro Stunde oder Meter pro Sekunde, Entscheidung in Implementierung festlegen |

Empfehlung:

* Distanz intern in Metern speichern
* Pace intern in Sekunden pro Kilometer speichern
* Geschwindigkeit für Anzeige berechnen oder zusätzlich als km/h speichern

## 5.3 Leistung und Herzfrequenz

| Feldtyp              | Einheit |
| -------------------- | ------- |
| Leistung             | Watt    |
| Herzfrequenz         | bpm     |
| Kadenz Rad           | rpm     |
| Schrittfrequenz Lauf | spm     |

## 5.4 Schwimmen

| Feldtyp        | Einheit                |
| -------------- | ---------------------- |
| Distanz        | Meter                  |
| Pace           | Sekunden pro 100 Meter |
| Pause          | Sekunden               |
| Intervalllänge | Meter                  |

## 5.5 Krafttraining

| Feldtyp        | Einheit   |
| -------------- | --------- |
| Gewicht        | Kilogramm |
| Wiederholungen | Anzahl    |
| Sätze          | Anzahl    |
| Pause          | Sekunden  |

---

## 6. High-Level Entity Übersicht

Das Datenmodell besteht aus mehreren logischen Bereichen.

```txt
Athlete
├── AthleteProfile
├── TrainingGoal
└── TrainingZone

Data Import
├── DataSource
├── DataSourceConnection
├── ImportedFile
├── RawActivityData
└── ImportJob

Activities
├── Activity
├── ActivityLap
├── ActivityMetricSample
└── ActivitySummary

Training Planning
├── TrainingPlan
├── PlannedWorkout
├── WorkoutStep
├── StrengthExercise
└── CompletedWorkoutLink

AI Coach
├── AthleteContextSnapshot
├── AiCoachRequest
├── AiCoachOutput
└── AiCoachRecommendation

Analytics
├── WeeklySummary
├── SportSummary
└── TrainingLoadEstimate
```

Nicht alle Entities müssen direkt im MVP als eigene Tabellen umgesetzt werden. Manche können zunächst als berechnete Objekte oder JSON-Strukturen existieren.

---

# 7. Core Entities

## 7.1 AthleteProfile

### Zweck

`AthleteProfile` beschreibt den zentralen User der App.

Im MVP gibt es genau ein Athlete Profile. Ein echtes Multi-User-System ist nicht Teil des MVP.

### Scope

MVP

### Wichtige Felder

```ts
type AthleteProfile = {
  id: string;
  displayName: string;
  birthYear?: number;
  bodyWeightKg?: number;
  heightCm?: number;

  primarySports: SportType[];

  currentFtpWatts?: number;
  maxHeartRateBpm?: number;
  restingHeartRateBpm?: number;

  runningThresholdPaceSecPerKm?: number;
  swimmingThresholdPaceSecPer100m?: number;

  preferredTrainingDays?: TrainingAvailability[];
  notes?: string;

  createdAt: string;
  updatedAt: string;
};
```

### Hinweise

* Persönliche Leistungswerte können später historisiert werden.
* Für den MVP reicht zunächst ein aktueller Wert pro Kennzahl.
* Das Profil ist Grundlage für den Athlete Context.

---

## 7.2 TrainingGoal

### Zweck

`TrainingGoal` beschreibt sportliche Ziele oder Wettkämpfe.

### Scope

MVP / Post-MVP

### Beispiele

* Triathlon
* Radrennen
* Halbmarathon
* 10 km Lauf
* FTP-Ziel
* Schwimmpace-Ziel

### Wichtige Felder

```ts
type TrainingGoal = {
  id: string;
  athleteProfileId: string;

  title: string;
  goalType: TrainingGoalType;
  targetDate?: string;

  sport?: SportType;
  priority: GoalPriority;

  targetDistanceMeters?: number;
  targetDurationSeconds?: number;
  targetPaceSecPerKm?: number;
  targetPowerWatts?: number;
  targetSwimPaceSecPer100m?: number;

  description?: string;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type TrainingGoalType =
  | 'race'
  | 'performance'
  | 'volume'
  | 'fitness'
  | 'general';

type GoalPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'main_goal';
```

### Hinweise

* Im MVP reicht ein aktives Hauptziel.
* Später können mehrere Ziele parallel existieren.
* Der AI-Coach nutzt aktive Ziele für Trainingsplanung.

---

## 7.3 TrainingAvailability

### Zweck

`TrainingAvailability` beschreibt, wann und wie viel der User trainieren kann.

### Scope

MVP

### Wichtige Felder

```ts
type TrainingAvailability = {
  weekday: Weekday;
  available: boolean;
  maxDurationMinutes?: number;
  preferredSports?: SportType[];
  notes?: string;
};
```

### Enums

```ts
type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
```

### Hinweise

* Kann im MVP als JSON-Feld im Athlete Profile gespeichert werden.
* Später kann daraus eine eigene Tabelle werden.
* Wichtig für AI-generierte Wochenpläne.

---

# 8. Data Source and Import Entities

## 8.1 DataSource

### Zweck

`DataSource` beschreibt den Typ der Datenquelle.

### Scope

MVP

### Mögliche Werte

```ts
type DataSourceType =
  | 'mock'
  | 'manual_fit_upload'
  | 'manual_gpx_upload'
  | 'manual_tcx_upload'
  | 'manual_json_import'
  | 'manual_csv_import'
  | 'garmin_official'
  | 'garmin_unofficial'
  | 'garmin_export'
  | 'strava'
  | 'aggregator';
```

### Hinweise

* Im MVP reichen `mock`, `manual_json_import` und ein manueller Dateiimport.
* Garmin, Strava und Aggregator werden als spätere Quellen vorbereitet.
* Die Datenquelle ist Metainformation, nicht Fundament der App.

---

## 8.2 DataSourceConnection

### Zweck

`DataSourceConnection` beschreibt eine verbundene externe Datenquelle.

### Scope

Post-MVP / Endprodukt

Im MVP ist diese Entity optional, weil noch keine echte OAuth-Verbindung benötigt wird.

### Wichtige Felder

```ts
type DataSourceConnection = {
  id: string;
  athleteProfileId: string;

  sourceType: DataSourceType;
  displayName: string;

  status: DataSourceConnectionStatus;

  externalUserId?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: string;

  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type DataSourceConnectionStatus =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'error';
```

### Hinweise

* Secrets und Tokens dürfen niemals im Frontend landen.
* Für MVP kann diese Entity durch einfache Source-Metadaten ersetzt werden.
* Für Garmin oder Strava wird sie später relevant.

---

## 8.3 ImportedFile

### Zweck

`ImportedFile` beschreibt eine manuell hochgeladene Datei.

### Scope

MVP

### Wichtige Felder

```ts
type ImportedFile = {
  id: string;
  athleteProfileId: string;

  sourceType: DataSourceType;
  fileName: string;
  fileType: ImportedFileType;
  fileSizeBytes?: number;
  fileHash?: string;

  importStatus: ImportStatus;
  errorMessage?: string;

  createdActivityId?: string;

  uploadedAt: string;
  processedAt?: string;
};
```

### Enums

```ts
type ImportedFileType =
  | 'fit'
  | 'gpx'
  | 'tcx'
  | 'json'
  | 'csv'
  | 'unknown';

type ImportStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'duplicate'
  | 'partially_imported';
```

### Hinweise

* `fileHash` hilft bei Deduplizierung.
* `createdActivityId` verknüpft den Upload mit der normalisierten Aktivität.
* Im MVP kann die Datei lokal verarbeitet werden, später kann Storage ergänzt werden.

---

## 8.4 RawActivityData

### Zweck

`RawActivityData` speichert oder referenziert die unveränderten Rohdaten eines Imports.

### Scope

MVP / Post-MVP

### Wichtige Felder

```ts
type RawActivityData = {
  id: string;
  athleteProfileId: string;

  sourceType: DataSourceType;
  importedFileId?: string;
  externalId?: string;

  rawFormat: RawDataFormat;
  rawPayload?: unknown;
  rawFilePath?: string;

  parsedAt?: string;
  createdAt: string;
};
```

### Enums

```ts
type RawDataFormat =
  | 'fit'
  | 'gpx'
  | 'tcx'
  | 'json'
  | 'csv'
  | 'garmin_api'
  | 'strava_api'
  | 'aggregator_api';
```

### Hinweise

* Rohdaten sind nicht die Grundlage für UI oder AI-Coach.
* Rohdaten dienen Debugging, Re-Parsing und Nachvollziehbarkeit.
* Für große Dateien kann statt `rawPayload` ein Dateipfad oder Storage-Key verwendet werden.

---

## 8.5 ImportJob

### Zweck

`ImportJob` beschreibt einen Importvorgang.

### Scope

Post-MVP

Im MVP kann der Import zunächst synchron verarbeitet werden. Sobald Background Jobs oder mehrere Dateien relevant werden, wird diese Entity wichtiger.

### Wichtige Felder

```ts
type ImportJob = {
  id: string;
  athleteProfileId: string;

  sourceType: DataSourceType;
  status: ImportStatus;

  startedAt?: string;
  finishedAt?: string;

  totalItems?: number;
  successfulItems?: number;
  failedItems?: number;
  duplicateItems?: number;

  errorMessage?: string;
  createdAt: string;
};
```

### Hinweise

* Nützlich für Importhistorie.
* Relevant für große Garmin-Exporte oder spätere API-Syncs.
* Für MVP nicht zwingend als eigene Tabelle nötig.

---

# 9. Activity Entities

## 9.1 Activity

### Zweck

`Activity` ist die zentrale Entity für abgeschlossene Trainingseinheiten.

Eine Activity ist immer eine bereits absolvierte Einheit.

Geplante Einheiten werden nicht als Activity gespeichert, sondern als `PlannedWorkout`.

### Scope

MVP

### Wichtige Felder

```ts
type Activity = {
  id: string;
  athleteProfileId: string;

  sourceType: DataSourceType;
  externalId?: string;
  importedFileId?: string;
  rawActivityDataId?: string;

  title?: string;
  sport: SportType;
  activityType?: ActivityType;

  startTime: string;
  timezone?: string;

  durationSeconds: number;
  movingDurationSeconds?: number;

  distanceMeters?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;

  averageHeartRateBpm?: number;
  maxHeartRateBpm?: number;

  averagePowerWatts?: number;
  maxPowerWatts?: number;
  normalizedPowerWatts?: number;

  averagePaceSecPerKm?: number;
  bestPaceSecPerKm?: number;

  averageSpeedKmh?: number;
  maxSpeedKmh?: number;

  averageCadence?: number;
  calories?: number;

  perceivedExertion?: number;
  notes?: string;

  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type SportType =
  | 'cycling'
  | 'running'
  | 'swimming'
  | 'strength'
  | 'mobility'
  | 'other';

type ActivityType =
  | 'easy'
  | 'long'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'race'
  | 'recovery'
  | 'strength'
  | 'technical'
  | 'other';
```

### Hinweise

* Viele Felder sind optional, weil nicht jede Quelle alle Daten liefert.
* Das Modell ist sportartenübergreifend.
* Sportartspezifische Detaildaten können über ergänzende Entities oder JSON-Felder abgebildet werden.
* `sourceType` und `externalId` helfen bei Deduplizierung.
* Dashboard, Aktivitätsliste und AI-Coach nutzen diese Entity als Basis.

---

## 9.2 ActivityLap

### Zweck

`ActivityLap` beschreibt Runden, Splits oder Abschnitte einer Aktivität.

### Scope

Post-MVP

Im MVP optional. Für spätere Aktivitätsanalysen wichtig.

### Wichtige Felder

```ts
type ActivityLap = {
  id: string;
  activityId: string;

  lapIndex: number;
  startTime?: string;

  durationSeconds: number;
  distanceMeters?: number;

  averageHeartRateBpm?: number;
  maxHeartRateBpm?: number;

  averagePowerWatts?: number;
  maxPowerWatts?: number;

  averagePaceSecPerKm?: number;
  averageSpeedKmh?: number;

  elevationGainMeters?: number;
  calories?: number;
};
```

### Hinweise

* Für Schwimmen können Laps auch Beckenabschnitte oder Sets repräsentieren.
* Für Lauf und Rad können es Runden oder automatische Splits sein.
* Für MVP nicht zwingend, aber sollte im Modell vorbereitet werden.

---

## 9.3 ActivityMetricSample

### Zweck

`ActivityMetricSample` beschreibt Zeitreihendaten innerhalb einer Aktivität.

### Scope

Endprodukt

Für den MVP nicht zwingend erforderlich, aber wichtig für spätere Charts und Detailanalysen.

### Wichtige Felder

```ts
type ActivityMetricSample = {
  id: string;
  activityId: string;

  timestamp: string;
  elapsedSeconds?: number;

  latitude?: number;
  longitude?: number;
  altitudeMeters?: number;

  heartRateBpm?: number;
  powerWatts?: number;
  cadence?: number;

  speedMetersPerSecond?: number;
  paceSecPerKm?: number;

  distanceMeters?: number;
  temperatureCelsius?: number;
};
```

### Hinweise

* Diese Daten können sehr groß werden.
* Sie sollten nicht für Listenansichten geladen werden.
* Für MVP kann auf diese Entity verzichtet werden, solange keine Zeitreihencharts benötigt werden.
* Später können diese Daten ausgelagert oder optimiert gespeichert werden.

---

## 9.4 ActivityDeduplicationData

### Zweck

Diese Daten helfen, doppelte Aktivitäten zu erkennen.

### Scope

MVP / Post-MVP

Kann als eigene Entity oder als Teil von `Activity` und `ImportedFile` umgesetzt werden.

### Wichtige Felder

```ts
type ActivityDeduplicationData = {
  activityId: string;

  sourceType: DataSourceType;
  externalId?: string;
  fileHash?: string;

  sport: SportType;
  startTime: string;
  durationSeconds: number;
  distanceMeters?: number;

  deduplicationKey?: string;
};
```

### Mögliche Regeln

```txt
1. sourceType + externalId eindeutig
2. fileHash bereits vorhanden
3. sport + startTime + duration + distance sehr ähnlich
4. unsichere Treffer als potenzielle Duplikate markieren
```

### Hinweise

* Für MVP reicht einfache Deduplizierung über Datei-Hash und Aktivitätsähnlichkeit.
* Später kann ein manuelles Review für potenzielle Duplikate ergänzt werden.

---

# 10. Health and Recovery Entities

## 10.1 DailyHealthSummary

### Zweck

`DailyHealthSummary` speichert tägliche Gesundheits- und Erholungsdaten.

### Scope

Endprodukt

Für den MVP nicht erforderlich, weil der MVP primär über Aktivitäten, Planung und AI-Coach funktioniert.

### Wichtige Felder

```ts
type DailyHealthSummary = {
  id: string;
  athleteProfileId: string;

  date: string;
  sourceType: DataSourceType;

  steps?: number;
  caloriesTotal?: number;
  caloriesActive?: number;

  restingHeartRateBpm?: number;
  averageHeartRateBpm?: number;

  stressScore?: number;
  hrvMs?: number;

  bodyBatteryMin?: number;
  bodyBatteryMax?: number;
  bodyBatteryAverage?: number;

  sleepDurationSeconds?: number;
  trainingReadinessScore?: number;

  createdAt: string;
  updatedAt: string;
};
```

### Hinweise

* Felder sind bewusst optional.
* Quellen können Garmin oder spätere Aggregatoren sein.
* Die App darf daraus keine medizinischen Diagnosen ableiten.
* Diese Entity wird später für Erholungsindikatoren und AI-Empfehlungen wichtig.

---

## 10.2 SleepSummary

### Zweck

`SleepSummary` beschreibt eine Schlafperiode.

### Scope

Endprodukt

### Wichtige Felder

```ts
type SleepSummary = {
  id: string;
  athleteProfileId: string;

  date: string;
  sourceType: DataSourceType;

  startTime?: string;
  endTime?: string;
  durationSeconds?: number;

  deepSleepSeconds?: number;
  lightSleepSeconds?: number;
  remSleepSeconds?: number;
  awakeSeconds?: number;

  sleepScore?: number;
  notes?: string;

  createdAt: string;
  updatedAt: string;
};
```

### Hinweise

* Nicht Teil des MVP.
* Später relevant für Recovery-Dashboard und AI-Coach.
* Datenqualität hängt stark von der Quelle ab.

---

# 11. Training Zone Entities

## 11.1 TrainingZoneSet

### Zweck

`TrainingZoneSet` gruppiert Trainingszonen für eine bestimmte Zone-Art.

### Scope

MVP

### Beispiele

* Heart Rate Zones
* Cycling Power Zones
* Running Pace Zones
* Swimming Pace Zones

### Wichtige Felder

```ts
type TrainingZoneSet = {
  id: string;
  athleteProfileId: string;

  sport?: SportType;
  zoneType: TrainingZoneType;
  name: string;

  basedOn?: string;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type TrainingZoneType =
  | 'heart_rate'
  | 'cycling_power'
  | 'running_pace'
  | 'swimming_pace'
  | 'perceived_effort';
```

### Hinweise

* Ein User kann mehrere Zone Sets haben.
* Im MVP reicht pro Typ ein aktives Zone Set.
* Später können Zonen historisiert werden.

---

## 11.2 TrainingZone

### Zweck

`TrainingZone` beschreibt eine einzelne Zone innerhalb eines Zone Sets.

### Scope

MVP

### Wichtige Felder

```ts
type TrainingZone = {
  id: string;
  trainingZoneSetId: string;

  zoneNumber: number;
  name: string;

  lowerBound?: number;
  upperBound?: number;

  unit: TrainingZoneUnit;
  description?: string;
};
```

### Enums

```ts
type TrainingZoneUnit =
  | 'bpm'
  | 'watts'
  | 'sec_per_km'
  | 'sec_per_100m'
  | 'rpe';
```

### Beispiele

```txt
Cycling Power Zone 2
lowerBound: 165
upperBound: 221
unit: watts

Running Easy Pace
lowerBound: 330
upperBound: 390
unit: sec_per_km
```

### Hinweise

* Pace-Zonen wirken numerisch umgekehrt, weil niedrigere Sekunden schneller sind.
* Die UI muss das entsprechend verständlich formatieren.
* AI-Coach und Workout Steps können auf Zonen referenzieren.

---

# 12. Training Plan Entities

## 12.1 TrainingPlan

### Zweck

`TrainingPlan` beschreibt einen Trainingsplan für einen Zeitraum.

Im MVP ist das meistens eine Woche.

### Scope

MVP

### Wichtige Felder

```ts
type TrainingPlan = {
  id: string;
  athleteProfileId: string;

  title: string;
  description?: string;

  startDate: string;
  endDate: string;

  status: TrainingPlanStatus;
  source: TrainingPlanSource;

  goalId?: string;
  aiCoachOutputId?: string;

  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type TrainingPlanStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived';

type TrainingPlanSource =
  | 'manual'
  | 'ai_generated'
  | 'template'
  | 'imported';
```

### Hinweise

* Ein TrainingPlan enthält mehrere PlannedWorkouts.
* AI-generierte Pläne können zunächst als Draft gespeichert werden.
* Der User entscheidet, ob ein Plan aktiv wird.

---

## 12.2 PlannedWorkout

### Zweck

`PlannedWorkout` beschreibt eine geplante Trainingseinheit.

Eine geplante Einheit ist nicht dasselbe wie eine absolvierte Aktivität.

### Scope

MVP

### Wichtige Felder

```ts
type PlannedWorkout = {
  id: string;
  trainingPlanId?: string;
  athleteProfileId: string;

  title: string;
  sport: SportType;
  workoutType: WorkoutType;

  scheduledDate: string;
  scheduledStartTime?: string;

  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;

  intensity: WorkoutIntensity;
  status: WorkoutStatus;

  objective?: string;
  description?: string;
  coachNotes?: string;

  source: PlannedWorkoutSource;
  aiCoachOutputId?: string;

  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
type WorkoutType =
  | 'endurance'
  | 'recovery'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'long'
  | 'race_specific'
  | 'technique'
  | 'strength'
  | 'mobility'
  | 'rest'
  | 'other';

type WorkoutIntensity =
  | 'rest'
  | 'recovery'
  | 'easy'
  | 'moderate'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'race'
  | 'strength';

type WorkoutStatus =
  | 'planned'
  | 'completed'
  | 'missed'
  | 'moved'
  | 'adjusted'
  | 'cancelled';

type PlannedWorkoutSource =
  | 'manual'
  | 'ai_generated'
  | 'template'
  | 'imported';
```

### Hinweise

* PlannedWorkout ist die zentrale Entity für Workout Cards.
* AI-generierte Einheiten werden als PlannedWorkout gespeichert.
* Ein PlannedWorkout kann später mit einer Activity verknüpft werden.

---

## 12.3 WorkoutStep

### Zweck

`WorkoutStep` beschreibt einen einzelnen Abschnitt eines geplanten Workouts.

### Scope

MVP

### Beispiele

* Warm-up
* Intervall
* Pause
* Cool-down
* Technikblock
* Kraftübung

### Wichtige Felder

```ts
type WorkoutStep = {
  id: string;
  plannedWorkoutId: string;

  stepIndex: number;
  stepType: WorkoutStepType;

  title?: string;
  instruction: string;

  durationSeconds?: number;
  distanceMeters?: number;
  repetitions?: number;

  targetPowerLowerWatts?: number;
  targetPowerUpperWatts?: number;

  targetHeartRateZoneId?: string;
  targetPowerZoneId?: string;
  targetPaceZoneId?: string;

  targetPaceLowerSecPerKm?: number;
  targetPaceUpperSecPerKm?: number;

  targetSwimPaceLowerSecPer100m?: number;
  targetSwimPaceUpperSecPer100m?: number;

  restSeconds?: number;

  notes?: string;
};
```

### Enums

```ts
type WorkoutStepType =
  | 'warmup'
  | 'main'
  | 'interval'
  | 'recovery'
  | 'cooldown'
  | 'technique'
  | 'strength_exercise'
  | 'rest'
  | 'other';
```

### Hinweise

* WorkoutSteps ermöglichen strukturierte AI-Ausgaben.
* Sie sind wichtig für spätere Exportfunktionen.
* Nicht jeder Step braucht alle Zielbereiche.
* Schwimmen, Radfahren und Laufen können über dieselbe Grundstruktur abgebildet werden.

---

## 12.4 StrengthExercise

### Zweck

`StrengthExercise` beschreibt Kraftübungen innerhalb eines Workouts.

### Scope

MVP optional / Post-MVP

Kann zunächst auch als spezielle WorkoutSteps abgebildet werden.

### Wichtige Felder

```ts
type StrengthExercise = {
  id: string;
  plannedWorkoutId: string;
  workoutStepId?: string;

  exerciseName: string;
  exerciseOrder: number;

  sets?: number;
  reps?: number;
  weightKg?: number;

  restSeconds?: number;
  tempo?: string;
  notes?: string;
};
```

### Hinweise

* Für den MVP reicht eventuell `WorkoutStep` mit `stepType: 'strength_exercise'`.
* Eine eigene Entity lohnt sich, wenn Krafttraining detaillierter wird.
* Krafttraining ist im MVP wichtig, aber nicht der zentrale erste Schwerpunkt.

---

## 12.5 CompletedWorkoutLink

### Zweck

`CompletedWorkoutLink` verknüpft ein geplantes Workout mit einer abgeschlossenen Activity.

### Scope

Post-MVP

### Wichtige Felder

```ts
type CompletedWorkoutLink = {
  id: string;

  plannedWorkoutId: string;
  activityId: string;

  matchType: WorkoutMatchType;
  completionStatus: WorkoutCompletionStatus;

  durationDifferenceSeconds?: number;
  distanceDifferenceMeters?: number;
  notes?: string;

  createdAt: string;
};
```

### Enums

```ts
type WorkoutMatchType =
  | 'manual'
  | 'automatic'
  | 'suggested';

type WorkoutCompletionStatus =
  | 'completed_as_planned'
  | 'completed_modified'
  | 'partially_completed'
  | 'missed'
  | 'unknown';
```

### Hinweise

* Nicht zwingend im MVP.
* Wichtig für Planerfüllung und adaptive Trainingsplanung.
* Kann später helfen, AI-Empfehlungen realistischer zu machen.

---

# 13. AI Coach Entities

## 13.1 AthleteContextSnapshot

### Zweck

`AthleteContextSnapshot` speichert den Zustand, auf dessen Basis eine AI-Antwort generiert wurde.

### Scope

MVP / Post-MVP

Im MVP kann der Athlete Context zunächst dynamisch erzeugt werden. Eine Speicherung als Snapshot ist aber sehr sinnvoll, um AI-Ausgaben nachvollziehbar zu machen.

### Wichtige Felder

```ts
type AthleteContextSnapshot = {
  id: string;
  athleteProfileId: string;

  contextVersion: string;

  generatedAt: string;

  goalSummary?: string;
  recentTrainingSummary?: string;
  availabilitySummary?: string;
  zoneSummary?: string;
  recoverySummary?: string;

  structuredContext: AthleteContext;
};
```

### Beispiel für AthleteContext

```ts
type AthleteContext = {
  athlete: {
    bodyWeightKg?: number;
    primarySports: SportType[];
    currentFtpWatts?: number;
    maxHeartRateBpm?: number;
    runningThresholdPaceSecPerKm?: number;
    swimmingThresholdPaceSecPer100m?: number;
  };

  goals: {
    title: string;
    targetDate?: string;
    sport?: SportType;
    priority: GoalPriority;
  }[];

  trainingZones: {
    zoneType: TrainingZoneType;
    sport?: SportType;
    zones: {
      name: string;
      lowerBound?: number;
      upperBound?: number;
      unit: TrainingZoneUnit;
    }[];
  }[];

  recentActivities: {
    sport: SportType;
    startTime: string;
    durationSeconds: number;
    distanceMeters?: number;
    averageHeartRateBpm?: number;
    averagePowerWatts?: number;
    averagePaceSecPerKm?: number;
  }[];

  currentWeek: {
    plannedWorkoutCount: number;
    completedActivityCount: number;
    plannedDurationSeconds?: number;
    completedDurationSeconds?: number;
  };

  availability?: TrainingAvailability[];
};
```

### Hinweise

* Der Athlete Context ist nicht einfach eine Kopie der Datenbank.
* Er ist eine gezielte, verdichtete Sicht für AI-Aufgaben.
* Snapshots helfen, später nachzuvollziehen, warum eine AI-Antwort entstanden ist.

---

## 13.2 AiCoachRequest

### Zweck

`AiCoachRequest` beschreibt eine Anfrage an den AI-Coach.

### Scope

MVP / Post-MVP

### Wichtige Felder

```ts
type AiCoachRequest = {
  id: string;
  athleteProfileId: string;

  requestType: AiCoachRequestType;
  userPrompt?: string;

  athleteContextSnapshotId?: string;

  status: AiCoachRequestStatus;

  createdAt: string;
  completedAt?: string;
};
```

### Enums

```ts
type AiCoachRequestType =
  | 'generate_week_plan'
  | 'generate_workout'
  | 'analyze_week'
  | 'adjust_plan'
  | 'general_question';

type AiCoachRequestStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed';
```

### Hinweise

* Im MVP kann diese Entity vereinfacht werden.
* Wichtig für AI-Historie und Debugging.
* Hilft, AI-Ausgaben mit konkreten Anfragen zu verbinden.

---

## 13.3 AiCoachOutput

### Zweck

`AiCoachOutput` speichert die Antwort des AI-Coaches.

### Scope

MVP

### Wichtige Felder

```ts
type AiCoachOutput = {
  id: string;
  athleteProfileId: string;

  aiCoachRequestId?: string;
  athleteContextSnapshotId?: string;

  outputType: AiCoachOutputType;
  status: AiCoachOutputStatus;

  summary?: string;
  rawText?: string;
  structuredOutput?: unknown;

  validationStatus: AiOutputValidationStatus;
  validationErrors?: string[];

  createdTrainingPlanId?: string;
  createdPlannedWorkoutId?: string;

  createdAt: string;
};
```

### Enums

```ts
type AiCoachOutputType =
  | 'week_plan'
  | 'single_workout'
  | 'week_analysis'
  | 'plan_adjustment'
  | 'recommendation'
  | 'text_answer';

type AiCoachOutputStatus =
  | 'draft'
  | 'accepted'
  | 'rejected'
  | 'archived';

type AiOutputValidationStatus =
  | 'not_validated'
  | 'valid'
  | 'invalid'
  | 'partially_valid';
```

### Hinweise

* AI-Ausgaben werden nicht blind übernommen.
* Strukturierte Ausgaben werden validiert.
* Der User entscheidet, ob ein Plan oder Workout übernommen wird.
* `rawText` kann für Debugging hilfreich sein.
* `structuredOutput` wird später durch konkrete Schemas ersetzt.

---

## 13.4 AiCoachRecommendation

### Zweck

`AiCoachRecommendation` beschreibt einzelne Empfehlungen oder Hinweise.

### Scope

Post-MVP

### Wichtige Felder

```ts
type AiCoachRecommendation = {
  id: string;
  athleteProfileId: string;

  aiCoachOutputId?: string;

  recommendationType: AiCoachRecommendationType;
  priority: RecommendationPriority;

  title: string;
  message: string;

  relatedActivityId?: string;
  relatedTrainingPlanId?: string;
  relatedPlannedWorkoutId?: string;

  status: RecommendationStatus;

  createdAt: string;
  resolvedAt?: string;
};
```

### Enums

```ts
type AiCoachRecommendationType =
  | 'training_adjustment'
  | 'recovery'
  | 'intensity_warning'
  | 'volume_suggestion'
  | 'workout_suggestion'
  | 'general';

type RecommendationPriority =
  | 'low'
  | 'medium'
  | 'high';

type RecommendationStatus =
  | 'new'
  | 'seen'
  | 'accepted'
  | 'dismissed'
  | 'resolved';
```

### Hinweise

* Für MVP nicht zwingend als eigene Entity nötig.
* Später sinnvoll für AI-Hinweise im Dashboard.
* Empfehlungen dürfen keine medizinischen Diagnosen enthalten.

---

# 14. Analytics Entities

## 14.1 WeeklySummary

### Zweck

`WeeklySummary` beschreibt aggregierte Trainingsdaten einer Woche.

### Scope

MVP / Post-MVP

Kann im MVP auch dynamisch berechnet werden.

### Wichtige Felder

```ts
type WeeklySummary = {
  id: string;
  athleteProfileId: string;

  weekStartDate: string;
  weekEndDate: string;

  totalDurationSeconds: number;
  totalDistanceMeters?: number;

  cyclingDurationSeconds?: number;
  runningDurationSeconds?: number;
  swimmingDurationSeconds?: number;
  strengthDurationSeconds?: number;

  activityCount: number;

  plannedDurationSeconds?: number;
  completedPlannedDurationSeconds?: number;

  easyDurationSeconds?: number;
  moderateDurationSeconds?: number;
  hardDurationSeconds?: number;

  createdAt: string;
  updatedAt: string;
};
```

### Hinweise

* Für Dashboard und Athlete Context wichtig.
* Kann zunächst on demand berechnet werden.
* Später kann eine gespeicherte Summary Performance verbessern.

---

## 14.2 TrainingLoadEstimate

### Zweck

`TrainingLoadEstimate` beschreibt eine einfache Belastungsschätzung.

### Scope

Post-MVP / Endprodukt

### Wichtige Felder

```ts
type TrainingLoadEstimate = {
  id: string;

  athleteProfileId: string;
  activityId?: string;
  plannedWorkoutId?: string;

  loadValue: number;
  loadMethod: TrainingLoadMethod;

  intensityFactor?: number;
  notes?: string;

  createdAt: string;
};
```

### Enums

```ts
type TrainingLoadMethod =
  | 'duration_based'
  | 'heart_rate_based'
  | 'power_based'
  | 'pace_based'
  | 'manual'
  | 'unknown';
```

### Hinweise

* Nicht nötig für MVP v1.
* Später wichtig für Belastungstrends und adaptive Planung.
* Methode muss transparent sein, damit Werte nicht fälschlich als exakte Wahrheit wirken.

---

# 15. Beziehungen zwischen Entities

## 15.1 Hauptbeziehungen

```txt
AthleteProfile
  ├── TrainingGoal[]
  ├── TrainingZoneSet[]
  ├── ImportedFile[]
  ├── RawActivityData[]
  ├── Activity[]
  ├── TrainingPlan[]
  ├── PlannedWorkout[]
  ├── AthleteContextSnapshot[]
  └── AiCoachOutput[]

TrainingZoneSet
  └── TrainingZone[]

ImportedFile
  ├── RawActivityData?
  └── Activity?

Activity
  ├── ActivityLap[]
  ├── ActivityMetricSample[]
  └── CompletedWorkoutLink?

TrainingPlan
  └── PlannedWorkout[]

PlannedWorkout
  ├── WorkoutStep[]
  ├── StrengthExercise[]
  └── CompletedWorkoutLink?

AiCoachOutput
  ├── TrainingPlan?
  ├── PlannedWorkout?
  └── AiCoachRecommendation[]
```

## 15.2 Wichtigste Trennungen

### Activity vs. PlannedWorkout

Eine `Activity` ist abgeschlossen.

Ein `PlannedWorkout` ist geplant.

Diese Trennung ist wichtig, weil geplante und absolvierte Einheiten unterschiedliche Informationen haben.

```txt
PlannedWorkout
Was soll trainiert werden?

Activity
Was wurde tatsächlich trainiert?
```

### RawActivityData vs. Activity

`RawActivityData` enthält externe oder importierte Rohdaten.

`Activity` enthält die normalisierte interne Sicht.

```txt
RawActivityData
unverändert, quellspezifisch, nicht direkt für UI

Activity
normalisiert, app-intern, Grundlage für UI und AI
```

### AiCoachOutput vs. TrainingPlan

`AiCoachOutput` beschreibt die AI-Antwort.

`TrainingPlan` beschreibt den tatsächlich gespeicherten Plan.

Eine AI-Antwort kann verworfen werden und trotzdem als Output existieren.

---

# 16. MVP Minimal Data Model

Für den ersten Build sollte das Datenmodell bewusst klein bleiben.

## 16.1 Minimal notwendige Entities

```txt
AthleteProfile
TrainingGoal
TrainingZoneSet
TrainingZone
ImportedFile
RawActivityData
Activity
TrainingPlan
PlannedWorkout
WorkoutStep
AthleteContextSnapshot
AiCoachOutput
```

## 16.2 Optional im ersten Build

```txt
ActivityLap
ActivityMetricSample
CompletedWorkoutLink
WeeklySummary
ImportJob
AiCoachRequest
```

## 16.3 Nicht im ersten Build

```txt
DataSourceConnection
DailyHealthSummary
SleepSummary
TrainingLoadEstimate
AiCoachRecommendation
StrengthExercise als eigene Entity
Multi-User-Rollen
Coach-Modell
Payment-Modell
Social-Modell
```

---

# 17. Beispiel: Import einer Aktivität

## 17.1 Ablauf

```txt
1. User lädt FIT-Datei hoch
2. ImportedFile wird erstellt
3. Datei wird validiert
4. RawActivityData wird gespeichert oder referenziert
5. Parser liest Aktivitätsdaten
6. Normalizer erzeugt Activity
7. Deduplizierung prüft mögliche Duplikate
8. Activity wird gespeichert
9. Dashboard kann neue Aktivität anzeigen
10. Athlete Context kann neue Aktivität berücksichtigen
```

## 17.2 Entstehende Daten

```txt
ImportedFile
  fileName: ride.fit
  fileType: fit
  importStatus: success

RawActivityData
  sourceType: manual_fit_upload
  rawFormat: fit

Activity
  sport: cycling
  startTime: 2026-06-15T08:00:00.000Z
  durationSeconds: 7200
  distanceMeters: 65000
  averagePowerWatts: 205
  averageHeartRateBpm: 142
```

---

# 18. Beispiel: AI-generierter Wochenplan

## 18.1 Ablauf

```txt
1. User fordert Wochenplan an
2. Backend erzeugt AthleteContextSnapshot
3. AI-Coach generiert strukturierten Wochenplan
4. AiCoachOutput wird gespeichert
5. Ausgabe wird validiert
6. User prüft den Vorschlag
7. Bei Übernahme wird ein TrainingPlan erstellt
8. PlannedWorkouts und WorkoutSteps werden erstellt
9. Wochenplan zeigt die Workouts als Cards
```

## 18.2 Entstehende Daten

```txt
AthleteContextSnapshot
  contains recent activities, goals, zones and availability

AiCoachOutput
  outputType: week_plan
  validationStatus: valid
  status: draft

TrainingPlan
  source: ai_generated
  status: active

PlannedWorkout
  sport: cycling
  workoutType: threshold
  intensity: threshold

WorkoutStep
  stepType: interval
  durationSeconds: 600
  targetPowerLowerWatts: 280
  targetPowerUpperWatts: 300
```

---

# 19. Beispiel: Workout Card Daten

Eine Workout Card sollte nicht das vollständige Workout-Modell benötigen.

Dafür kann ein DTO erzeugt werden.

```ts
type WorkoutCardDto = {
  id: string;
  title: string;
  sport: SportType;
  scheduledDate: string;
  plannedDurationSeconds?: number;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  objective?: string;
};
```

Das eigentliche `PlannedWorkout` kann deutlich mehr Daten enthalten.

---

# 20. Beispiel: Activity List Item Daten

Auch die Aktivitätsliste braucht nur eine reduzierte Sicht.

```ts
type ActivityListItemDto = {
  id: string;
  title?: string;
  sport: SportType;
  startTime: string;
  durationSeconds: number;
  distanceMeters?: number;
  averageHeartRateBpm?: number;
  averagePowerWatts?: number;
  averagePaceSecPerKm?: number;
  averageSpeedKmh?: number;
  sourceType: DataSourceType;
};
```

Die Detailansicht kann zusätzliche Daten laden.

---

# 21. Validierung

## 21.1 Importvalidierung

Importierte Aktivitäten müssen mindestens enthalten:

```txt
sport
startTime
durationSeconds
sourceType
```

Weitere Felder sind optional.

## 21.2 Planned Workout Validierung

Geplante Workouts müssen mindestens enthalten:

```txt
title
sport
scheduledDate
intensity
status
```

## 21.3 Workout Step Validierung

Workout Steps müssen mindestens enthalten:

```txt
stepIndex
stepType
instruction
```

Je nach Step-Type können zusätzliche Felder erforderlich sein.

Beispiele:

```txt
interval
braucht Dauer oder Distanz

strength_exercise
braucht Übungsname oder klare Instruction

recovery
braucht Dauer, Distanz oder erklärende Instruction
```

## 21.4 AI Output Validierung

AI-Ausgaben müssen geprüft werden, bevor sie gespeichert oder übernommen werden.

Mindestanforderungen für Wochenplan:

```txt
weekStart oder Zeitraum
mindestens ein PlannedWorkout
jedes Workout mit Sportart, Titel, Datum und Beschreibung
strukturierte Steps oder klare Workout-Beschreibung
```

Mindestanforderungen für Einzelworkout:

```txt
Sportart
Titel
Ziel der Einheit
Dauer oder Distanz
mindestens ein strukturierter Step oder eine klare Beschreibung
```

---

# 22. Offene Datenmodell-Entscheidungen

Folgende Entscheidungen sind noch offen und sollten später in ADRs oder beim Prisma-Schema geklärt werden.

## 22.1 Raw Data Speicherung

Optionen:

* Rohdaten direkt als JSON in PostgreSQL speichern
* Rohdaten als Datei speichern und nur referenzieren
* Mischform je nach Format

Tendenz:

* JSON und kleine Payloads in PostgreSQL
* große FIT/GPX/TCX-Dateien als Datei oder Storage-Objekt referenzieren

## 22.2 ActivityMetricSample Speicherung

Optionen:

* alle Samples relational speichern
* als JSONB speichern
* für MVP gar nicht speichern
* später spezialisierte Speicherung einführen

Tendenz:

* für MVP nicht vollständig speichern
* erst Activity Summary und optional Laps priorisieren

## 22.3 Strength Training Modell

Optionen:

* Krafttraining über WorkoutSteps abbilden
* eigene StrengthExercise Entity einführen
* später ein vollständiges Exercise-Modell erstellen

Tendenz:

* MVP mit WorkoutSteps starten
* eigene Entity erst bei Bedarf

## 22.4 Athlete Context speichern oder nur dynamisch erzeugen

Optionen:

* Context immer dynamisch erzeugen
* Context Snapshot pro AI-Anfrage speichern
* nur strukturierte Kurzfassung speichern

Tendenz:

* Snapshot pro AI-Anfrage speichern, um AI-Ausgaben nachvollziehbar zu machen

## 22.5 WeeklySummary speichern oder berechnen

Optionen:

* immer on demand berechnen
* regelmäßig speichern
* bei Aktivitätsimport aktualisieren

Tendenz:

* MVP on demand
* später gespeicherte Summaries für Performance

---

# 23. Konsequenzen für die Implementierung

## 23.1 Erstes Prisma-Schema

Das erste Prisma-Schema sollte sich auf MVP-Entities konzentrieren.

Priorität:

```txt
AthleteProfile
TrainingGoal
TrainingZoneSet
TrainingZone
ImportedFile
RawActivityData
Activity
TrainingPlan
PlannedWorkout
WorkoutStep
AthleteContextSnapshot
AiCoachOutput
```

## 23.2 Keine Übermodellierung

Folgende Modelle sollten nicht direkt im ersten Prisma-Schema überkomplex umgesetzt werden:

```txt
ActivityMetricSample
DailyHealthSummary
SleepSummary
DataSourceConnection
TrainingLoadEstimate
Coach Mode
Multi-User Roles
Payment
Social Features
```

## 23.3 DTOs statt direkte Datenbankmodelle

Frontend und API sollten mit DTOs arbeiten, nicht direkt mit Datenbankmodellen.

Beispiele:

```txt
ActivityListItemDto
ActivityDetailDto
WorkoutCardDto
WorkoutDetailDto
DashboardSummaryDto
TrainingPlanDto
AiGeneratedPlanDto
```

---

# 24. Zusammenfassung

Das Datenmodell von `pp-trainer` basiert auf einem eigenen internen Trainingsmodell.

Die wichtigsten Trennungen sind:

* externe Datenquelle vs. interne App-Daten
* Rohdaten vs. normalisierte Daten
* geplantes Workout vs. abgeschlossene Aktivität
* AI-Ausgabe vs. übernommener Trainingsplan
* gespeicherte Daten vs. DTOs für die UI

Für den MVP reicht ein fokussiertes Modell mit:

* Athlete Profile
* Trainingszonen
* Importdaten
* Aktivitäten
* Trainingsplänen
* geplanten Workouts
* Workout Steps
* Athlete Context
* AI Outputs

Spätere Erweiterungen wie Health-Daten, Garmin Sync, Strava Sync, Zeitreihendaten, Planerfüllung, Trainingsbelastung und adaptive Planung werden vorbereitet, aber nicht direkt in den ersten Build gezogen.

Der stabile Kern bleibt:

> Externe Datenquellen sind austauschbar. Das interne Trainingsdatenmodell ist die Grundlage der gesamten App.