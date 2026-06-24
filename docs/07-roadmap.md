# Roadmap

Stand: 24.06.2026

## 1. Ziel dieser Datei

Diese Datei beschreibt die Roadmap für `pp-trainer`.

Die Roadmap legt fest, in welcher Reihenfolge das Projekt umgesetzt wird, welche Ziele pro Phase erreicht werden sollen und welche Ergebnisse nach jeder Phase vorliegen müssen.

Sie dient als praktischer Entwicklungsplan und verbindet die bisherigen Dokumente:

* `00-project-blueprint.md`
* `01-requirements.md`
* `02-feature-scope.md`
* `03-architecture.md`
* `04-data-model.md`
* `05-data-sources-and-import-strategy.md`
* `06-ai-coach-concept.md`

Das Ziel ist, jederzeit klar zu wissen:

* was aktuell gebaut wird
* warum es gebaut wird
* was danach kommt
* welche Features bewusst noch nicht gebaut werden
* wann der MVP erreicht ist
* wann eine erste stabile Version erreicht ist

---

## 2. Grundsatz der Roadmap

`pp-trainer` wird nicht durch schnelles Drauflosprogrammieren entwickelt.

Der zentrale Grundsatz lautet:

> Build the stable core first. Add integrations and automation later.

Das bedeutet:

* zuerst Dokumentation und Scope
* dann internes Datenmodell
* dann Mock-Daten
* dann UI-Prototyp
* dann Backend und Datenbank
* dann Import
* dann AI-Coach
* dann echte Datenquellen
* dann Analysen, Exporte und Automatisierung

Garmin, Strava, Aggregatoren und Exportfunktionen bleiben wichtig, werden aber nicht in den ersten MVP gezogen.

---

## 3. Roadmap-Struktur

Die Entwicklung wird in mehrere Phasen aufgeteilt.

```txt
Phase 0  Project Foundation
Phase 1  Repo and App Foundation
Phase 2  Frontend Prototype with Mock Data
Phase 3  Backend and Database Foundation
Phase 4  Activity Import and Normalization
Phase 5  Training Planning Core
Phase 6  AI Coach MVP
Phase 7  MVP Integration and Stabilization
Phase 8  First Stable Prototype
Phase 9  Data Source Expansion
Phase 10 Advanced Coaching and Analytics
Phase 11 Export and Ecosystem Features
```

Die Phasen bauen bewusst aufeinander auf.

Eine Phase sollte erst abgeschlossen werden, wenn ihre Definition of Done erfüllt ist.

---

# 4. Phase 0: Project Foundation

## 4.1 Ziel

Die konzeptuelle Grundlage des Projekts wird erstellt.

Diese Phase stellt sicher, dass nicht direkt mit Code begonnen wird, bevor Ziel, Scope, Architektur, Datenmodell und AI-Konzept geklärt sind.

## 4.2 Status

Diese Phase ist weitgehend abgeschlossen.

## 4.3 Ergebnisse

Folgende Dokumente werden erstellt:

```txt
docs/00-project-blueprint.md
docs/01-requirements.md
docs/02-feature-scope.md
docs/03-architecture.md
docs/04-data-model.md
docs/05-data-sources-and-import-strategy.md
docs/06-ai-coach-concept.md
docs/07-roadmap.md
```

Zusätzlich wird das Repo-Wiki mit schlanken Übersichtsseiten gepflegt.

## 4.4 Konkrete Schritte

1. Projektidee dokumentieren
2. Anforderungen definieren
3. Feature Scope festlegen
4. Architektur festlegen
5. Datenquellenstrategie definieren
6. Datenmodell konzipieren
7. AI-Coach-Konzept ausarbeiten
8. Roadmap erstellen
9. Wiki-Startseite und kompakte Übersichten ergänzen

## 4.5 Definition of Done

Phase 0 ist abgeschlossen, wenn:

* alle zentralen Dokumente im `docs`-Ordner vorhanden sind
* MVP und Endprodukt klar getrennt sind
* Garmin nicht als MVP-Blocker behandelt wird
* manuelle Uploads und Mock-Daten als MVP-Strategie definiert sind
* das interne Trainingsdatenmodell als stabiler Kern festgelegt ist
* klar ist, welche Features nicht in den MVP gehören
* klar ist, welcher Umsetzungsschritt als nächstes folgt

## 4.6 Nächster Schritt nach Phase 0

Nach Phase 0 beginnt die technische Projektgrundlage:

```txt
Phase 1: Repo and App Foundation
```

---

# 5. Phase 1: Repo and App Foundation

## 5.1 Ziel

Das bestehende Frontend-Framework wird in eine saubere Projektstruktur für `pp-trainer` überführt.

Ziel ist noch nicht, Produktfeatures zu bauen. Ziel ist, die technische Basis vorzubereiten.

## 5.2 Hauptentscheidung

Das Projekt wird als Fullstack-Projekt vorbereitet.

Empfohlene Zielstruktur:

```txt
pp-trainer/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
├── prisma/
├── README.md
├── package.json
└── .env.example
```

## 5.3 Konkrete Schritte

1. Projektname im Repo auf `pp-trainer` festlegen
2. bestehendes React Vite TypeScript Framework als `apps/web` übernehmen oder vorbereiten
3. Ordnerstruktur für Monorepo anlegen
4. `docs`-Ordner mit allen Dokumenten einpflegen
5. `packages/shared` vorbereiten
6. `apps/api` als leeren Backend-Bereich vorbereiten
7. `.env.example` anlegen
8. README aktualisieren
9. Basis-Scripts prüfen oder vorbereiten
10. Linting und Formatting prüfen
11. erste ADR-Dateien vorbereiten

## 5.4 Keine Produktfeatures in dieser Phase

Nicht bauen:

* Dashboard
* Import
* Datenbank
* AI-Coach
* Garmin-Integration
* Auth
* Trainingsplanung

## 5.5 Ergebnisse

Nach Phase 1 liegt vor:

