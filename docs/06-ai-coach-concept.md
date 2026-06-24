# AI Coach Concept

Stand: 24.06.2026 (Phase 6 abgeschlossen)

## 1. Ziel dieser Datei

Diese Datei beschreibt das AI-Coach-Konzept von `pp-trainer`.

Der AI-Coach ist eine der zentralen Funktionen der App. Er soll nicht nur allgemeine Antworten geben, sondern auf Basis der gespeicherten Trainingsdaten, Ziele, Leistungswerte und Verfügbarkeiten konkrete Trainingspläne und einzelne Workouts erzeugen.

Das Ziel ist nicht, einen beliebigen Chatbot in die App einzubauen. Stattdessen soll der AI-Coach als strukturierter Trainingsassistent funktionieren.

Der AI-Coach soll:

* Trainingsdaten verstehen
* aktuelle Ziele berücksichtigen
* verfügbare Trainingstage einbeziehen
* sportartspezifische Workouts erzeugen
* Wochenpläne erstellen
* Einheiten in strukturierter Form zurückgeben
* Vorschläge erklären
* keine medizinischen Diagnosen stellen
* keine Änderungen ohne Bestätigung übernehmen

---

## 2. Grundidee

Der AI-Coach arbeitet nicht direkt mit Rohdaten aus Garmin, FIT-Dateien, Strava oder anderen Quellen.

Stattdessen erzeugt das Backend aus den gespeicherten App-Daten einen strukturierten `AthleteContext`.

Dieser Kontext bildet die Grundlage für jede AI-Anfrage.

Grundprinzip:

```txt
Internal App Data
        ↓
Athlete Context Builder
        ↓
Structured Athlete Context
        ↓
AI Coach Request
        ↓
Structured AI Output
        ↓
Validation
        ↓
User Review
        ↓
Training Plan / Planned Workout
```

Der AI-Coach soll also keine unkontrollierte Blackbox sein. Er bekommt einen klar definierten Kontext und muss in einem klar definierten Format antworten.

---

## 3. Rolle des AI-Coaches

Der AI-Coach ist ein digitaler Trainingsassistent für Ausdauer- und Krafttraining.

Er soll unterstützen bei:

* Wochenplanung
* Einheitenplanung
* Trainingsstruktur
* Belastungssteuerung
* Einordnung vergangener Trainingswochen
* Anpassung einzelner Einheiten
* sportartspezifischer Ausarbeitung von Workouts

Der AI-Coach ersetzt keinen menschlichen Trainer und keine medizinische Beratung.

Er soll Empfehlungen geben, die der User prüfen, anpassen und übernehmen kann.

---

## 4. Abgrenzung

## 4.1 Was der AI-Coach sein soll

Der AI-Coach soll:

* strukturierte Trainingsvorschläge erzeugen
* konkrete Workouts mit Schritten erstellen
* Intensitätsbereiche auf Basis von Zonen nutzen
* Trainingsziele berücksichtigen
* Belastung und Erholung vorsichtig einordnen
* Pläne verständlich erklären
* Vorschläge als bearbeitbare Daten zurückgeben

## 4.2 Was der AI-Coach nicht sein soll

Der AI-Coach soll nicht:

* medizinische Diagnosen stellen
* Verletzungen bewerten oder diagnostizieren
* Trainingspläne ohne Bestätigung automatisch ändern
* Datenquellen direkt abfragen
* Rohdaten selbst interpretieren, wenn das Backend bereits strukturierte Daten liefert
* unrealistische oder zu aggressive Trainingssteigerungen erzwingen
* als vollständiger Ersatz für Garmin, TrainingPeaks oder einen menschlichen Coach auftreten

---

## 5. MVP-Scope des AI-Coaches

Der MVP soll nur die wichtigsten AI-Funktionen enthalten.

## 5.1 Enthalten im MVP

Der MVP enthält:

* Athlete Context Builder
* AI-generierter Wochenplan
* AI-generierte Einzeleinheit
* strukturierte Workout-Ausgabe
* strukturierte Plan-Ausgabe
* Validierung der AI-Ausgabe
* User-Bestätigung vor Übernahme
* Speicherung von AI-generierten Workouts oder Plänen

