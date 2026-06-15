# Architecture

Stand: 15.06.2026

## 1. Ziel dieser Datei

Diese Datei beschreibt die technische Architektur von `pp-trainer`.

Die Architektur soll sicherstellen, dass die Anwendung nicht direkt von einer einzelnen Datenquelle, einem bestimmten API-Zugriff oder einer einzelnen Implementierungsentscheidung abhängig ist.

Der wichtigste Architekturgrundsatz lautet:

> External sources are replaceable. The internal training model is the stable core.

`pp-trainer` wird daher nicht als Garmin-spezifische App gebaut, sondern als quellunabhängige Trainingsdatenplattform mit eigenem internen Datenmodell.

---

## 2. Architekturziele

Die Architektur verfolgt folgende Ziele:

* klare Trennung zwischen Frontend, Backend, Datenbank und externen Services
* unabhängige Importlogik für verschiedene Datenquellen
* eigenes internes Trainingsdatenmodell als stabile Grundlage
* saubere Normalisierung externer Daten
* AI-Coach nur über das Backend anbinden
* keine sensiblen API Keys im Frontend
* MVP mit Mock-Daten und manuellem Import ermöglichen
* spätere Garmin-, Strava- oder Aggregator-Integration ohne großen Umbau ermöglichen
* langfristig erweiterbar für neue Sportarten, Datenquellen, Analysen und Exportfunktionen

---

## 3. Architekturprinzipien

### 3.1 Source-Agnostic Core

Die App arbeitet intern nicht direkt mit Garmin-, Strava-, FIT- oder Aggregator-spezifischen Datenstrukturen.

Alle externen Daten werden über Adapter importiert und in ein eigenes internes Modell transformiert.

Schlecht:

```txt
GarminActivity → Dashboard → AI-Coach
```

Besser:

```txt
Garmin / FIT / Strava / Export
        ↓
Source Adapter
        ↓
Normalizer
        ↓
Internal Activity
        ↓
Dashboard / Analytics / AI-Coach
```

### 3.2 Backend als zentrale Kontrollschicht

Das Backend ist die zentrale Schicht für:

* Datenimport
* Normalisierung
* Validierung
* Datenbankzugriff
* AI-Anbindung
* Sicherheit
* spätere externe API-Kommunikation

Das Frontend ruft keine externen APIs wie Garmin oder OpenAI direkt auf.

### 3.3 Frontend bleibt datenquellenneutral

Das Frontend kennt nur interne App-Daten.

UI-Komponenten heißen daher nicht:

```txt
GarminActivityCard
GarminSleepWidget
GarminPowerChart
```

Sondern:

```txt
ActivityCard
SleepWidget
PowerChart
TrainingLoadWidget
```

Die Quelle einer Aktivität kann angezeigt werden, bestimmt aber nicht die Struktur der UI.

### 3.4 Rohdaten und normalisierte Daten trennen

Importierte Rohdaten werden von normalisierten App-Daten getrennt.

Ziel:

* bessere Nachvollziehbarkeit
* erneutes Parsen möglich
* weniger Datenverlust bei Modelländerungen
* einfacheres Debugging
* flexiblere Importlogik

### 3.5 AI arbeitet mit verdichtetem Kontext

Der AI-Coach bekommt nicht unstrukturiert alle Rohdaten.

Stattdessen erzeugt das Backend einen `AthleteContext`.

Dieser enthält nur die relevanten Informationen für Trainingsplanung und Analyse.

### 3.6 MVP vor Automatisierung

Der MVP soll ohne offizielle Garmin API funktionieren.

Priorität im MVP:

1. Mock-Daten
2. manueller Dateiimport
3. internes Datenmodell
4. Dashboard
5. Trainingsplanung
6. AI-Coach v1

Automatische Syncs und Drittanbieter-Integrationen kommen später.

---

## 4. High-Level Systemübersicht

Die Anwendung besteht aus folgenden Hauptbestandteilen:

```txt
Frontend
React + Vite + TypeScript
        ↓
Backend API
Node.js + TypeScript
        ↓
Application Services
Import, Activities, Training Plans, AI Coach
        ↓
Database
PostgreSQL + Prisma
        ↓
External Services
Garmin / Strava / Aggregator / OpenAI
```

Die zentrale Datenverarbeitung läuft über das Backend.

Das Frontend ist hauptsächlich für Darstellung, Interaktion und User-Flows zuständig.

---

## 5. Datenfluss

Der grundlegende Datenfluss sieht so aus:

```txt
Data Source
FIT Upload / Mock Data / Garmin / Strava / Aggregator
        ↓
Source Adapter
        ↓
Validation
        ↓
Raw Data Storage
        ↓
Normalization Layer
        ↓
Canonical Training Data Model
        ↓
Analytics Layer
        ↓
Athlete Context Builder
        ↓
Dashboard / AI-Coach / Training Plan
```

Dieser Datenfluss ist die Grundlage für alle Importarten.

Egal ob eine Aktivität aus einer FIT-Datei, von Garmin oder über Strava kommt, sie wird am Ende in dasselbe interne Modell überführt.

---

## 6. Vorgeschlagene Projektstruktur

Für `pp-trainer` wird eine Monorepo-Struktur empfohlen.

```txt
pp-trainer/
├── apps/
│   ├── web/
│   │   └── React + Vite + TypeScript Frontend
│   │
│   └── api/
│       └── Node.js + TypeScript Backend
│
├── packages/
│   └── shared/
│       └── gemeinsame Types, Schemas und Utilities
│
├── docs/
│   ├── 00-project-blueprint.md
│   ├── 01-requirements.md
│   ├── 02-feature-scope.md
│   ├── 03-architecture.md
│   ├── 04-data-model.md
│   ├── 05-data-sources-and-import-strategy.md
│   ├── 06-ai-coach.md
│   ├── 07-roadmap.md
│   │
│   └── adr/
│       ├── ADR-001-frontend-framework.md
│       ├── ADR-002-backend-framework.md
│       ├── ADR-003-database.md
│       └── ADR-004-ai-integration.md
│
├── prisma/
│   └── schema.prisma
│
├── README.md
├── package.json
└── .env.example
```

Diese Struktur erlaubt eine klare Trennung zwischen Frontend, Backend, gemeinsamen Typen und Dokumentation.

---

## 7. Frontend Architecture

### 7.1 Technologie

Geplante Frontend-Technologien:

```txt
React
Vite
TypeScript
React Router
TanStack Query
optional Zustand
```

Styling wird separat entschieden.

Mögliche Optionen:

* bestehende Styling-Struktur aus dem eigenen React-Frame
* CSS Modules
* Tailwind
* eigene Design Tokens

### 7.2 Aufgaben des Frontends

Das Frontend ist verantwortlich für:

* Darstellung des Dashboards
* Darstellung der Aktivitätsliste
* Darstellung von Aktivitätsdetails
* Darstellung des Wochenplans
* Darstellung von Workout Cards
* Darstellung von AI-Vorschlägen
* User-Interaktionen
* Formulare für Settings, Ziele und Trainingszonen
* Upload-UI für manuelle Importe
* Aufruf der Backend API

Das Frontend ist nicht verantwortlich für:

* direkte Garmin-Kommunikation
* direkte OpenAI-Kommunikation
* Speicherung sensibler API Keys
* finale Validierung von Importdaten
* Normalisierung externer Daten
* Berechnung langfristiger Trainingsmetriken aus Rohdaten

### 7.3 Frontend-Schichten

Mögliche Struktur innerhalb von `apps/web`:

```txt
apps/web/src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
│
├── pages/
│   ├── dashboard/
│   ├── activities/
│   ├── activity-detail/
│   ├── training-plan/
│   ├── ai-coach/
│   └── settings/
│
├── features/
│   ├── activities/
│   ├── training-plan/
│   ├── workouts/
│   ├── ai-coach/
│   ├── imports/
│   └── athlete-profile/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── charts/
│
├── lib/
│   ├── api/
│   ├── formatters/
│   └── utils/
│
├── types/
└── main.tsx
```

### 7.4 Frontend-Datenzugriff