* saubere Repo-Struktur
* Dokumentation im Repo
* Frontend-App im richtigen Ordner
* Backend-Ordner vorbereitet
* Shared Package vorbereitet
* technische Grundlage für spätere Implementierung

## 5.6 Definition of Done

Phase 1 ist abgeschlossen, wenn:

* das Projekt lokal startbar ist
* `apps/web` existiert
* `apps/api` existiert
* `packages/shared` existiert
* `docs` vollständig eingepflegt ist
* README den aktuellen Projektstand beschreibt
* keine Secrets im Repo liegen
* die Struktur für spätere Features vorbereitet ist

## 5.7 Nächster Schritt nach Phase 1

Danach wird zuerst das Frontend mit Mock-Daten aufgebaut:

```txt
Phase 2: Frontend Prototype with Mock Data
```

---

# 6. Phase 2: Frontend Prototype with Mock Data

## 6.1 Ziel

Ein erster sichtbarer Prototyp wird mit Mock-Daten gebaut.

Der Fokus liegt darauf, die wichtigsten Screens, Datenflüsse und UI-Komponenten zu validieren, bevor Backend, Datenbank und Importlogik umgesetzt werden.

## 6.2 Warum diese Phase vor dem Backend kommt

Mock-Daten erlauben:

* schnelle UI-Iteration
* bessere Vorstellung vom Produkt
* frühe Validierung der Datenstruktur
* weniger Abhängigkeit von Garmin oder Importparsern
* klare Grundlage für spätere API-DTOs

## 6.3 Screens im MVP-Prototyp

Folgende Screens werden aufgebaut:

```txt
Dashboard
Activities
Activity Detail
Training Plan / Week View
Workout Detail
AI Coach Preview
Settings / Athlete Profile
Import Placeholder
```

## 6.4 Komponenten

Wichtige Komponenten:

```txt
ActivityCard
ActivityList
ActivitySummaryStats
WorkoutCard
WorkoutStepList
WeekPlanView
DashboardWidget
SportBadge
IntensityBadge
SourceBadge
EmptyState
ErrorState
LoadingState
```

## 6.5 Mock-Daten

Es werden realistische Mock-Daten erstellt für:

```txt
AthleteProfile
TrainingZones
Activities
TrainingPlan
PlannedWorkouts
WorkoutSteps
WeeklySummary
AiGeneratedWeekPlan
AiGeneratedWorkout
```

## 6.6 Konkrete Schritte

1. Frontend-Routing anlegen
2. Layout-Struktur erstellen
3. Mock-Daten definieren
4. TypeScript-Typen für MVP-Daten anlegen
5. Dashboard-Seite bauen
6. Aktivitätsübersicht bauen
7. Aktivitätsdetailseite bauen
8. Wochenplan-Seite bauen
9. Workout Cards bauen
10. Workout Detail bauen
11. Settings-Seite für Athlete Profile und Trainingszonen grob bauen
12. AI-Coach Preview-Seite mit Mock-Antworten bauen
13. Import-Seite als Placeholder bauen
14. Empty, Loading und Error States ergänzen

## 6.7 Noch nicht enthalten

Nicht in Phase 2:

* echte Datenbank
* echter Import
* echte AI-Anbindung
* echte Garmin-Verbindung
* persistente Speicherung
* Authentifizierung
* Exportfunktionen

## 6.8 Ergebnisse

Nach Phase 2 gibt es einen klickbaren Frontend-Prototyp mit realistischen Daten.

Der User kann durch die App navigieren und das Zielprodukt erstmals visuell erleben.

## 6.9 Definition of Done

Phase 2 ist abgeschlossen, wenn:

* Dashboard mit Mock-Daten funktioniert
* Aktivitätsliste sichtbar ist
* Aktivitätsdetailseite sichtbar ist
* Wochenplan mit Workout Cards sichtbar ist
* Workout Detail sichtbar ist
* AI-Coach Preview sichtbar ist
* Athlete Profile und Trainingszonen im UI angedeutet sind
* Import-Seite als zukünftiger Einstieg sichtbar ist
* alle Screens mit Mock-Daten funktionieren
* das UI keine echte API voraussetzt

## 6.10 Nächster Schritt nach Phase 2

Nach dem Frontend-Prototyp wird die echte Backend- und Datenbankbasis aufgebaut:

```txt
Phase 3: Backend and Database Foundation
```

---

# 7. Phase 3: Backend and Database Foundation

## 7.1 Ziel

Das Backend und die Datenbank werden als stabile Grundlage für echte Daten geschaffen.

In dieser Phase wird noch nicht der vollständige Import gebaut. Zuerst werden API, Datenbankzugriff und Kernentities vorbereitet.

## 7.2 Technologie

Geplante Technologien:

```txt
Node.js
TypeScript
Fastify oder NestJS
PostgreSQL
Prisma
```

Die finale Entscheidung zwischen Fastify und NestJS wird über eine ADR dokumentiert.

## 7.3 Backend-Module

MVP-Module:

```txt
athlete-profile
activities
training-zones
training-plans
workouts
imports
ai-coach
```

## 7.4 Datenbankmodelle für diese Phase

Priorisierte Models:

```txt
AthleteProfile
TrainingGoal
TrainingZoneSet
TrainingZone
Activity
TrainingPlan
PlannedWorkout
WorkoutStep
ImportedFile
RawActivityData
AiCoachOutput
AthleteContextSnapshot
```

## 7.5 Konkrete Schritte

1. Backend-App initialisieren
2. Backend-Framework entscheiden und dokumentieren
3. Prisma installieren und konfigurieren
4. PostgreSQL lokal einrichten
5. erstes Prisma-Schema für MVP-Entities erstellen
6. Migration ausführen
7. Prisma Client anbinden
8. Health Endpoint erstellen
9. Repository- und Service-Struktur anlegen
10. DTOs für Activity, Workout und Training Plan definieren
11. erste API-Endpunkte für Mock- oder Seed-Daten erstellen
12. Seed Script für Beispieldaten erstellen
13. Frontend optional auf Backend-Daten umstellen