## 5.2 Nicht enthalten im MVP

Nicht Teil des MVP:

* vollautomatische adaptive Planung
* automatische Planänderung ohne Bestätigung
* medizinische Recovery-Bewertung
* langfristige Saisonplanung
* komplexe Race-Periodisierung
* Export zu Garmin, Zwift oder MyWhoosh
* Live-Anpassung während einer Einheit
* permanente Chat-Historie als zentrales Steuerungselement

---

## 6. AI-Coach Use Cases

## 6.1 Wochenplan generieren

### Ziel

Der User fordert einen Trainingsplan für eine Woche an.

### Input

* Athlete Profile
* Ziele
* verfügbare Trainingstage
* Trainingszonen
* letzte Aktivitäten
* aktueller Trainingsumfang
* geplante oder verpasste Einheiten
* optionale User-Vorgaben

### Output

* TrainingPlan
* mehrere PlannedWorkouts
* WorkoutSteps
* kurze Begründung des Plans

### Beispiel

```txt
Erstelle mir für nächste Woche einen Trainingsplan mit Fokus auf Rad-Grundlage und einem Laufreiz. Montag und Dienstag sind zeitlich schwierig, Samstag geht eine längere Einheit.
```

---

## 6.2 Einzelnes Workout generieren

### Ziel

Der User fordert eine konkrete Einheit an.

### Input

* Sportart
* Ziel der Einheit
* Dauer oder Distanz
* Intensität
* Trainingszonen
* aktuelle Belastung
* optionaler Kontext aus der aktuellen Woche

### Output

* ein PlannedWorkout
* strukturierte WorkoutSteps
* Zielbereiche
* Hinweise zur Durchführung

### Beispiele

```txt
Erstelle mir eine 90-minütige Radeinheit mit Schwellenintervallen.
```

```txt
Erstelle mir eine Schwimmeinheit mit Technikfokus und kurzen Intervallen.
```

```txt
Erstelle mir einen lockeren Lauf für morgen, maximal 60 Minuten.
```

---

## 6.3 Trainingswoche analysieren

### Scope

Post-MVP

### Ziel

Der AI-Coach analysiert eine vergangene oder aktuelle Trainingswoche.

### Output

* kurze Zusammenfassung
* Umfang pro Sportart
* Belastungseinordnung
* Auffälligkeiten
* Vorschlag für die nächste Woche

### Hinweis

Diese Funktion ist nicht zwingend für den MVP nötig, aber logisch der nächste Schritt nach Wochenplan und Einzeleinheit.

---

## 6.4 Verpasste Einheit einordnen

### Scope

Post-MVP / Endprodukt

### Ziel

Der User gibt an, dass eine Einheit verpasst wurde. Der AI-Coach schlägt vor, ob sie nachgeholt, ersetzt oder gestrichen werden sollte.

### Grundsatz

Verpasste Einheiten sollen nicht automatisch ungeprüft nachgeholt werden.

Der AI-Coach soll vorsichtig abwägen:

* aktuelle Belastung
* Wichtigkeit der Einheit
* verbleibende Woche
* nächstes Ziel
* Regenerationsbedarf

---

## 6.5 Adaptive Plananpassung

### Scope

Endprodukt

### Ziel

Der AI-Coach schlägt Planänderungen vor, wenn sich Trainingsrealität und Planung unterscheiden.

### Beispiele

* Einheit verschieben
* Intensität reduzieren
* Umfang anpassen
* Ruhetag empfehlen
* Alternativtraining vorschlagen

### Wichtig

Auch hier gilt:

> Keine automatische Änderung ohne User-Bestätigung.

---

# 7. Athlete Context

## 7.1 Ziel

Der `AthleteContext` ist die zentrale Eingabe für den AI-Coach.

Er fasst alle relevanten Daten strukturiert zusammen, ohne dem Modell unnötige Rohdaten zu geben.

Der AI-Coach soll nicht selbst in der Datenbank suchen und nicht direkt externe Quellen interpretieren.

---

## 7.2 Inhalte des Athlete Context