Das Frontend ruft nur eigene Backend-Endpunkte auf.

Beispiele:

```txt
GET /api/activities
GET /api/activities/:id
POST /api/imports/activity-file
GET /api/training-plans/current-week
POST /api/ai/generate-week-plan
POST /api/ai/generate-workout
GET /api/athlete/profile
PUT /api/athlete/profile
```

TanStack Query kann für Server State verwendet werden.

Lokaler UI-State kann mit React State oder optional Zustand verwaltet werden.

---

## 8. Backend Architecture

### 8.1 Technologie

Geplante Backend-Technologien:

```txt
Node.js
TypeScript
Fastify oder NestJS
PostgreSQL
Prisma
```

Die genaue Entscheidung zwischen Fastify und NestJS wird später über eine ADR dokumentiert.

Aktuelle Tendenz:

```txt
Fastify für einen schlanken, direkten Start
NestJS, falls stärkere Struktur und mehr Framework-Konvention gewünscht sind
```

### 8.2 Aufgaben des Backends

Das Backend ist verantwortlich für:

* API-Endpunkte für das Frontend
* Datei-Uploads
* Importvalidierung
* Parser-Integration
* Normalisierung externer Daten
* Speicherung in PostgreSQL
* Zugriff auf Prisma
* AI-Coach-Anbindung
* Erstellung des Athlete Context
* Validierung von AI-Ausgaben
* spätere Garmin- oder Strava-Synchronisierung
* Fehlerbehandlung und Logging

### 8.3 Backend-Schichten

Mögliche Struktur innerhalb von `apps/api`:

```txt
apps/api/src/
├── main.ts
├── app.ts
│
├── modules/
│   ├── activities/
│   │   ├── activities.routes.ts
│   │   ├── activities.service.ts
│   │   └── activities.repository.ts
│   │
│   ├── imports/
│   │   ├── imports.routes.ts
│   │   ├── imports.service.ts
│   │   ├── adapters/
│   │   ├── parsers/
│   │   └── normalizers/
│   │
│   ├── training-plans/
│   │   ├── training-plans.routes.ts
│   │   ├── training-plans.service.ts
│   │   └── training-plans.repository.ts
│   │
│   ├── workouts/
│   │   ├── workouts.routes.ts
│   │   ├── workouts.service.ts
│   │   └── workouts.repository.ts
│   │
│   ├── ai-coach/
│   │   ├── ai-coach.routes.ts
│   │   ├── ai-coach.service.ts
│   │   ├── athlete-context.builder.ts
│   │   └── ai-output.validator.ts
│   │
│   ├── athlete-profile/
│   └── data-sources/
│
├── db/
│   ├── prisma.ts
│   └── repositories/
│
├── config/
├── shared/
└── utils/
```

### 8.4 Service Layer

Die Business-Logik liegt in Services.

Beispiele:

```txt
ActivityService
ImportService
TrainingPlanService
WorkoutService
AiCoachService
AthleteContextBuilder
DataSourceService
```

Routes sollen möglichst dünn bleiben.

Routes nehmen Requests entgegen, validieren Eingaben grob und leiten an Services weiter.

---

## 9. Data Source Adapter Layer

### 9.1 Ziel

Die Data Source Adapter Layer abstrahiert externe Datenquellen.

Jede Quelle bekommt einen eigenen Adapter.

Mögliche Datenquellen:

```txt
manual_fit_upload
manual_gpx_upload
manual_tcx_upload
manual_json_import
manual_csv_import
garmin_official
garmin_unofficial
garmin_export
strava
aggregator
```

### 9.2 Adapter Pattern

Beispielhafte Struktur:

```ts
type DataSourceType =
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

interface ActivityImporter {
  source: DataSourceType;
  importActivities(input: unknown): Promise<ImportedActivity[]>;
}
```

### 9.3 MVP-Priorität

Für den MVP werden primär unterstützt:

```txt
1. Mock-Daten
2. manueller JSON-Import oder strukturierte Beispieldaten
3. manueller FIT-/GPX-/TCX-Upload, sobald technisch eingeplant
```