## 7.6 MVP-Endpunkte

Erste mögliche Endpunkte:

```txt
GET /api/health

GET /api/athlete/profile
PUT /api/athlete/profile

GET /api/activities
GET /api/activities/:id

GET /api/training-zones
PUT /api/training-zones

GET /api/training-plans/current-week
GET /api/training-plans/:id

GET /api/workouts/:id
```

## 7.7 Noch nicht enthalten

Nicht in Phase 3:

* echter Dateiimport
* echte AI-Anbindung
* Garmin Sync
* Strava Sync
* komplexe Analytics
* Exportfunktionen

## 7.8 Ergebnisse

Nach Phase 3 existiert eine echte Backend- und Datenbankbasis.

Frontend-Daten können schrittweise von Mock-Daten auf API-Daten umgestellt werden.

## 7.9 Definition of Done

Phase 3 ist abgeschlossen, wenn:

* Backend lokal läuft
* PostgreSQL angebunden ist
* Prisma konfiguriert ist
* MVP-Entities im Schema existieren
* erste Migration erfolgreich ist
* Seed-Daten geladen werden können
* Activities über API abrufbar sind
* Training Plans über API abrufbar sind
* Workouts über API abrufbar sind
* Frontend mindestens eine echte API-Route nutzen kann

## 7.10 Nächster Schritt nach Phase 3

Danach wird der Datenimport umgesetzt:

```txt
Phase 4: Activity Import and Normalization
```

---

# 8. Phase 4: Activity Import and Normalization

## 8.1 Ziel

Aktivitätsdaten können erstmals wirklich in das System importiert und in das interne Datenmodell normalisiert werden.

Der Fokus liegt nicht auf vielen Quellen, sondern auf einem stabilen Importweg.

## 8.2 MVP-Importstrategie

Priorität:

```txt
1. JSON-Import oder strukturierter Beispieldatenimport
2. manueller FIT-/GPX-/TCX-Upload
3. später Garmin oder andere Quellen
```

Falls FIT Parsing zu aufwendig ist, wird zuerst ein JSON-Import umgesetzt, der die spätere Import-Pipeline simuliert.

## 8.3 Import Pipeline

Die Pipeline lautet:

```txt
Input
↓
Validate
↓
Parse
↓
Store Raw Data
↓
Normalize
↓
Deduplicate
↓
Store Activity
↓
Return Result
```

## 8.4 Konkrete Schritte

1. Import-Modul im Backend erstellen
2. Upload-Endpunkt vorbereiten
3. Importstatus definieren
4. `ImportedFile` speichern
5. Raw Data speichern oder referenzieren
6. JSON-Parser als erster Parser erstellen
7. Normalizer für interne Activity erstellen
8. Deduplizierung über fileHash oder Activity Similarity vorbereiten
9. importierte Activity speichern
10. Import-Ergebnis ans Frontend zurückgeben
11. Import-UI im Frontend anbinden
12. Fehlerzustände im UI abbilden
13. später FIT, GPX oder TCX Parser ergänzen

## 8.5 Import-Endpunkte

Mögliche Endpunkte:

```txt
POST /api/imports/activity-json
POST /api/imports/activity-file
GET  /api/imports
GET  /api/imports/:id
```

## 8.6 Akzeptierte erste Importform

Minimum für diese Phase:

```txt
Eine echte oder strukturierte Aktivitätsdatei kann importiert werden
und erzeugt eine Activity im internen Datenmodell.
```

## 8.7 Noch nicht enthalten

Nicht in Phase 4:

* automatischer Garmin Sync
* Strava Sync
* große historische Massenimporte
* vollständige Zeitreihenverarbeitung
* komplexe Duplikatprüfung mit User Review

## 8.8 Ergebnisse

Nach Phase 4 kann die App echte oder vorbereitete Aktivitätsdaten importieren.

Aktivitäten entstehen nicht mehr nur aus Seed-Daten.

## 8.9 Definition of Done

Phase 4 ist abgeschlossen, wenn:

* Import-Endpunkt existiert
* Upload oder JSON-Import funktioniert
* Importfehler verständlich zurückgegeben werden
* Raw Data oder Importreferenz gespeichert wird
* Activity normalisiert gespeichert wird
* importierte Aktivitäten in der Aktivitätsliste erscheinen
* Aktivitätsdetails importierte Daten anzeigen
* offensichtliche Duplikate verhindert werden

## 8.10 Nächster Schritt nach Phase 4

Danach wird die Trainingsplanung als eigener Kernbereich stabilisiert:

```txt
Phase 5: Training Planning Core
```

---

# 9. Phase 5: Training Planning Core

## 9.1 Ziel

Die Trainingsplanung wird unabhängig vom AI-Coach funktionsfähig gemacht.

Bevor AI-generierte Pläne übernommen werden können, muss die App selbst TrainingPlans, PlannedWorkouts und WorkoutSteps sauber speichern und anzeigen können.

## 9.2 Warum diese Phase vor AI kommt

Der AI-Coach soll später strukturierte Daten erzeugen.

Diese Daten müssen zuerst intern funktionieren:

```txt
TrainingPlan
↓
PlannedWorkout
↓
WorkoutStep
↓
Workout Card
↓
Workout Detail
```

## 9.3 Konkrete Schritte

1. TrainingPlan API vervollständigen
2. PlannedWorkout API erstellen
3. WorkoutStep API erstellen
4. Wochenplan aus Backend-Daten anzeigen
5. Workout Cards aus Backend-Daten anzeigen
6. Workout Detail aus Backend-Daten anzeigen
7. manuelles Erstellen eines Workouts ermöglichen
8. Bearbeiten eines Workouts vorbereiten
9. Status eines Workouts ändern
10. Plan als Draft oder Active speichern
11. einfache Planstruktur für aktuelle Woche bauen

## 9.4 Endpunkte

Mögliche Endpunkte:

```txt
GET    /api/training-plans/current-week
POST   /api/training-plans
GET    /api/training-plans/:id
PUT    /api/training-plans/:id

POST   /api/workouts
GET    /api/workouts/:id
PUT    /api/workouts/:id
DELETE /api/workouts/:id
```

## 9.5 Statuslogik

Workout Status:

```txt
planned
completed
missed
moved
adjusted
cancelled
```

Plan Status:

```txt
draft
active
completed
archived
```

## 9.6 Noch nicht enthalten

Nicht in Phase 5:

* AI-generierte Pläne
* automatische Plananpassung
* Planerfüllung gegen echte Activities
* Drag and Drop
* Export zu Drittplattformen

## 9.7 Ergebnisse

Nach Phase 5 kann die App Trainingspläne und geplante Workouts unabhängig vom AI-Coach verwalten.

## 9.8 Definition of Done

Phase 5 ist abgeschlossen, wenn:

* TrainingPlan gespeichert werden kann
* PlannedWorkouts gespeichert werden können
* WorkoutSteps gespeichert werden können
* Wochenplan echte Backend-Daten zeigt
* Workout Cards echte Backend-Daten zeigen
* Workout Detail echte Backend-Daten zeigt
* mindestens ein Workout manuell angelegt werden kann
* Statuswerte korrekt angezeigt werden
* AI-Coach noch nicht notwendig ist, damit Planung funktioniert

## 9.9 Nächster Schritt nach Phase 5

Danach wird der AI-Coach auf diese stabile Planungsstruktur gesetzt:

```txt
Phase 6: AI Coach MVP
```

---

# 10. Phase 6: AI Coach MVP

## 10.1 Ziel

Der AI-Coach wird erstmals funktionsfähig integriert.

Er soll Wochenpläne und einzelne Workouts erzeugen können, die in die vorhandene Trainingsplanung übernommen werden können.

## 10.2 MVP-Funktionen

Der AI-Coach MVP umfasst:

```txt
Athlete Context Builder
Generate Week Plan
Generate Single Workout
Structured Output Validation
Preview
Accept or Reject
Save as TrainingPlan or PlannedWorkout
```

## 10.3 Konkrete Schritte

1. AthleteContextBuilder implementieren
2. Athlete Context v1 definieren
3. Context aus Athlete Profile, Zones, Activities und Plans erzeugen
4. Mock-AI-Output nutzen, um Flow zu testen
5. Output-Schemas definieren
6. AI Output Validator implementieren
7. AI-Endpunkte erstellen
8. OpenAI-Anbindung im Backend integrieren
9. Prompt Templates für Week Plan und Single Workout erstellen
10. AI-Ausgabe speichern
11. Preview im Frontend anzeigen
12. Accept Flow implementieren
13. Reject Flow implementieren
14. bei Accept TrainingPlan, PlannedWorkout und WorkoutSteps erzeugen
15. Fehlerfälle sauber behandeln

## 10.4 Endpunkte

MVP-Endpunkte:

```txt
POST /api/ai/generate-week-plan
POST /api/ai/generate-workout
GET  /api/ai/outputs/:id
POST /api/ai/outputs/:id/accept
POST /api/ai/outputs/:id/reject
```

## 10.5 Prompt-Strategie

Das Backend setzt Prompts aus folgenden Teilen zusammen:

```txt
System Role
Athlete Context
User Instruction
Output Schema Instruction
Safety Rules
```

## 10.6 Validierung

AI-Ausgaben müssen validiert werden.

Ein Wochenplan ist nur gültig, wenn:

* Zeitraum vorhanden ist
* mindestens ein Workout vorhanden ist
* jedes Workout Sportart, Titel, Datum und Intensität enthält
* Workouts als interne PlannedWorkouts abbildbar sind

Ein Einzelworkout ist nur gültig, wenn:

* Sportart vorhanden ist
* Titel vorhanden ist
* Ziel vorhanden ist
* Dauer oder Distanz vorhanden ist
* Schritte oder klare Beschreibung vorhanden sind

## 10.7 Noch nicht enthalten

Nicht in Phase 6:

* adaptive Planung
* Wochenanalyse
* automatische Planänderung
* medizinische Bewertung
* Export
* permanenter Chat als Hauptsteuerung

## 10.8 Ergebnisse

Nach Phase 6 kann der User erstmals AI-generierte Trainingspläne und Einheiten erzeugen, prüfen und übernehmen.

## 10.9 Definition of Done

Phase 6 ist abgeschlossen. Status:

* ✅ Athlete Context wird aus echten DB-Daten erzeugt
* ✅ `POST /api/ai/generate-week-plan` gibt strukturierten, validierten AI-Output zurück
* ✅ `POST /api/ai/generate-workout` gibt strukturierten, validierten AI-Output zurück
* ✅ AI-Output wird als `AiCoachOutput` mit `status: 'Draft'` gespeichert
* ✅ Frontend zeigt Preview des AI-generierten Wochenplans
* ✅ Frontend zeigt Preview des AI-generierten Einzelworkouts
* ✅ User kann Vorschlag übernehmen → erstellt `TrainingPlan` und/oder `PlannedWorkout` mit `source: 'AiGenerated'`
* ✅ User kann Vorschlag verwerfen → `AiCoachOutput` wird auf `rejected` gesetzt
* ✅ Ungültige AI-Ausgaben werden nicht als Training-Entities gespeichert (gespeichert als `validationStatus: 'invalid'`, accept → 422)
* ✅ Anthropic API Key liegt nur im Backend (`ANTHROPIC_API_KEY`)
* ✅ AI-generierte Pläne/Workouts sind mit `AiBadge` visuell markiert

## 10.10 Scope-Änderungen gegenüber Plan

* `AiAcceptService` trennt die Accept-Logik vom `AiService` (nicht im ursprünglichen Plan vorgesehen)
* Zone-Namen werden im `notes`-Feld von `WorkoutStep` gespeichert (kein FK) — Zone-Picker-UI auf Phase 7 verschoben
* `isInitial`-Ref-Pattern in allen drei Data-Hooks ergänzt, um Page-Reload auf Mutations zu verhindern
* Nativer `<select>` für Plan-Zuweisung durch custom `PlanPicker`-Dropdown ersetzt
* `AiCoachPreviewPage` (alter Phase-2-Prototyp) wurde gelöscht — keine Route zeigte noch darauf