Ein Athlete Context kann folgende Bereiche enthalten:

```txt
Athlete Profile
Training Goals
Training Availability
Training Zones
Recent Activities
Current Week Summary
Planned Workouts
Missed Workouts
Performance Values
Recovery Indicators
User Instructions
```

---

## 7.3 Beispielstruktur

```ts
type AthleteContext = {
  athlete: {
    displayName?: string;
    bodyWeightKg?: number;
    heightCm?: number;
    primarySports: SportType[];

    currentFtpWatts?: number;
    maxHeartRateBpm?: number;
    restingHeartRateBpm?: number;

    runningThresholdPaceSecPerKm?: number;
    swimmingThresholdPaceSecPer100m?: number;
  };

  goals: {
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
  }[];

  availability: {
    weekday: Weekday;
    available: boolean;
    maxDurationMinutes?: number;
    preferredSports?: SportType[];
    notes?: string;
  }[];

  trainingZones: {
    zoneType: TrainingZoneType;
    sport?: SportType;
    zones: {
      zoneNumber: number;
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
    averageSpeedKmh?: number;
    perceivedExertion?: number;
  }[];

  currentWeek: {
    weekStartDate: string;
    plannedWorkoutCount: number;
    completedActivityCount: number;
    plannedDurationSeconds?: number;
    completedDurationSeconds?: number;
    completedDurationBySport?: Record<SportType, number>;
  };

  plannedWorkouts?: {
    sport: SportType;
    title: string;
    scheduledDate: string;
    plannedDurationSeconds?: number;
    intensity: WorkoutIntensity;
    status: WorkoutStatus;
  }[];

  userInstruction?: string;
};
```

---

## 7.4 Context-Größe

Der Athlete Context soll kompakt bleiben.

Nicht sinnvoll:

```txt
Alle Rohdaten jeder Aktivität
Alle GPS-Punkte
Alle Herzfrequenzsamples
Alle FIT-Dateien
Alle historischen Trainingsdaten
```

Sinnvoll:

```txt
Zusammenfassung der letzten 7 Tage
Zusammenfassung der letzten 4 Wochen
relevante Zielwerte
aktive Trainingszonen
aktuelle geplante Woche
relevante letzte Aktivitäten
```

---

## 7.5 Context-Versionierung

Der Athlete Context sollte versioniert werden.

Beispiel:

```txt
contextVersion: "v1"
```

Grund:

* AI-Ausgaben bleiben nachvollziehbar
* Änderungen am Kontextformat können kontrolliert erfolgen
* gespeicherte AI-Antworten können später besser interpretiert werden

---

## 7.6 Athlete Context Snapshot

Für AI-Anfragen sollte ein Snapshot gespeichert werden.

Zweck:

* Nachvollziehbarkeit
* Debugging
* Reproduzierbarkeit
* spätere Bewertung der AI-Ausgabe

Beispiel:

```txt
AiCoachRequest
        ↓
AthleteContextSnapshot
        ↓
AiCoachOutput
        ↓
TrainingPlan / PlannedWorkout
```

---

# 8. AI Output Types

Der AI-Coach kann verschiedene Output-Typen erzeugen.

```ts
type AiCoachOutputType =
  | 'week_plan'
  | 'single_workout'
  | 'week_analysis'
  | 'plan_adjustment'
  | 'recommendation'
  | 'text_answer';
```

## 8.1 Week Plan Output

Ein Wochenplan enthält mehrere geplante Workouts.

```ts
type AiGeneratedWeekPlan = {
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  focus: string;
  summary: string;
  workouts: AiGeneratedWorkout[];
};
```

## 8.2 Single Workout Output

Eine Einzeleinheit enthält ein geplantes Workout.

```ts
type AiGeneratedSingleWorkout = {
  workout: AiGeneratedWorkout;
};
```

## 8.3 Workout Output

```ts
type AiGeneratedWorkout = {
  title: string;
  sport: SportType;
  workoutType: WorkoutType;
  scheduledDate?: string;

  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;

  intensity: WorkoutIntensity;
  objective: string;
  description: string;

  steps: AiGeneratedWorkoutStep[];

  coachNotes?: string;
};
```