Garmin und Strava werden architektonisch berücksichtigt, aber nicht als MVP-Voraussetzung behandelt.

---

## 10. Import and Normalization Pipeline

### 10.1 Ziel

Alle importierten Daten sollen dieselbe Pipeline durchlaufen.

```txt
Input
        ↓
Validate
        ↓
Parse
        ↓
Store raw data
        ↓
Normalize
        ↓
Deduplicate
        ↓
Store canonical activity
        ↓
Trigger analytics update
        ↓
Update athlete context
```

### 10.2 Validate

In dieser Phase wird geprüft:

* Ist die Datei lesbar?
* Ist das Format unterstützt?
* Enthält die Datei Aktivitätsdaten?
* Sind Pflichtfelder vorhanden?
* Ist der Upload plausibel?

### 10.3 Parse

Der Parser liest das Quellformat ein.

Beispiele:

```txt
FIT Parser
GPX Parser
TCX Parser
JSON Parser
CSV Parser
Garmin API Mapper
Strava API Mapper
```

Parser erzeugen noch nicht direkt interne App-Entities, sondern ein Zwischenergebnis.

### 10.4 Store Raw Data

Optional werden Rohdaten gespeichert.

Beispiele:

```txt
ImportedFile
RawActivityData
RawSourcePayload
```

### 10.5 Normalize

Die Normalisierung transformiert externe oder geparste Daten in das interne Modell.

Beispiel:

```txt
Garmin averageSpeedInMetersPerSecond
        ↓
Activity.averageSpeedKmh
```

oder:

```txt
FIT timestamp + records
        ↓
Activity.startTime
ActivityMetricSample[]
```

### 10.6 Deduplicate

Die App muss doppelte Aktivitäten erkennen können.

Mögliche Kriterien:

```txt
externalId
source
fileHash
sport
startTime
duration
distance
```

### 10.7 Store Canonical Activity

Nach erfolgreicher Normalisierung wird die Aktivität im internen Modell gespeichert.

Ab diesem Punkt arbeiten Dashboard, Analyse und AI-Coach nur noch mit der internen Aktivität.

---

## 11. Database Layer

### 11.1 Technologie

Geplant:

```txt
PostgreSQL
Prisma
```

PostgreSQL eignet sich gut, weil `pp-trainer` viele relationale Daten verwaltet:

* User
* Aktivitäten
* Datenquellen
* Importe
* Trainingspläne
* geplante Workouts
* Workout-Schritte
* AI-Empfehlungen
* Zonen
* Ziele

### 11.2 Rolle von Prisma

Prisma wird verwendet für:

* Datenbankschema
* Type-safe Queries
* Migrationen
* lokale Entwicklung
* klare Modellierung der Entities

### 11.3 Grundsätzliche Datenbereiche

Das konkrete Datenmodell wird in `docs/04-data-model.md` definiert.

Auf Architekturebene werden folgende Bereiche erwartet:

```txt
Athlete Profile
Data Sources
Imports
Raw Data
Activities
Activity Details
Training Zones
Training Goals
Training Plans
Planned Workouts
Workout Steps
AI Coach Outputs
Analytics Snapshots
```

### 11.4 Keine direkte UI-Kopplung

Die Datenbankstruktur bestimmt nicht direkt die UI-Struktur.

Zwischen Datenbank und Frontend liegen:

```txt
Repository
Service
DTO / API Response
Frontend Query
UI Component
```

Dadurch bleibt die Datenbank flexibel.

---

## 12. AI-Coach Architecture

### 12.1 Grundsatz

Der AI-Coach wird nicht direkt aus dem Frontend aufgerufen.

Alle AI-Requests laufen über das Backend.

```txt
Frontend
        ↓
Backend AI Endpoint
        ↓
Athlete Context Builder
        ↓
OpenAI API
        ↓
AI Output Validator
        ↓
Training Plan / Workout
        ↓
Database
        ↓
Frontend
```

### 12.2 Athlete Context Builder

Der `AthleteContextBuilder` erzeugt aus gespeicherten Daten eine kompakte, strukturierte Zusammenfassung.