## 10.10 Nächster Schritt nach Phase 6

Danach wird der gesamte MVP integriert und stabilisiert:

```txt
Phase 7: MVP Integration and Stabilization
```

---

# 11. Phase 7: MVP Integration and Stabilization

**Status: complete — MVP reached 2026-06-24**

## 11.1 Ziel

Alle MVP-Bestandteile werden zusammengeführt, getestet und stabilisiert.

Diese Phase ist der Übergang vom technischen Prototyp zum echten MVP.

## 11.2 MVP-Bestandteile

Der MVP umfasst:

```txt
Single-User Setup
Athlete Profile
Training Zones
Activity Import
Activity List
Activity Detail
Dashboard
Training Plan
Workout Cards
Workout Detail
Athlete Context
AI Week Plan
AI Single Workout
AI Preview and Accept Flow
```

## 11.3 Konkrete Schritte

1. alle MVP-Flows einmal vollständig durchtesten
2. Dashboard auf echte Daten umstellen
3. Activities aus Import und Seed-Daten konsistent anzeigen
4. Wochenplan auf echte Backend-Daten umstellen
5. AI-generierte Pläne im Wochenplan anzeigen
6. AI-generierte Workouts im Workout Detail anzeigen
7. Error States ergänzen
8. Empty States ergänzen
9. Loading States ergänzen
10. Validierung verbessern
11. DTOs aufräumen
12. alte Mock-Daten klar von echten Daten trennen
13. README aktualisieren
14. Wiki mit aktuellem MVP-Stand ergänzen
15. offene Bugs dokumentieren

## 11.4 MVP-Testflows

Folgende Flows müssen funktionieren:

### Flow 1: Aktivität importieren

```txt
Import-Seite öffnen
↓
Datei oder JSON auswählen
↓
Import starten
↓
Activity wird gespeichert
↓
Activity erscheint in Liste
↓
Activity Detail lässt sich öffnen
```

### Flow 2: Trainingswoche anzeigen

```txt
Dashboard öffnen
↓
aktuelle Woche sehen
↓
geplante Workouts sehen
↓
absolvierte Activities sehen
↓
Wochenumfang sehen
```

### Flow 3: Workout manuell erstellen

```txt
Wochenplan öffnen
↓
Workout erstellen
↓
Workout speichern
↓
Workout Card erscheint
↓
Workout Detail öffnen
```

### Flow 4: AI-Wochenplan generieren

```txt
AI Coach öffnen
↓
Wochenplan anfragen
↓
AI erzeugt Vorschlag
↓
Preview ansehen
↓
Vorschlag übernehmen
↓
Wochenplan wird gespeichert
```

### Flow 5: AI-Einzelworkout generieren

```txt
AI Coach öffnen
↓
Einzelworkout anfragen
↓
AI erzeugt Vorschlag
↓
Preview ansehen
↓
Workout übernehmen
↓
Workout erscheint im Wochenplan
```

## 11.5 Noch nicht enthalten

Nicht in Phase 7:

* Garmin Live-Sync
* Strava Live-Sync
* Export
* adaptive Planung
* erweiterte Charts
* Multi-User
* mobile App

## 11.6 Ergebnisse

Nach Phase 7 ist der MVP erreicht.

Der MVP ist nicht das finale Produkt, aber die Kernidee funktioniert vollständig.

## 11.7 Definition of Done für den MVP

Der MVP ist abgeschlossen, wenn:

* ✅ App lokal stabil läuft
* ✅ Frontend und Backend zusammen funktionieren
* ✅ Datenbank genutzt wird
* ✅ Aktivitäten importiert oder über strukturierte Daten angelegt werden können
* ✅ Aktivitäten angezeigt werden
* ✅ Aktivitätsdetails funktionieren
* ✅ Dashboard funktioniert
* ✅ Wochenplan funktioniert
* ✅ Workout Cards funktionieren
* ✅ Workout Details funktionieren
* ✅ Trainingszonen gespeichert werden können
* ✅ Athlete Context erzeugt wird
* ✅ AI-Wochenplan erzeugt werden kann
* ✅ AI-Einzelworkout erzeugt werden kann
* ✅ AI-Vorschläge übernommen oder verworfen werden können
* ✅ Garmin nicht notwendig ist, damit der MVP funktioniert

**MVP erreicht: 2026-06-24**

## 11.8 Nächster Schritt nach Phase 7

Nach dem MVP folgt ein erster stabiler Prototyp mit zusätzlichen Funktionen, die das Produkt deutlich nutzbarer machen:

```txt
Phase 8: First Stable Prototype
```

---

# 12. Phase 8: First Stable Prototype

## 12.1 Ziel

Der erste stabile Prototyp baut auf dem MVP auf und macht die App deutlich runder.

Während der MVP vor allem die Kernlogik beweist, soll der erste stabile Prototyp bereits praktisch regelmäßig nutzbar sein.

## 12.2 Fokus

Fokus dieser Phase:

```txt
bessere UX
stabilere Imports
erste Charts
bessere Trainingsplanung
Planerfüllung vorbereiten
AI-Coach nützlicher machen
```

## 12.3 Features

### 12.3.1 Erweiterte Dashboard-Kacheln

Zusätzliche Dashboard-Elemente:

* Wochenumfang nach Sportart
* letzte 7 Tage
* letzte 4 Wochen
* geplante vs. absolvierte Zeit
* nächste Einheit
* letzte Aktivität
* AI-Hinweis

### 12.3.2 Erste Charts

Mögliche Charts:

* Wochenumfang
* Sportartenverteilung
* Aktivitätsanzahl pro Woche
* Trainingszeit pro Sportart

### 12.3.3 Importhistorie

Die App zeigt:

* importierte Dateien
* erfolgreiche Importe
* fehlgeschlagene Importe
* erkannte Duplikate