## 8.4 Workout Step Output

```ts
type AiGeneratedWorkoutStep = {
  stepIndex: number;
  stepType: WorkoutStepType;

  title?: string;
  instruction: string;

  durationSeconds?: number;
  distanceMeters?: number;
  repetitions?: number;

  targetPowerLowerWatts?: number;
  targetPowerUpperWatts?: number;

  targetPaceLowerSecPerKm?: number;
  targetPaceUpperSecPerKm?: number;

  targetSwimPaceLowerSecPer100m?: number;
  targetSwimPaceUpperSecPer100m?: number;

  targetHeartRateZoneName?: string;
  targetPowerZoneName?: string;
  targetPaceZoneName?: string;

  restSeconds?: number;
  notes?: string;
};
```

---

# 9. Strukturierte Ausgabe als Grundsatz

AI-Ausgaben dürfen im MVP nicht nur als Freitext behandelt werden.

Schlecht:

```txt
Mach 15 Minuten locker warm, dann ein paar Intervalle und danach ausfahren.
```

Besser:

```json
{
  "title": "Threshold Bike Intervals",
  "sport": "cycling",
  "plannedDurationSeconds": 5400,
  "intensity": "threshold",
  "objective": "Improve sustained threshold power",
  "steps": [
    {
      "stepIndex": 1,
      "stepType": "warmup",
      "durationSeconds": 900,
      "instruction": "Easy warm-up in Zone 1 to Zone 2"
    },
    {
      "stepIndex": 2,
      "stepType": "interval",
      "durationSeconds": 600,
      "targetPowerLowerWatts": 280,
      "targetPowerUpperWatts": 300,
      "instruction": "Ride close to threshold power"
    }
  ]
}
```

Die strukturierte Ausgabe ermöglicht:

* Workout Cards
* Workout Detail Views
* Validierung
* Speicherung
* spätere Exporte
* spätere Plananpassungen

---

# 10. Validierung der AI-Ausgabe

## 10.1 Warum Validierung notwendig ist

AI-Ausgaben können unvollständig, widersprüchlich oder unbrauchbar sein.

Deshalb darf eine AI-Antwort nicht direkt ungeprüft gespeichert werden.

Die App validiert:

* Pflichtfelder
* gültige Sportarten
* gültige Intensitäten
* gültige Datumswerte
* sinnvolle Dauer
* sinnvolle Reihenfolge der Steps
* vorhandene Beschreibung
* realistische Zielbereiche

---

## 10.2 Mindestanforderungen an einen Wochenplan

Ein AI-generierter Wochenplan ist nur gültig, wenn:

* ein Titel vorhanden ist
* ein Wochenzeitraum vorhanden ist
* mindestens ein Workout vorhanden ist
* jedes Workout eine Sportart hat
* jedes Workout ein Datum hat
* jedes Workout einen Titel hat
* jedes Workout eine Intensität hat
* jedes Workout ein Ziel oder eine Beschreibung hat

---

## 10.3 Mindestanforderungen an ein einzelnes Workout

Ein AI-generiertes Workout ist nur gültig, wenn:

* eine Sportart vorhanden ist
* ein Titel vorhanden ist
* ein Ziel vorhanden ist
* eine Dauer oder Distanz vorhanden ist
* eine Intensität vorhanden ist
* mindestens ein Step oder eine klare Beschreibung vorhanden ist

---

## 10.4 Validierungsstatus

```ts
type AiOutputValidationStatus =
  | 'not_validated'
  | 'valid'
  | 'invalid'
  | 'partially_valid';
```

Ungültige Ausgaben dürfen nicht direkt als aktive Workouts gespeichert werden.

---

# 11. User Confirmation Flow

AI-generierte Inhalte werden nicht automatisch übernommen.

Der User muss entscheiden, was mit einem Vorschlag passiert.

```txt
AI Output Generated
        ↓
Validation
        ↓
Preview
        ↓
User Decision
        ↓
Accept / Edit / Reject
        ↓
Save as TrainingPlan or PlannedWorkout
```