Mögliche Inhalte:

```txt
Athlete Profile
Current Goals
Training Zones
Recent Activities
Weekly Volume
Planned Workouts
Missed Workouts
Recovery Indicators
Sport-Specific Performance Values
Availability
```

Der Athlete Context ist die Grundlage für AI-generierte Empfehlungen.

### 12.3 Strukturierte AI-Ausgaben

AI-Ausgaben sollen nicht nur als Fließtext gespeichert werden.

Sie sollen in interne Modelle überführt werden können.

Beispiele:

```txt
TrainingPlan
PlannedWorkout
WorkoutStep
AiCoachRecommendation
```

### 12.4 AI Output Validation

AI-Ausgaben müssen validiert werden.

Ziele:

* keine unvollständigen Workouts speichern
* ungültige Sportarten abfangen
* fehlende Pflichtfelder erkennen
* unrealistische oder leere Ausgaben vermeiden
* sichere Weiterverarbeitung ermöglichen

### 12.5 User Confirmation

AI-generierte Pläne und Workouts werden nicht automatisch verbindlich übernommen.

Der User kann:

```txt
Vorschlag ansehen
Vorschlag übernehmen
Vorschlag bearbeiten
Vorschlag verwerfen
```

---

## 13. Analytics Layer

### 13.1 Ziel

Die Analytics Layer berechnet abgeleitete Trainingsmetriken aus internen Daten.

MVP-Metriken:

```txt
Wochenumfang
Umfang pro Sportart
Anzahl Aktivitäten
geplanter vs. absolvierter Umfang
einfache Intensitätsverteilung
```

Post-MVP-Metriken:

```txt
Trainingsbelastung
Power-Trends
Pace-Trends
Herzfrequenz-Trends
Planerfüllung
Belastungsentwicklung
```

Endprodukt-Metriken:

```txt
Erholungsanalyse
Langfristige Leistungsentwicklung
Tapering-Bewertung
Race Readiness
Trainingsmonotonie
```

### 13.2 Berechnungsstrategie

Am Anfang können Metriken bei Bedarf berechnet werden.

Später können Snapshots oder Caches ergänzt werden.

Mögliche Struktur:

```txt
Activity Data
        ↓
Analytics Service
        ↓
Weekly Summary
        ↓
Dashboard
        ↓
Athlete Context
```

---

## 14. API Design

### 14.1 Grundsatz

Die API ist die Schnittstelle zwischen Frontend und Backend.

Sie soll ressourcenorientiert, verständlich und stabil sein.

Mögliche MVP-Endpunkte:

```txt
GET    /api/health

GET    /api/athlete/profile
PUT    /api/athlete/profile

GET    /api/activities
GET    /api/activities/:id
POST   /api/imports/activity-file
POST   /api/imports/mock-data

GET    /api/training-plans/current-week
POST   /api/training-plans
GET    /api/training-plans/:id

GET    /api/workouts/:id
POST   /api/workouts
PUT    /api/workouts/:id

POST   /api/ai/generate-week-plan
POST   /api/ai/generate-workout
POST   /api/ai/analyze-week
```

### 14.2 DTOs

Das Backend gibt nicht direkt Datenbankmodelle an das Frontend zurück.

Stattdessen werden DTOs verwendet.

Beispiele:

```txt
ActivityListItemDto
ActivityDetailDto
WeeklyDashboardDto
TrainingPlanDto
WorkoutCardDto
WorkoutDetailDto
AiGeneratedPlanDto
```

Vorteile:

* UI bekommt nur benötigte Daten
* Datenbank bleibt intern
* API kann stabiler bleiben
* sensible oder unnötige Felder werden nicht versehentlich ausgegeben

---

## 15. Shared Package

### 15.1 Ziel

Das Package `packages/shared` kann gemeinsame Typen, Schemas und Utilities enthalten.

Mögliche Inhalte:

```txt
SportType
DataSourceType
WorkoutIntensity
WorkoutStatus
ActivityDto
WorkoutDto
TrainingPlanDto
AI Output Schemas
Validation Schemas
Date Utilities
Unit Conversion Utilities
```