### 12.3.4 Planerfüllung v1

Geplante Workouts können manuell oder halbautomatisch mit Activities verknüpft werden.

### 12.3.5 AI-Wochenanalyse

Der AI-Coach kann eine Woche zusammenfassen.

### 12.3.6 Workout Editing Flow

AI-generierte Workouts können vor oder nach Übernahme bearbeitet werden.

## 12.4 Konkrete Schritte

1. Dashboard-Kacheln erweitern
2. erste Chart-Komponenten integrieren
3. Weekly Summary Service erstellen
4. Importhistorie anzeigen
5. CompletedWorkoutLink vorbereiten
6. manuelle Verknüpfung von Activity und PlannedWorkout bauen
7. AI-Wochenanalyse-Endpunkt ergänzen
8. AI-Wochenanalyse im UI anzeigen
9. Workout Editing verbessern
10. UI-Feinschliff und responsive Verbesserungen
11. Performance der wichtigsten Seiten prüfen
12. Testdaten und Seed-Daten verbessern

## 12.5 Ergebnisse

Nach Phase 8 ist `pp-trainer` als persönlicher Prototyp deutlich besser nutzbar.

Die App ist nicht mehr nur ein MVP, sondern eine erste stabile Version.

## 12.6 Definition of Done

Phase 8 ist abgeschlossen, wenn:

* Dashboard aussagekräftiger ist
* erste Charts funktionieren
* Importhistorie sichtbar ist
* Planerfüllung v1 funktioniert oder vorbereitet ist
* AI kann Trainingswoche analysieren
* Workouts können sinnvoll bearbeitet werden
* UI ist konsistenter und robuster
* App kann regelmäßig für eigene Trainingsplanung genutzt werden

## 12.7 Nächster Schritt nach Phase 8

Danach werden echte externe Datenquellen geprüft und angebunden:

```txt
Phase 9: Data Source Expansion
```

---

# 13. Phase 9: Data Source Expansion

## 13.1 Ziel

Nach MVP und stabilem Prototyp werden echte externe Datenquellen erweitert.

Der Fokus liegt darauf, Datenquellen als Adapter zu ergänzen, ohne das interne Modell umzubauen.

## 13.2 Priorität

Priorisierung:

```txt
1. offizieller Garmin API-Zugriff, falls verfügbar
2. Garmin Connect Export Import
3. python-garminconnect als privater Fallback
4. Strava API
5. Aggregator API
```

## 13.3 Offizielle Garmin API

Wenn Zugriff möglich ist:

Konkrete Schritte:

1. Garmin Developer Zugang prüfen
2. API-Dokumentation auswerten
3. OAuth Flow planen
4. DataSourceConnection erweitern
5. Garmin Adapter erstellen
6. Garmin Activity Mapper bauen
7. Garmin Health Mapper vorbereiten
8. SyncJob-Struktur vorbereiten
9. erste Aktivitäten synchronisieren
10. Daten in internes Modell normalisieren

## 13.4 Garmin Export Import

Wenn offizieller API-Zugriff nicht sofort möglich ist:

1. Garmin Exportstruktur analysieren
2. relevante Dateien identifizieren
3. Parser oder Mapper bauen
4. historische Aktivitäten importieren
5. Duplikate prüfen
6. Importhistorie erweitern

## 13.5 python-garminconnect

Als privater Fallback:

1. technische Machbarkeit prüfen
2. Python Script isoliert testen
3. JSON-Zwischenformat definieren
4. Import in Backend über bestehenden JSON-Import
5. keine direkte Kopplung an Hauptmodell
6. Risiken dokumentieren

## 13.6 Strava API

Spätere Alternative:

1. Strava API-Bedingungen prüfen
2. OAuth Flow implementieren
3. Activity Adapter bauen
4. Strava-Daten normalisieren
5. Deduplizierung gegen Garmin und Uploads prüfen

## 13.7 Aggregator API

Nur bei Bedarf:

1. Anbieter vergleichen
2. Kosten prüfen
3. Datenschutz prüfen
4. API-Abdeckung prüfen
5. Proof of Concept erstellen

## 13.8 Definition of Done

Phase 9 ist abgeschlossen, wenn mindestens eine zusätzliche echte Datenquelle über den Adapter-Ansatz funktioniert oder sauber verworfen wurde.

Wichtig:

* interne Models bleiben stabil
* Dashboard muss nicht umgebaut werden
* AI-Coach muss nicht umgebaut werden
* Importlogik folgt weiterhin der bestehenden Pipeline

## 13.9 Nächster Schritt nach Phase 9

Nach den Datenquellen werden Coaching und Analytics ausgebaut:

```txt
Phase 10: Advanced Coaching and Analytics
```

---

# 14. Phase 10: Advanced Coaching and Analytics

## 14.1 Ziel

Die App wird von einer Trainingsplan- und Dashboard-App zu einem intelligenteren Trainingsassistenten ausgebaut.

## 14.2 Features

### 14.2.1 Trainingsbelastung

Mögliche Funktionen:

* einfache Load-Metrik
* Belastung pro Aktivität
* Wochenbelastung
* Belastungstrend
* harte vs. lockere Einheiten

### 14.2.2 Langfristige Entwicklung

Mögliche Analysen:

* FTP-Entwicklung
* Laufpace-Entwicklung
* Schwimmpace-Entwicklung
* Umfangsentwicklung
* Intensitätsverteilung

### 14.2.3 Erholung

Wenn Daten verfügbar sind:

* Schlaf
* Ruhepuls
* HRV
* Stress
* Body-Battery-artige Werte
* vorsichtige Einordnung für Trainingsplanung

### 14.2.4 Adaptive Planung

Der AI-Coach kann Änderungen vorschlagen bei:

* verpassten Einheiten
* hoher Belastung
* wenig Erholung
* verändertem Zeitplan
* nahendem Wettkampf

## 14.3 Grundsatz

Auch in dieser Phase gilt:

```txt
AI suggests. User decides.
```