## 11.1 Mögliche Aktionen

Der User kann:

* Vorschlag übernehmen
* Vorschlag bearbeiten
* Vorschlag verwerfen
* neuen Vorschlag generieren
* einzelne Workouts aus einem Wochenplan übernehmen

## 11.2 Status

```ts
type AiCoachOutputStatus =
  | 'draft'
  | 'accepted'
  | 'rejected'
  | 'archived';
```

---

# 12. Sportartspezifische Anforderungen

## 12.1 Radfahren

Der AI-Coach soll Radeinheiten mit Watt, Puls oder Intensitätszonen planen können.

Mögliche Einheiten:

* Grundlage
* lange Ausfahrt
* Tempo
* Sweet Spot
* Schwelle
* VO2max
* Over-Unders
* Koppelfahrt
* Race Simulation

Mögliche Vorgaben:

* Dauer
* Wattbereich
* Powerzone
* Herzfrequenzzone
* Kadenzhinweis
* Belastungsziel

Beispiel:

```txt
3 x 10 Minuten bei 280 bis 300 Watt mit 5 Minuten locker dazwischen.
```

---

## 12.2 Laufen

Der AI-Coach soll Laufeinheiten mit Pace, Puls oder Intensitätszonen planen können.

Mögliche Einheiten:

* lockerer Dauerlauf
* langer Lauf
* Tempodauerlauf
* Schwellenintervalle
* VO2max-Intervalle
* Steigerungen
* Koppellauf
* Race Pace Einheit

Mögliche Vorgaben:

* Dauer
* Distanz
* Pacebereich
* Herzfrequenzzone
* Erholungszeit
* Untergrund oder Höhenmeterhinweis

Beispiel:

```txt
6 x 3 Minuten zügig mit 2 Minuten locker traben.
```

---

## 12.3 Schwimmen

Der AI-Coach soll Schwimmeinheiten mit Distanz, Technikübungen, Intervallen und Pausen planen können.

Mögliche Einheiten:

* Technikfokus
* Grundlagenumfang
* kurze Intervalle
* längere Intervalle
* Pullbuoy Sets
* Paddles Sets
* CSS-orientierte Sets
* Wettkampfspezifische Sets

Mögliche Vorgaben:

* Gesamtdistanz
* Teilstrecken
* Pausen
* Technikdrills
* Pace pro 100 Meter
* Hilfsmittel

Beispiel:

```txt
400 m einschwimmen, 6 x 50 m Technik, 8 x 100 m zügig mit 20 Sekunden Pause, 200 m ausschwimmen.
```

---

## 12.4 Krafttraining

Der AI-Coach soll Krafttraining ergänzend zum Ausdauertraining planen können.

Mögliche Einheiten:

* Unterkörper
* Oberkörper
* Core
* Stabilität
* Mobility
* Prehab

Mögliche Vorgaben:

* Übungen
* Sätze
* Wiederholungen
* Pause
* Intensität
* Hinweis zur Belastung im Kontext des Ausdauertrainings

Beispiel:

```txt
3 Sätze Bulgarian Split Squats, 3 Sätze Romanian Deadlifts, Core-Stabilität und Mobility.
```

---

# 13. Prompt Strategy

## 13.1 Grundidee

Prompts sollen nicht im Frontend frei zusammengebaut werden.

Die Prompt-Erstellung liegt im Backend.

Das Backend kombiniert:

* Systemrolle
* Athlete Context
* konkrete User-Anfrage
* gewünschtes Ausgabeformat
* Regeln und Grenzen

---

## 13.2 Systemrolle

Die Systemrolle beschreibt das Verhalten des AI-Coaches.

Beispiel:

```txt
You are an AI training assistant for endurance and strength training.
You create practical, structured and safe training suggestions.
You work with the provided athlete context only.
You do not make medical diagnoses.
You return structured output according to the requested schema.
```

---

## 13.3 Kontext

Der Kontext wird aus dem Backend eingefügt.

Beispiel:

```txt
Athlete Context:
- Primary sports: cycling, running, swimming, strength
- Current FTP: 294 W
- Max heart rate: 206 bpm
- Recent training volume: ...
- Available days: ...
- Current goal: ...
```