### 15.2 Vorsicht

Nicht alles muss sofort in `shared`.

Zu frühes Auslagern kann Komplexität erhöhen.

Empfehlung:

* erst lokal im Frontend oder Backend starten
* nur stabile, wirklich gemeinsam genutzte Typen auslagern
* keine Backend-internen Datenbankmodelle blind ins Frontend teilen

---

## 16. Security and Secrets

### 16.1 Keine Secrets im Frontend

Folgende Daten dürfen nicht im Frontend liegen:

```txt
OpenAI API Key
Garmin Client Secret
Strava Client Secret
Aggregator API Keys
Database Credentials
JWT Secrets
```

### 16.2 Environment Variables

Secrets werden über Environment Variables verwaltet.

Beispiele:

```txt
DATABASE_URL
OPENAI_API_KEY
GARMIN_CLIENT_ID
GARMIN_CLIENT_SECRET
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
```

### 16.3 MVP-Sicherheit

Da der MVP zunächst nur für einen User gedacht ist, kann Authentifizierung zu Beginn einfach gehalten werden.

Trotzdem gilt:

* keine offenen produktiven Daten
* keine Secrets im Repository
* `.env.example` statt echter `.env`
* Backend als Schutzschicht für externe APIs

### 16.4 Spätere Authentifizierung

Mögliche spätere Optionen:

```txt
Session-based Auth
JWT Auth
OAuth Provider
Single-User Admin Login
Multi-User Auth
```

Für den MVP wird Auth nicht als zentraler Scope behandelt, solange die App lokal oder geschützt betrieben wird.

---

## 17. Error Handling

### 17.1 Importfehler

Importfehler müssen verständlich sein.

Beispiele:

```txt
Unsupported file type
Invalid activity file
Missing required activity data
Duplicate activity detected
Could not parse file
```

### 17.2 API-Fehler

API-Fehler sollen konsistent aufgebaut sein.

Beispiel:

```ts
type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};
```

### 17.3 AI-Fehler

AI-spezifische Fehler:

```txt
AI response invalid
AI output missing required fields
AI service unavailable
Athlete context incomplete
```

### 17.4 UI-Fehlerzustände

Das Frontend muss folgende Zustände abfangen:

```txt
Loading
Empty
Error
Partial Data
Unsupported Data
Validation Error
```

---

## 18. Testing Strategy

### 18.1 Fokus im MVP

Für den MVP sind besonders wichtig:

```txt
Parser Tests
Normalizer Tests
Deduplication Tests
Athlete Context Builder Tests
AI Output Validation Tests
Service Tests
```

### 18.2 Frontend Tests

Mögliche Frontend-Testbereiche:

```txt
ActivityCard
WorkoutCard
Dashboard widgets
Empty states
Error states
Forms
```

### 18.3 Backend Tests

Mögliche Backend-Testbereiche:

```txt
Import pipeline
Activity service
Training plan service
AI coach service
Validation schemas
DTO mapping
```

### 18.4 Testdaten

Für Tests sollen stabile Beispiel-Datensätze genutzt werden.

Beispiele:

```txt
sample-running-activity.json
sample-cycling-activity.json
sample-swimming-activity.json
sample-week-plan.json
sample-athlete-context.json
```

---

## 19. Deployment Perspective

Deployment ist nicht Teil des ersten Architektur-Fokus, soll aber berücksichtigt werden.

Mögliche spätere Deployment-Struktur:

```txt
Frontend Hosting
        ↓
Backend API Hosting
        ↓
PostgreSQL Database
        ↓
External APIs
```

Mögliche Optionen:

```txt
Vercel für Frontend
Railway / Render / Fly.io für Backend und Datenbank
Docker-basierter Server
eigener VPS
```

Für den MVP ist lokale Entwicklung ausreichend.

Wichtig ist nur, dass die Architektur ein späteres Deployment nicht verhindert.

---

## 20. Performance Considerations

### 20.1 Dashboard

Das Dashboard soll nicht alle Rohdaten laden.

Stattdessen werden aggregierte Daten genutzt.