Keine vollautomatische Änderung ohne Bestätigung.

## 14.4 Konkrete Schritte

1. Trainingsbelastungsmodell v1 definieren
2. WeeklySummary erweitern
3. TrainingLoadEstimate implementieren
4. Analytics-Dashboard erweitern
5. Planerfüllung verbessern
6. AI analyze-week ausbauen
7. adjust-plan Use Case bauen
8. Recovery-Datenmodell nur bei verfügbarer Datenquelle aktivieren
9. Empfehlungen im Dashboard anzeigen
10. Guardrails für AI-Plananpassung definieren

## 14.5 Definition of Done

Phase 10 ist abgeschlossen, wenn:

* Belastung über mehrere Wochen sichtbar ist
* Planerfüllung sinnvoll analysiert wird
* AI kann Wochen sinnvoll einordnen
* AI kann Planänderungen vorschlagen
* User bestätigt Änderungen
* keine medizinischen Aussagen suggeriert werden

## 14.6 Nächster Schritt nach Phase 10

Danach können Exportfunktionen und Ökosystem-Features folgen:

```txt
Phase 11: Export and Ecosystem Features
```

---

# 15. Phase 11: Export and Ecosystem Features

## 15.1 Ziel

Geplante Workouts sollen in externe Trainingsplattformen oder Geräte-Ökosysteme exportiert werden können.

## 15.2 Mögliche Exportziele

```txt
Garmin Connect
Zwift
MyWhoosh
strukturierte Workout-Dateien
Kalender
```

## 15.3 Voraussetzungen

Export wird erst sinnvoll, wenn folgende Dinge stabil sind:

* PlannedWorkout
* WorkoutStep
* Sportartspezifische Zielbereiche
* Trainingszonen
* Workout Validation
* User Confirmation Flow

## 15.4 Features

### 15.4.1 Workout-Dateiexport

Mögliche Formate:

* strukturierte JSON-Datei
* ZWO für Zwift
* andere Workout-Formate nach Prüfung

### 15.4.2 Garmin Training API

Falls Zugriff vorhanden:

* Workouts zu Garmin übertragen
* Garmin-kompatible Struktur erzeugen
* Fehler abfangen
* User bestätigt Export

### 15.4.3 Kalenderexport

Mögliche Funktion:

* geplante Workouts als Kalendertermine exportieren
* ICS-Datei
* spätere Kalenderintegration

## 15.5 Konkrete Schritte

1. Exportformat pro Sportart definieren
2. WorkoutStep Mapping prüfen
3. Export Validator bauen
4. ersten Datei-Export implementieren
5. Download im Frontend anbieten
6. Garmin Training API nur bei Zugriff prüfen
7. Kalenderexport als einfache Ergänzung prüfen
8. Exportstatus und Fehler anzeigen

## 15.6 Definition of Done

Phase 11 ist abgeschlossen, wenn:

* mindestens ein Workout-Export funktioniert
* Export basiert auf internen WorkoutSteps
* User kann Export bewusst auslösen
* ungültige Workouts werden nicht exportiert
* Exportfehler sind verständlich

---

# 16. Release-Stufen

## 16.1 MVP

Der MVP ist erreicht nach Phase 7.

### MVP enthält

```txt
Single-User App
Athlete Profile
Training Zones
Mock-Daten oder manueller Import
Activity List
Activity Detail
Dashboard
Training Plan
Workout Cards
Workout Detail
Athlete Context
AI Week Plan
AI Single Workout
AI Preview
Accept or Reject Flow
```

### MVP enthält nicht

```txt
Garmin Live-Sync
Strava Live-Sync
Export
Adaptive Planung
erweiterte Charts
Multi-User
Mobile App
```

---

## 16.2 First Stable Prototype

Der erste stabile Prototyp ist erreicht nach Phase 8.

### Enthält zusätzlich

```txt
besseres Dashboard
erste Charts
Importhistorie
Planerfüllung v1
AI-Wochenanalyse
Workout Editing
bessere UX
robustere Fehlerzustände
```

### Ziel

Die App soll regelmäßig für die eigene Trainingsplanung nutzbar sein.

---

## 16.3 First Integrated Version

Diese Version ist erreicht nach Phase 9.

### Enthält zusätzlich

```txt
mindestens eine echte externe Datenquelle oder klar dokumentierten Fallback
stabileren Importprozess
bessere Datenhistorie
weniger manuelle Pflege
```

### Ziel

Die App soll nicht mehr nur mit Mock-Daten oder einzelnen Uploads funktionieren, sondern realistischer mit eigenen Trainingsdaten gefüllt werden.

---

## 16.4 Advanced Coaching Version

Diese Version ist erreicht nach Phase 10.

### Enthält zusätzlich

```txt
Belastungsanalyse
Wochenanalyse
Planerfüllung
AI-Plananpassung als Vorschlag
erste Recovery-Berücksichtigung, falls Daten vorhanden
```

### Ziel

Die App wird vom Planungswerkzeug zum echten Coaching-Assistenten.

---

## 16.5 Ecosystem Version

Diese Version ist erreicht nach Phase 11.

### Enthält zusätzlich

```txt
Workout Export
mögliche Garmin Training API
möglicher Zwift oder MyWhoosh Export
Kalenderexport
```

### Ziel

Geplante Workouts können außerhalb der App genutzt werden.

---

# 17. Reihenfolge der nächsten konkreten Arbeitsschritte

Nach Abschluss der Dokumentation lautet die direkte Reihenfolge:

## Schritt 1

Repo-Struktur vorbereiten.

```txt
apps/web
apps/api
packages/shared
docs
prisma
```

## Schritt 2

Frontend-App in `apps/web` lauffähig machen.

## Schritt 3

Mock-Daten und gemeinsame Typen für MVP-Entities anlegen.

## Schritt 4

Dashboard mit Mock-Daten bauen.

## Schritt 5

Aktivitätsliste und Aktivitätsdetailseite mit Mock-Daten bauen.

## Schritt 6