In der Implementierung sollte der Kontext nicht als unstrukturierter Text, sondern möglichst als strukturiertes Objekt übergeben werden.

---

## 13.4 User Instruction

Die User Instruction enthält die konkrete Anfrage.

Beispiel:

```txt
Create a training week for the week starting 2026-06-22.
Focus on cycling endurance and one quality run.
Monday and Tuesday should be light because of limited time.
```

---

## 13.5 Output Instruction

Die Output Instruction legt fest, welches Format erwartet wird.

Beispiel:

```txt
Return a structured week plan with title, weekStartDate, weekEndDate, focus, summary and workouts.
Each workout must include sport, title, scheduledDate, intensity, objective, description and steps.
```

---

# 14. AI Request Types

## 14.1 generate_week_plan

Erzeugt einen Wochenplan.

Input:

* Athlete Context
* Zielwoche
* optionaler Fokus
* verfügbare Zeit
* User Instruction

Output:

* AiGeneratedWeekPlan

---

## 14.2 generate_workout

Erzeugt ein einzelnes Workout.

Input:

* Athlete Context
* Sportart
* Ziel
* Dauer oder Distanz
* gewünschte Intensität
* Datum

Output:

* AiGeneratedSingleWorkout

---

## 14.3 analyze_week

Analysiert eine Trainingswoche.

Scope:

Post-MVP

Output:

* Zusammenfassung
* Auffälligkeiten
* Empfehlungen

---

## 14.4 adjust_plan

Schlägt Anpassungen an einem bestehenden Plan vor.

Scope:

Endprodukt

Output:

* Änderungsvorschläge
* Begründung
* betroffene Workouts

---

## 14.5 general_question

Beantwortet eine allgemeine Trainingsfrage auf Basis des Athlete Context.

Scope:

Post-MVP

Hinweis:

Diese Funktion sollte nicht die zentrale MVP-Funktion sein. Der MVP fokussiert sich auf strukturierte Generierung von Plänen und Workouts.

---

# 15. API-Konzept

## 15.1 MVP-Endpunkte

Mögliche Backend-Endpunkte:

```txt
POST /api/ai/generate-week-plan
POST /api/ai/generate-workout
GET  /api/ai/outputs/:id
POST /api/ai/outputs/:id/accept
POST /api/ai/outputs/:id/reject
```

## 15.2 Post-MVP-Endpunkte

```txt
POST /api/ai/analyze-week
POST /api/ai/adjust-plan
GET  /api/ai/history
```

## 15.3 Beispielablauf Wochenplan

```txt
Frontend
        ↓
POST /api/ai/generate-week-plan
        ↓
Backend builds AthleteContextSnapshot
        ↓
Backend sends request to AI provider
        ↓
Backend validates structured output
        ↓
Backend stores AiCoachOutput
        ↓
Frontend receives preview
        ↓
User accepts
        ↓
Backend creates TrainingPlan and PlannedWorkouts
```

---

# 16. Datenmodell-Bezug

Das AI-Coach-Konzept nutzt folgende Entities aus dem Datenmodell:

```txt
AthleteProfile
TrainingGoal
TrainingAvailability
TrainingZoneSet
TrainingZone
Activity
TrainingPlan
PlannedWorkout
WorkoutStep
AthleteContextSnapshot
AiCoachRequest
AiCoachOutput
AiCoachRecommendation
```

## 16.1 Wichtigste Beziehung

```txt
AthleteContextSnapshot
        ↓
AiCoachRequest
        ↓
AiCoachOutput
        ↓
TrainingPlan / PlannedWorkout
```

## 16.2 AI-Ausgabe vs. gespeicherter Plan

Eine AI-Ausgabe ist nicht automatisch ein aktiver Trainingsplan.

```txt
AiCoachOutput
Status: draft
        ↓
User accepts
        ↓
TrainingPlan
Status: active
```

Dadurch bleibt der User in Kontrolle.

---

# 17. Sicherheit und Grenzen

## 17.1 Keine medizinischen Diagnosen