Beispiele:

```txt
Weekly Summary
Recent Activities
Current Training Plan
Next Workout
Sport Distribution
```

### 20.2 Detaildaten

Große Detaildaten wie GPS-Tracks oder Zeitreihen sollen nur geladen werden, wenn sie benötigt werden.

Beispiel:

```txt
Activity List
zeigt nur Zusammenfassung

Activity Detail
lädt Detaildaten bei Bedarf
```

### 20.3 Spätere Optimierungen

Mögliche Optimierungen:

```txt
Cached Analytics Snapshots
Background Jobs
Pagination
Lazy Loading
Database Indexes
Precomputed Weekly Summaries
```

---

## 21. Scalability Perspective

Der MVP ist ein Single-User-System.

Trotzdem soll die Architektur spätere Erweiterungen nicht verhindern.

Mögliche spätere Erweiterungen:

```txt
Multi-User Support
Coach Mode
Multiple Data Sources per User
Background Sync Jobs
Workout Export
AI Plan History
Advanced Analytics
```

Das bedeutet nicht, dass diese Funktionen jetzt gebaut werden.

Es bedeutet nur, dass die Architektur nicht bewusst dagegen arbeiten soll.

---

## 22. Architekturentscheidungen

Folgende Entscheidungen sind aktuell gesetzt:

| Bereich      | Entscheidung                                   |
| ------------ | ---------------------------------------------- |
| Frontend     | React + Vite + TypeScript                      |
| Backend      | Node.js + TypeScript                           |
| Datenbank    | PostgreSQL                                     |
| ORM          | Prisma                                         |
| AI-Anbindung | über Backend, nicht direkt im Frontend         |
| Datenquellen | Adapter-basiert                                |
| Kernmodell   | internes Trainingsdatenmodell                  |
| MVP-Import   | Mock-Daten und manueller Import                |
| Garmin       | langfristige Zielintegration, kein MVP-Blocker |
| App-Modell   | zunächst Single User                           |

Folgende Entscheidungen sind noch offen:

| Bereich           | Offene Entscheidung                                           |
| ----------------- | ------------------------------------------------------------- |
| Backend-Framework | Fastify oder NestJS                                           |
| Styling           | bestehendes Styling, CSS Modules, Tailwind oder Design Tokens |
| FIT-Parser        | konkrete Library oder eigene Parsing-Schicht                  |
| Auth              | kein Auth, einfacher Login oder spätere Auth-Lösung           |
| Deployment        | lokal zuerst, später Hosting-Entscheidung                     |
| Testing           | konkrete Testtools und Testtiefe                              |

---

## 23. Zusammenhang mit anderen Dokumenten

Diese Datei ist Teil der Projektdokumentation.

Verwandte Dokumente:

```txt
00-project-blueprint.md
01-requirements.md
02-feature-scope.md
04-data-model.md
05-data-sources-and-import-strategy.md
06-ai-coach.md
07-roadmap.md
```

Die Architektur beschreibt die technische Struktur.

Das konkrete Datenmodell wird in `04-data-model.md` ausgearbeitet.

Die Datenquellenstrategie wird in `05-data-sources-and-import-strategy.md` detailliert beschrieben.

Das AI-Coach-Konzept wird in `06-ai-coach.md` vertieft.

---

## 24. Zusammenfassung

`pp-trainer` wird als modulare Fullstack-Webapp aufgebaut.

Die Anwendung besteht aus:

* React + Vite + TypeScript Frontend
* Node.js + TypeScript Backend
* PostgreSQL Datenbank
* Prisma ORM
* Adapter-basierter Importarchitektur
* internem Trainingsdatenmodell
* Backend-basierter AI-Coach-Anbindung

Der wichtigste Architekturgrundsatz bleibt:

> Datenquellen sind austauschbar. Das interne Trainingsdatenmodell ist der stabile Kern.

Dadurch kann der MVP mit Mock-Daten und manuellem Import starten, während Garmin, Strava, Aggregatoren und Exportfunktionen später ergänzt werden können, ohne die komplette App neu aufzubauen.