Wochenplan, Workout Cards und Workout Detail mit Mock-Daten bauen.

## Schritt 7

Backend-Grundlage mit PostgreSQL und Prisma bauen.

## Schritt 8

Frontend schrittweise von Mock-Daten auf API-Daten umstellen.

## Schritt 9

Import-Pipeline implementieren.

## Schritt 10

Training Planning Core implementieren.

## Schritt 11

AI-Coach MVP implementieren.

## Schritt 12

MVP integrieren und stabilisieren.

---

# 18. Entscheidungs-Checkpoints

An bestimmten Punkten müssen technische Entscheidungen bewusst getroffen und dokumentiert werden.

## Checkpoint 1: Backend Framework

Zeitpunkt:

```txt
vor Phase 3
```

Entscheidung:

```txt
Fastify oder NestJS
```

Dokumentation:

```txt
docs/adr/ADR-002-backend-framework.md
```

## Checkpoint 2: Styling

Zeitpunkt:

```txt
vor oder während Phase 2
```

Entscheidung:

```txt
bestehendes Styling
CSS Modules
Tailwind
Design Tokens
```

Dokumentation:

```txt
docs/adr/ADR-005-styling.md
```

## Checkpoint 3: Importformat für MVP

Zeitpunkt:

```txt
vor Phase 4
```

Entscheidung:

```txt
JSON zuerst
FIT zuerst
GPX/TCX zuerst
```

Dokumentation:

```txt
docs/adr/ADR-006-mvp-import-format.md
```

## Checkpoint 4: AI Output Validation

Zeitpunkt:

```txt
vor Phase 6
```

Entscheidung:

```txt
Zod oder alternative Schema Validation
```

Dokumentation:

```txt
docs/adr/ADR-007-ai-output-validation.md
```

## Checkpoint 5: Garmin Strategy

Zeitpunkt:

```txt
nach MVP oder während Phase 9
```

Entscheidung:

```txt
Garmin official
Garmin export
python-garminconnect
Aggregator
```

Dokumentation:

```txt
docs/adr/ADR-008-garmin-strategy.md
```

---

# 19. Work Breakdown für den MVP

Der MVP kann in konkrete Arbeitspakete aufgeteilt werden.

## 19.1 Documentation

```txt
DOC-001 Project Blueprint
DOC-002 Requirements
DOC-003 Feature Scope
DOC-004 Architecture
DOC-005 Data Model
DOC-006 Data Sources and Import Strategy
DOC-007 AI Coach Concept
DOC-008 Roadmap
```

## 19.2 Frontend

```txt
FE-001 App Routing
FE-002 Base Layout
FE-003 Mock Data Setup
FE-004 Dashboard Page
FE-005 Activities Page
FE-006 Activity Detail Page
FE-007 Training Plan Page
FE-008 Workout Card Component
FE-009 Workout Detail Page
FE-010 AI Coach Preview Page
FE-011 Settings Page
FE-012 Import Page
FE-013 Empty and Error States
```

## 19.3 Backend

```txt
BE-001 Backend Setup
BE-002 Prisma Setup
BE-003 Database Models
BE-004 Seed Data
BE-005 Athlete Profile API
BE-006 Activities API
BE-007 Training Zones API
BE-008 Training Plans API
BE-009 Workouts API
BE-010 Import API
BE-011 AI Coach API
```

## 19.4 Import

```txt
IMP-001 Import Module
IMP-002 JSON Import
IMP-003 File Upload Endpoint
IMP-004 Raw Data Storage
IMP-005 Activity Normalizer
IMP-006 Deduplication v1
IMP-007 Import Error Handling
IMP-008 Import UI Integration
```

## 19.5 AI Coach

```txt
AI-001 Athlete Context Builder
AI-002 AI Output Schemas
AI-003 Mock AI Output Flow
AI-004 Generate Week Plan Endpoint
AI-005 Generate Workout Endpoint
AI-006 OpenAI Integration
AI-007 AI Output Validation
AI-008 AI Preview UI
AI-009 Accept AI Output
AI-010 Reject AI Output
```

## 19.6 Testing and Stabilization

```txt
QA-001 Parser Tests
QA-002 Normalizer Tests
QA-003 Athlete Context Tests
QA-004 AI Output Validation Tests
QA-005 Main User Flow Tests
QA-006 Error State Review
QA-007 README Update
QA-008 Wiki Update
```

---

# 20. What Not To Do Early

Folgende Dinge sollen nicht früh umgesetzt werden:

```txt
Garmin Live-Sync vor funktionierendem internem Modell
AI-Coach vor funktionierender Trainingsplanung
Export vor stabilen WorkoutSteps
Multi-User vor stabilem Single-User-System
komplexe Charts vor Activity und Weekly Summary
Recovery Score ohne zuverlässige Health-Daten
native Mobile App vor stabiler Webapp
```

Diese Reihenfolge schützt das Projekt vor unnötiger Komplexität.

---

# 21. Zusammenfassung

Die Roadmap von `pp-trainer` folgt einer klaren Reihenfolge:

```txt
erst planen
dann Struktur schaffen
dann UI mit Mock-Daten bauen
dann Backend und Datenbank aufbauen
dann Import und Normalisierung umsetzen
dann Trainingsplanung stabilisieren
dann AI-Coach integrieren
dann MVP stabilisieren
dann externe Datenquellen erweitern
dann Analytics, adaptive Planung und Export ergänzen
```

Der MVP ist erreicht, wenn die App Trainingsdaten importieren oder simulieren, Aktivitäten anzeigen, Wochenpläne darstellen und AI-generierte Trainingspläne sowie Einzeleinheiten erzeugen kann.

Die erste stabile Version entsteht danach durch bessere UX, erste Charts, Importhistorie, Planerfüllung und AI-Wochenanalyse.

Der langfristige Ausbau umfasst Garmin, Strava, Aggregatoren, adaptive Planung, Performance-Analysen und Workout-Export.

Der zentrale Grundsatz bleibt:

> The internal training model is the foundation. Everything else is replaceable.