Der AI-Coach darf keine medizinischen Diagnosen stellen.

Nicht erlaubt:

* Verletzungen diagnostizieren
* Krankheiten bewerten
* medizinische Freigaben geben
* Symptome verbindlich interpretieren

Erlaubt:

* Trainingsempfehlungen vorsichtig formulieren
* auf hohe Belastung hinweisen
* lockere Einheit oder Ruhetag vorschlagen
* bei gesundheitlichen Beschwerden auf professionelle Abklärung verweisen

---

## 17.2 Keine automatische Überforderung

Der AI-Coach soll keine unrealistischen Trainingssprünge erzeugen.

Beispiele für Regeln:

* Umfang nicht stark erhöhen, wenn keine ausreichende Basis vorhanden ist
* harte Einheiten nicht direkt aufeinander häufen
* Ruhetage oder lockere Tage berücksichtigen
* verfügbare Zeit respektieren
* bei unklaren Daten eher konservativ planen

---

## 17.3 Transparenz

AI-Vorschläge sollten nachvollziehbar sein.

Ein Plan sollte eine kurze Begründung enthalten.

Beispiele:

```txt
Diese Woche enthält nur eine harte Laufeinheit, weil die letzte Woche bereits einen hohen Radumfang hatte.
```

```txt
Die lange Radeinheit liegt am Samstag, weil dort am meisten Zeit verfügbar ist.
```

---

## 17.4 Datenschutz

Der AI-Coach bekommt nur die Daten, die für die konkrete Aufgabe notwendig sind.

Nicht notwendig:

* vollständige Rohdaten
* vollständige Datei-Inhalte
* GPS-Rohdaten jeder Aktivität
* unnötige persönliche Informationen

Notwendig:

* Ziele
* Leistungswerte
* Trainingszonen
* aktuelle Trainingshistorie
* Verfügbarkeit
* relevante Einschränkungen

---

# 18. Error Handling

## 18.1 Mögliche Fehler

```txt
Athlete context incomplete
AI provider unavailable
Invalid AI output
AI output missing required fields
Validation failed
Workout could not be created
Training plan could not be saved
```

## 18.2 Umgang mit Fehlern

Die App soll:

* Fehler verständlich anzeigen
* keine unvollständigen Pläne speichern
* AI-Ausgaben validieren
* bei Bedarf erneute Generierung ermöglichen
* Logs für Debugging speichern

---

# 19. Testing Strategy

## 19.1 Testbereiche

Wichtige Tests:

* Athlete Context Builder Tests
* AI Output Schema Validation Tests
* Week Plan Mapping Tests
* Workout Mapping Tests
* User Confirmation Flow Tests
* Error Handling Tests

## 19.2 Beispiel-Testfälle

```txt
Given athlete profile and recent activities
When generate_week_plan is requested
Then a valid week plan schema is returned
```

```txt
Given invalid AI output without workout date
When validation runs
Then the output is rejected
```

```txt
Given accepted AI week plan
When user accepts the output
Then TrainingPlan, PlannedWorkouts and WorkoutSteps are created
```

---

# 20. MVP-Implementierungsstrategie

## 20.1 Schritt 1: Athlete Context Builder

Zuerst wird eine Funktion gebaut, die aus vorhandenen Daten einen Athlete Context erzeugt.

Input:

* Athlete Profile
* Goals
* Zones
* Activities
* Planned Workouts

Output:

* AthleteContext v1

---

## 20.2 Schritt 2: Mock AI Output

Bevor die echte AI angebunden wird, kann mit festen Beispielantworten gearbeitet werden.

Ziel:

* UI für Vorschläge bauen
* Mapping in TrainingPlan testen
* Validierung testen

---

## 20.3 Schritt 3: AI Endpoint

Danach wird ein Backend-Endpunkt für AI-Anfragen erstellt.

MVP-Endpunkte:

```txt
POST /api/ai/generate-week-plan
POST /api/ai/generate-workout
```

---

## 20.4 Schritt 4: Validierung

AI-Ausgaben werden gegen definierte Schemas geprüft.

Nur valide Ausgaben können übernommen werden.

---

## 20.5 Schritt 5: User Preview

Der User sieht den AI-Vorschlag als Preview.

Mögliche Aktionen:

* übernehmen
* bearbeiten
* verwerfen

---

## 20.6 Schritt 6: Speicherung

Bei Übernahme werden interne Entities erstellt:

```txt
TrainingPlan
PlannedWorkout
WorkoutStep
```

oder bei einer Einzeleinheit:

```txt
PlannedWorkout
WorkoutStep
```

---

# 21. Decisions — Resolved in Phase 6

Stand: 2026-06-24. Alle fünf offenen Entscheidungen wurden in Phase 6 getroffen.

## 21.1 AI Provider Integration

**Entschieden:** Anthropic Claude. Default-Modell: `claude-opus-4-8`, konfigurierbar via `AI_MODEL`. Mock-Modus via `AI_MOCK=true` (kein echter API-Aufruf, Fixture-Daten). API-Key (`ANTHROPIC_API_KEY`) nur im Backend. Kostenkontrolle und Rate-Limit-Handling sind aktuell nicht implementiert — Provider-Fehler → `503`.

## 21.2 Output Schema

**Entschieden:** Structured output via **tool use** (Anthropic SDK). Das Modell gibt das Schema-konforme JSON als Tool-Argument zurück, kein Freitext-Parsing. Validierung mit **Zod** (Schemas in `packages/shared`). Teilweise valide Ausgaben werden mit `validationStatus: 'invalid'` gespeichert, aber nicht als Training-Entities übernommen.

## 21.3 Prompt Versioning

**Entschieden:** Prompt-Templates leben im Code (`PromptBuilder.ts`), keine externe Datei, keine Versionsnummer pro Prompt. Der `AthleteContext` hat `contextVersion: 'v1'` — das ermöglicht Kontextformat-Änderungen ohne Breaking Changes. Vollständige Prompt-Versionierung ist für Phase 7+ deferred.

## 21.4 AI History

**Entschieden:** Nur `AiCoachOutput`-Records werden gespeichert. Jeder Output ist mit einem `AthleteContextSnapshot` (FK) verknüpft. Eine vollständige AI-Historie-Ansicht (`GET /api/ai/history`) ist als Post-MVP-Endpoint deklariert und nicht Teil von Phase 6.

## 21.5 Editing Flow

**Entschieden:** Erst übernehmen, dann im bestehenden Training-Plan-UI bearbeiten. Kein direktes In-Place-Editing des AI-Vorschlags vor der Übernahme. Einzelne Workouts aus einem Wochenplan sind nicht selektiv übernehmbar — der gesamte Wochenplan wird als `TrainingPlan` übernommen.

---

# 22. MVP Cutline

Der AI-Coach-MVP endet bei folgendem Funktionsumfang:

```txt
Athlete Context erzeugen
        ↓
AI-Anfrage für Wochenplan oder Einzelworkout senden
        ↓
strukturierte AI-Ausgabe erhalten
        ↓
Ausgabe validieren
        ↓
Vorschlag als Preview anzeigen
        ↓
User übernimmt oder verwirft
        ↓
TrainingPlan oder PlannedWorkout speichern
```

Nicht Teil dieser Cutline:

* automatische adaptive Planung
* medizinische Bewertung
* Garmin Workout Export
* Langzeit-Coaching-Automatisierung
* vollständiger Chat-Verlauf als Trainingssteuerung

---

# 23. Zusammenfassung

Der AI-Coach von `pp-trainer` wird als strukturierter Trainingsassistent geplant.

Er basiert auf:

* internem Trainingsdatenmodell
* Athlete Context
* Backend-basierter AI-Anbindung
* strukturierter Ausgabe
* Validierung
* User-Bestätigung

Der AI-Coach soll im MVP zwei zentrale Dinge können:

1. Einen Wochenplan generieren
2. Eine einzelne Trainingseinheit generieren

Alle weiteren Funktionen wie Wochenanalyse, adaptive Planung, Recovery-Bewertung und Export kommen später.

Der wichtigste Grundsatz lautet:

> The AI Coach suggests. The user decides.