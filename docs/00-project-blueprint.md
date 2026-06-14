# Fitness Coach Dashboard — Project Blueprint

Stand: 14.06.2026

## 1. Projektidee

Ziel dieses Projekts ist die Entwicklung einer persönlichen Fitness-Trainer-Dashboard-Webapp. Die Anwendung soll Trainings-, Aktivitäts- und Gesundheitsdaten aus externen Quellen, insbesondere Garmin Connect, abrufen, speichern, strukturieren, auswerten und in einer eigenen Weboberfläche darstellen.

Im ersten Schritt dient die Anwendung als persönliches Dashboard für einen einzelnen User. Dieser User bin zunächst ich selbst. Langfristig soll daraus jedoch eine intelligente Trainingsplattform entstehen, die nicht nur vergangene Trainingsdaten visualisiert, sondern auf Basis dieser Daten konkrete Trainingsentscheidungen unterstützen kann.

Die zentrale Idee ist:

> Eine persönliche Webapp, die meine Garmin- und Trainingsdaten bündelt, analysiert und mithilfe einer AI-Coach-Funktion individuelle Trainingspläne sowie einzelne Trainingseinheiten erstellt.

Der Fokus liegt nicht darauf, Garmin Connect einfach nachzubauen. Stattdessen soll die Anwendung eine eigene, auf meine Bedürfnisse zugeschnittene Trainingszentrale werden.

---

## 2. Zielbild

Die Anwendung soll langfristig eine Mischung aus persönlichem Trainingsdashboard, Trainingsplanungstool und AI-Coach werden.

Das Zielbild umfasst:

* zentrale Übersicht über Trainings- und Gesundheitsdaten
* Aktivitäten aus Garmin Connect abrufen und auswerten
* Wochen-, Monats- und Saisonübersichten anzeigen
* Trainingsbelastung, Umfang und Intensität analysieren
* persönliche Ziele, Wettkämpfe und Trainingsphasen berücksichtigen
* Wochenpläne mit geplanten Einheiten darstellen
* einzelne Einheiten detailliert beschreiben
* AI-basierte Trainingsplanung auf Basis echter Daten ermöglichen
* sportartspezifische Einheiten für Radfahren, Laufen, Schwimmen und Krafttraining erstellen

Langfristig soll die Anwendung ähnlich wie TrainingPeaks oder andere Trainingsplattformen funktionieren, aber stärker auf meine persönliche Nutzung und meine eigene Trainingslogik zugeschnitten sein.

---

## 3. Motivation

Garmin Connect stellt bereits viele Aktivitäts- und Gesundheitsdaten bereit. Die Daten sind jedoch stark an Garmins eigene Darstellung und Logik gebunden.

Für meine persönliche Nutzung möchte ich eine eigene Plattform entwickeln, die:

* alle relevanten Trainingsinformationen gebündelt darstellt
* stärker auf Triathlon, Rennrad, Laufen, Schwimmen und Krafttraining ausgerichtet ist
* eigene Auswertungen ermöglicht
* Trainingsdaten mit AI-gestützter Planung verbindet
* nicht nur vergangene Daten zeigt, sondern konkrete nächste Schritte ableitet
* als langfristiges persönliches Softwareprojekt sauber aufgebaut wird

Das Projekt soll bewusst nicht direkt durch schnelles Coden entstehen, sondern von Anfang an mit sauberer Dokumentation, klarer Architektur und nachvollziehbaren Entscheidungen aufgebaut werden.

---

## 4. Zielgruppe

### Primäre Zielgruppe

Die primäre Zielgruppe bin zunächst ich selbst als Single User.

Mein sportlicher Fokus:

* Rennrad
* Triathlonrad
* Laufen
* Schwimmen
* Krafttraining
* Mobilität und Regeneration

Die Anwendung soll meine persönlichen Trainingsziele, Leistungswerte, Trainingshistorie, Verfügbarkeiten und sportlichen Einschränkungen berücksichtigen.

### Sekundäre mögliche Zielgruppe

Später könnte die Anwendung theoretisch auch für andere ambitionierte Hobbysportler interessant sein, insbesondere für:

* Triathleten
* Rennradfahrer
* Läufer
* Ausdauersportler mit strukturiertem Training
* Sportler, die ihre Trainingsdaten besser verstehen wollen

Diese Erweiterung ist jedoch nicht Teil des MVP.

---

## 5. Produktumfang

Das Projekt besteht konzeptionell aus drei großen Bereichen:

1. Datenplattform
2. Dashboard
3. AI-Coach

### 5.1 Datenplattform

Die Datenplattform ist die technische Grundlage der Anwendung.

Sie soll:

* Garmin-Daten importieren
* Rohdaten speichern
* Daten normalisieren
* Aktivitäten und Gesundheitsdaten strukturiert ablegen
* berechnete Metriken erzeugen
* Daten für Dashboard und AI-Coach bereitstellen

Wichtig ist, dass die Anwendung nicht direkt um eine einzelne externe API herum gebaut wird. Stattdessen soll ein eigenes internes Datenmodell entstehen.

### 5.2 Dashboard

Das Dashboard ist die sichtbare Oberfläche der Anwendung.

Es soll:

* aktuelle Trainingswoche anzeigen
* abgeschlossene Aktivitäten darstellen
* geplante Einheiten anzeigen
* Belastung und Umfang visualisieren
* Trends sichtbar machen
* Detailansichten für einzelne Aktivitäten bereitstellen
* langfristig auch Erholung, Schlaf und Trainingsbereitschaft berücksichtigen

### 5.3 AI-Coach

Der AI-Coach soll auf Basis der gespeicherten Daten Trainingsvorschläge erstellen.

Er soll:

* Wochenpläne erstellen
* einzelne Trainingseinheiten generieren
* sportartspezifische Inhalte liefern
* Watt-, Pace-, Puls- und Technikbereiche berücksichtigen
* verpasste Einheiten einordnen
* Trainingsbelastung und Erholung berücksichtigen
* langfristig adaptive Trainingsplanung ermöglichen

---

## 6. MVP-Scope

Der erste MVP soll bewusst klein und realistisch bleiben.

Ziel des MVP ist nicht, direkt eine perfekte Trainingsplattform zu bauen. Ziel ist es, die zentrale Grundlogik zu beweisen:

> Trainingsdaten können gespeichert, sinnvoll dargestellt, ausgewertet und für AI-basierte Trainingsplanung genutzt werden.

### 6.1 MVP-Funktionen

Der MVP soll folgende Funktionen enthalten:

* Dashboard-Startseite
* aktuelle Trainingswoche
* Aktivitätsübersicht
* Aktivitätsdetailseite
* Wochenumfang nach Sportart
* einfache Belastungsübersicht
* persönliche Trainingszonen
* manuell oder per Mock-Daten angelegte Aktivitäten
* geplante Workouts als Karten
* AI-generierter Wochenplan
* AI-generierte Einzeleinheiten
* einfache Settings-Seite für Ziele und Trainingsdaten

### 6.2 MVP ohne Garmin-Abhängigkeit

Der MVP soll zunächst nicht von einer funktionierenden Garmin-Integration abhängig sein.

Stattdessen soll zuerst mit Mock-Daten oder manuell importierten Daten gearbeitet werden.

Grund:

* Garmin API-Zugriff kann zeitaufwendig oder eingeschränkt sein
* die Produktlogik soll unabhängig von Garmin validiert werden
* UI, Datenmodell und AI-Coach können auch ohne echten Live-Sync entwickelt werden
* später kann Garmin als externe Datenquelle ergänzt werden

### 6.3 MVP-Erfolgskriterium

Der MVP gilt als erfolgreich, wenn folgende Punkte funktionieren:

* Aktivitäten können im System gespeichert werden
* Trainingsdaten werden im Dashboard sinnvoll dargestellt
* eine Woche kann als Trainingsplan abgebildet werden
* geplante Workouts können als Cards angezeigt werden
* ein AI-Coach kann auf Basis eines strukturierten Athlete Context einen Wochenplan generieren
* die generierten Einheiten sind sportartspezifisch und praktisch nutzbar

---

## 7. Nicht-Ziele des MVP

Folgende Funktionen gehören bewusst nicht in den ersten MVP:

* Multi-User-System
* Registrierung und Login für mehrere Nutzer
* Bezahlmodell
* Coach-/Athletenrollen
* Mobile App
* vollständiger Garmin Connect Ersatz
* vollständiger TrainingPeaks Ersatz
* direkter Export zu Zwift
* direkter Export zu MyWhoosh
* direkter Push von Workouts zu Garmin
* automatisches Ändern von Trainingsplänen ohne Bestätigung
* komplexes Ernährungstracking
* Social Features
* öffentliche Profile
* medizinische Empfehlungen oder Diagnosen

Diese Funktionen können später geprüft werden, sollen aber den MVP nicht verkomplizieren.

---

## 8. Future Features

Mögliche spätere Erweiterungen:

### 8.1 Trainingsintegration

* Export von Radeinheiten als strukturierte Workouts
* Export zu Zwift
* Export zu MyWhoosh
* Export zu Garmin Connect
* Erstellung von Garmin-kompatiblen Workouts
* Strecken- oder Routenintegration

### 8.2 AI-Coach Erweiterungen

* adaptive Plananpassung nach verpassten Einheiten
* automatische Anpassung bei hoher Belastung
* Wettkampfvorbereitung
* Tapering-Logik
* Saisonplanung
* periodisierte Trainingsblöcke
* Race-spezifische Empfehlungen
* Fueling-Empfehlungen für lange Einheiten und Wettkämpfe

### 8.3 Analysefunktionen

* langfristige Leistungsentwicklung
* FTP- und Schwellenwertentwicklung
* Laufpace-Trends
* Schwimmpace-Trends
* Erholungsanalyse
* Schlaf- und Belastungskorrelation
* Trainingsmonotonie
* Intensitätsverteilung
* Vergleich zwischen geplanten und absolvierten Einheiten

### 8.4 Produkt-Erweiterungen

* PWA
* Mobile-optimierte Ansicht
* Kalenderansicht
* Drag-and-Drop Wochenplanung
* Template-System für Workouts
* eigene Workout-Bibliothek
* Export als PDF
* Coach-Modus
* Multi-User-Funktion

---

## 9. Technische Grundidee

Die Anwendung soll als moderne Fullstack-Webapp mit TypeScript umgesetzt werden.

Der aktuelle Ausgangspunkt ist ein bestehendes React + Vite + TypeScript Framework. Dieses kann als Frontend-Basis verwendet werden.

Da die Anwendung jedoch langfristig Backend, Datenbank, externe API-Integrationen und AI-Funktionalität benötigt, sollte das Projekt nicht nur als reines Frontend-Projekt aufgebaut werden.

Empfohlen wird eine Monorepo-Struktur.

---

## 10. Vorgeschlagener Tech Stack

### 10.1 Frontend

Empfehlung:

* React
* Vite
* TypeScript
* React Router
* TanStack Query
* optional Zustand für lokalen UI-State
* CSS Modules, Tailwind oder bestehende Styling-Struktur aus dem eigenen Frame

Begründung:

* React + Vite + TypeScript passt gut zum bestehenden Workflow
* schnelle Entwicklung
* gute Komponentenstruktur
* gute Eignung für Dashboard-Interfaces
* starke Kompatibilität mit Charts, Tabellen und UI-Bibliotheken

### 10.2 Backend

Empfehlung:

* Node.js
* TypeScript
* Fastify oder NestJS

Fastify wäre schlanker und gut geeignet, wenn das Backend überschaubar bleibt.

NestJS wäre strukturierter und stärker opinionated, wenn das Projekt langfristig größer und komplexer wird.

Offene Entscheidung:

* Fastify für schnellen, schlanken Start
* NestJS für stärker strukturierte Enterprise-ähnliche Architektur

### 10.3 Datenbank

Empfehlung:

* PostgreSQL

Begründung:

* relationale Trainingsdaten lassen sich gut modellieren
* Aktivitäten, Workouts, Metriken und Pläne haben klare Beziehungen
* robust und langfristig skalierbar
* gute Integration mit Prisma

### 10.4 ORM

Empfehlung:

* Prisma

Begründung:

* TypeScript-freundlich
* klares Schema
* gute Developer Experience
* schnelle Iteration
* gut geeignet für MVP und spätere Erweiterung

### 10.5 AI-Anbindung

Empfehlung:

* OpenAI API über das Backend
* keine direkte API-Nutzung im Frontend
* strukturierte Prompts
* strukturierte JSON-Ausgaben
* klar definierte AI-Kontextobjekte

### 10.6 Jobs und Synchronisierung

Für den Start:

* einfache manuelle Sync-Funktion
* später Cron Jobs

Später möglich:

* BullMQ
* Redis
* Background Worker
* geplante Garmin-Synchronisierung

---

## 11. Empfohlene Projektstruktur

Vorgeschlagene Monorepo-Struktur:

```txt
fitness-coach-dashboard/
├── apps/
│   ├── web/
│   │   └── React + Vite + TypeScript Frontend
│   │
│   └── api/
│       └── Backend API, Garmin Sync, AI Coach
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
│   ├── 05-garmin-integration.md
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
├── package.json
├── README.md
└── .env.example
```

---

## 12. Dokumentationsstruktur

Die Dokumentation soll von Beginn an sauber geführt werden.

Geplante Dateien:

### 12.1 `00-project-blueprint.md`

Zentrale Projektübersicht.

Enthält:

* Projektidee
* Zielbild
* Motivation
* MVP
* technische Grundidee
* Garmin-Strategie
* AI-Coach-Konzept
* Roadmap
* offene Entscheidungen

### 12.2 `01-requirements.md`

Anforderungen.

Enthält:

* funktionale Anforderungen
* nicht-funktionale Anforderungen
* User Stories
* Akzeptanzkriterien

### 12.3 `02-feature-scope.md`

Feature-Abgrenzung.

Enthält:

* MVP Features
* spätere Features
* bewusst ausgeschlossene Features
* Priorisierung

### 12.4 `03-architecture.md`

Technische Architektur.

Enthält:

* Systemübersicht
* Frontend
* Backend
* Datenbank
* API-Schichten
* Authentifizierung
* externe Services

### 12.5 `04-data-model.md`

Datenmodell.

Enthält:

* zentrale Entities
* Relationen
* Garmin-Rohdaten
* normalisierte App-Daten
* berechnete Metriken

### 12.6 `05-garmin-integration.md`

Garmin-Integration.

Enthält:

* API-Möglichkeiten
* Zugriffsvoraussetzungen
* Datenquellen
* Risiken
* Alternativen
* Mock-/Importstrategie

### 12.7 `06-ai-coach.md`

AI-Coach-Konzept.

Enthält:

* Rolle des AI-Coaches
* Athlete Context
* Prompt-Strategie
* strukturierte Outputs
* Grenzen
* Sicherheits- und Plausibilitätsregeln

### 12.8 `07-roadmap.md`

Projektplan.

Enthält:

* Phasen
* Meilensteine
* technische Reihenfolge
* MVP-Ziel
* Future Features

---

## 13. Garmin-Integration

Garmin ist eine zentrale externe Datenquelle, aber gleichzeitig ein potenzielles Projektrisiko.

Die Anwendung soll langfristig Daten aus Garmin Connect beziehen.

Relevante Datenbereiche:

* Aktivitäten
* Herzfrequenz
* Schlaf
* Stress
* Schritte
* Kalorien
* Intensitätsminuten
* Trainingsmetriken
* GPS-Daten
* Pace
* Power
* Trittfrequenz
* Schwimmdaten
* Krafttrainingsdaten

### 13.1 Relevante Garmin-Daten

Für die App wären insbesondere folgende Daten interessant:

#### Aktivitäten

* Aktivitätstyp
* Startzeit
* Dauer
* Distanz
* Durchschnittspace
* Durchschnittsgeschwindigkeit
* Höhenmeter
* Herzfrequenz
* Leistung
* Kalorien
* Trainingszonen
* GPS-Track
* Runden / Splits
* Intervalle

#### Gesundheitsdaten

* Schlafdauer
* Schlafqualität
* Ruhepuls
* Stress
* Body-Battery-artige Erholungsmetriken
* Schritte
* Tageskalorien
* Pulsoximeterdaten, falls vorhanden

#### Leistungsdaten

* FTP
* VO2max
* Laktatschwelle, falls verfügbar
* Trainingsbelastung
* Erholungszeit
* Intensitätsminuten

### 13.2 Risiko

Die offizielle Garmin API ist nicht zwingend für einfache private Einzelprojekte frei nutzbar. Der Zugriff kann an ein Developer- oder Business-Programm gebunden sein.

Deshalb darf das Projekt nicht vom ersten Tag an von einem funktionierenden Garmin-Live-Sync abhängig sein.

### 13.3 Strategie

Die Garmin-Integration wird in drei Stufen behandelt:

#### Stufe 1: Mock-Daten

Für UI, Datenmodell und AI-Coach werden zunächst realistische Mock-Daten verwendet.

#### Stufe 2: Manueller Import

Falls notwendig, können Aktivitäten zunächst über exportierte Dateien oder manuell erzeugte JSON-Daten importiert werden.

Mögliche Formate:

* FIT
* GPX
* TCX
* CSV
* manuelle JSON-Dateien

#### Stufe 3: Echte Garmin API

Wenn Zugriff möglich ist, wird eine echte Garmin-Synchronisierung implementiert.

---

## 14. Datenstrategie

Die Anwendung soll Daten nicht nur anzeigen, sondern in mehreren Schichten verarbeiten.

### 14.1 Datenfluss

```txt
Externe Quelle
z. B. Garmin
        ↓
Rohdaten-Import
        ↓
Speicherung der Originaldaten
        ↓
Normalisierung in internes Datenmodell
        ↓
Berechnung eigener Trainingsmetriken
        ↓
Dashboard-Darstellung
        ↓
Athlete Context für AI-Coach
        ↓
Trainingsplan / Empfehlungen / Workouts
```

### 14.2 Grundprinzip

Externe Daten und interne Daten sollen getrennt werden.

Garmin-Daten werden nicht direkt überall in der App verwendet. Stattdessen werden sie importiert und anschließend in ein eigenes internes Modell transformiert.

Vorteile:

* bessere Kontrolle über Datenstruktur
* weniger Abhängigkeit von Garmin
* einfachere Erweiterbarkeit
* bessere Grundlage für AI-Coach
* alternative Datenquellen später möglich

### 14.3 Mögliche zentrale Entities

```txt
User
GarminConnection
Activity
ActivityMetricSample
DailyHealthSummary
SleepSummary
TrainingZone
TrainingPlan
PlannedWorkout
WorkoutStep
CompletedWorkoutLink
AiCoachRecommendation
SyncJob
```

### 14.4 Rohdaten vs. normalisierte Daten

Es soll zwischen Rohdaten und normalisierten Daten unterschieden werden.

#### Rohdaten

Rohdaten sind unveränderte Daten aus externen Quellen.

Beispiele:

* Garmin API Response
* FIT-Datei
* GPX-Datei
* TCX-Datei

#### Normalisierte Daten

Normalisierte Daten sind die internen Datenstrukturen der App.

Beispiele:

* Activity
* Workout
* DailySummary
* TrainingZone
* TrainingPlan

---

## 15. AI-Coach-Konzept

Der AI-Coach ist eine der zentralen Funktionen der Anwendung.

Wichtig ist, dass die AI nicht einfach unstrukturiert alle Daten bekommt. Stattdessen soll das Backend aus den gespeicherten Daten einen kompakten und relevanten Athlete Context erzeugen.

### 15.1 Athlete Context

Der Athlete Context ist eine strukturierte Zusammenfassung des aktuellen sportlichen Zustands.

Mögliche Inhalte:

* aktuelle Ziele
* nächster Wettkampf
* verfügbare Trainingstage
* aktuelle FTP
* aktuelle Laufpaces
* aktuelle Schwimmpace
* Herzfrequenzzonen
* Powerzonen
* Pacezonen
* letzte 4 Wochen Trainingsumfang
* letzte 7 Tage Belastung
* letzte 7 Tage Schlaf
* Ruhepuls-Trend
* abgeschlossene Einheiten
* verpasste Einheiten
* subjektive Einschränkungen
* verfügbare Zeit pro Tag
* bevorzugte Trainingsstruktur

### 15.2 AI-Aufgaben

Der AI-Coach soll folgende Aufgaben übernehmen können:

* Wochenplan erstellen
* einzelne Einheit erstellen
* bestehende Einheit anpassen
* Trainingswoche analysieren
* verpasste Einheit einordnen
* Regenerationsempfehlung geben
* sportartspezifische Intervalle erstellen
* Schwimmtechnik-Einheiten erstellen
* Krafttraining ergänzen
* Race-Woche planen
* Tapering vorschlagen

### 15.3 Strukturierte Ausgabe

AI-Ausgaben sollen nicht nur Fließtext sein.

Stattdessen sollen Trainingspläne und Workouts möglichst strukturiert ausgegeben werden.

Beispiel:

```ts
type TrainingWeek = {
  weekStart: string;
  focus: string;
  summary: string;
  workouts: Workout[];
};

type Workout = {
  sport: 'run' | 'bike' | 'swim' | 'strength' | 'mobility' | 'rest';
  title: string;
  durationMinutes: number;
  intensity: 'easy' | 'tempo' | 'threshold' | 'vo2max' | 'recovery';
  description: string;
  steps: WorkoutStep[];
};

type WorkoutStep = {
  type: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'main' | 'technique';
  durationMinutes?: number;
  distanceMeters?: number;
  targetPowerWatts?: string;
  targetPace?: string;
  targetHeartRateZone?: string;
  instruction: string;
};
```

### 15.4 AI-Sicherheit und Grenzen

Die AI soll keine medizinischen Diagnosen stellen.

Sie darf Hinweise geben wie:

* Belastung wirkt hoch
* Erholung scheint eingeschränkt
* lockere Einheit wäre sinnvoll
* Ruhetag könnte angebracht sein

Sie soll aber keine medizinischen Aussagen treffen.

Außerdem sollen AI-generierte Trainingspläne zunächst immer als Vorschlag betrachtet werden. Der User muss sie prüfen und bestätigen.

---

## 16. Trainingslogik

Die Trainingslogik soll sportartspezifisch aufgebaut werden.

### 16.1 Radfahren

Relevante Steuerungsgrößen:

* Watt
* FTP
* Powerzonen
* Herzfrequenz
* Dauer
* Kadenz
* Höhenmeter
* Intensitätsverteilung

Mögliche Einheiten:

* Grundlage
* Tempo
* Sweet Spot
* Schwelle
* VO2max
* Over/Unders
* lange Ausfahrt
* Koppelfahrt
* Race Simulation

### 16.2 Laufen

Relevante Steuerungsgrößen:

* Pace
* Herzfrequenz
* Distanz
* Dauer
* Höhenmeter
* Laufzonen
* subjektive Belastung

Mögliche Einheiten:

* lockerer Dauerlauf
* langer Lauf
* Tempodauerlauf
* Schwellenintervalle
* VO2max-Intervalle
* Steigerungen
* Koppellauf
* Race Pace Einheit

### 16.3 Schwimmen

Relevante Steuerungsgrößen:

* Distanz
* Pace pro 100 m
* Technikfokus
* Intervalle
* Pausen
* Gesamtumfang

Mögliche Einheiten:

* Technik
* Grundlage
* kurze Intervalle
* längere Intervalle
* CSS-orientierte Sets
* Pullbuoy/Paddles Sets
* Wettkampfspezifische Sets

### 16.4 Krafttraining

Relevante Steuerungsgrößen:

* Muskelgruppen
* Übungsauswahl
* Sätze
* Wiederholungen
* Intensität
* Regenerationswirkung auf Ausdauertraining

Mögliche Einheiten:

* Unterkörper
* Oberkörper
* Core
* Stabilität
* Mobility
* Prehab
* triathlonspezifisches Krafttraining

---

## 17. UI-Konzept

Das UI soll modular und dashboard-orientiert aufgebaut werden.

### 17.1 Wichtige Seiten

Mögliche Hauptseiten:

* Dashboard
* Kalender / Wochenplan
* Aktivitäten
* Aktivitätsdetail
* AI-Coach
* Trainingspläne
* Einstellungen
* Datenquellen / Sync

### 17.2 Dashboard

Das Dashboard soll auf einen Blick zeigen:

* aktuelle Woche
* geplanter Trainingsumfang
* absolvierter Trainingsumfang
* letzte Aktivitäten
* Belastungstrend
* Erholungsindikatoren
* nächstes geplantes Workout
* AI-Hinweise

### 17.3 Wochenplan

Die Wochenplan-Seite soll geplante Einheiten als Cards darstellen.

Jede Card enthält:

* Sportart
* Titel
* Dauer
* Intensität
* kurzer Beschreibungstext
* Status
* Detailansicht beim Öffnen

Status-Werte:

* geplant
* abgeschlossen
* verpasst
* verschoben
* angepasst

### 17.4 Workout Detail

Eine Workout-Detailansicht soll enthalten:

* Ziel der Einheit
* Warm-up
* Hauptteil
* Cool-down
* Zielbereiche
* Hinweise
* geschätzte Belastung
* mögliche Anpassungen

---

## 18. Entwicklungsstrategie

Das Projekt soll nicht direkt mit Code starten.

Die empfohlene Reihenfolge:

1. Blueprint erstellen
2. Anforderungen dokumentieren
3. Feature-Scope festlegen
4. Architektur entscheiden
5. Datenmodell grob entwerfen
6. Mock-Daten definieren
7. UI-Prototyp bauen
8. Backend-Grundlage bauen
9. Datenbank anbinden
10. AI-Coach v1 integrieren
11. Garmin-Integration prüfen und später ergänzen

---

## 19. Zusammenarbeit mit ChatGPT und Codex

### 19.1 Konzeptarbeit

Die konzeptuelle Arbeit soll zunächst im Chat erfolgen.

Geeignet für den Chat:

* Produktidee strukturieren
* Architektur planen
* Anforderungen schreiben
* Datenmodell entwerfen
* AI-Coach-Konzept entwickeln
* Roadmap erstellen
* ADRs formulieren
* technische Entscheidungen vorbereiten

### 19.2 Umsetzung im Repo

Die konkrete Umsetzung soll anschließend mit Codex im Repo erfolgen.

Geeignet für Codex:

* Dateien anlegen
* Projektstruktur umbauen
* Komponenten erstellen
* Backend-Endpunkte implementieren
* Prisma-Schema schreiben
* Tests ergänzen
* Refactorings durchführen
* Issues abarbeiten

### 19.3 Grundregel

Erst planen, dann bauen.

Codex soll nicht ohne klare Dokumentation und Aufgabenbeschreibung mit der Implementierung beginnen.

---

## 20. Roadmap

### Phase 0 — Projektfundament

Ziel:

* Dokumentation anlegen
* Projektstruktur planen
* MVP festlegen
* offene Entscheidungen erfassen

Ergebnisse:

* `00-project-blueprint.md`
* `01-requirements.md`
* `02-feature-scope.md`
* erste ADRs

### Phase 1 — Frontend mit Mock-Daten

Ziel:

* sichtbaren UI-Prototyp bauen
* Dashboard-Struktur testen
* Wochenplan-Ansicht entwickeln
* Activity Cards und Workout Cards erstellen

Ergebnisse:

* Dashboard-Seite
* Wochenplan-Seite
* Aktivitätsliste
* Workout-Detailansicht
* Mock-Daten

### Phase 2 — Backend und Datenbank

Ziel:

* API-Grundlage schaffen
* Datenbankmodell anlegen
* Aktivitäten speichern
* Workouts speichern
* Trainingspläne speichern

Ergebnisse:

* Backend-App
* PostgreSQL
* Prisma Schema
* erste API-Endpunkte

### Phase 3 — AI-Coach v1

Ziel:

* Athlete Context erstellen
* AI-Coach an Backend anbinden
* Wochenplan generieren
* einzelne Workouts generieren

Ergebnisse:

* AI-Coach Endpoint
* strukturierte JSON-Ausgabe
* generierte Workout Cards
* einfache Planbearbeitung

### Phase 4 — Garmin-Strategie

Ziel:

* Garmin-Zugriff klären
* Importstrategie festlegen
* Mock-Daten durch echte Daten ersetzen

Ergebnisse:

* Garmin-Integrationsdokument
* Importservice
* Sync-Konzept
* mögliche manuelle Importfunktion

### Phase 5 — Analyse und Optimierung

Ziel:

* Trainingsmetriken verbessern
* Trends auswerten
* Dashboard aussagekräftiger machen

Ergebnisse:

* Wochenanalyse
* Belastungstrends
* Sportart-Auswertungen
* AI-gestützte Empfehlungen

---

## 21. Offene Entscheidungen

Folgende Entscheidungen sind noch offen:

### 21.1 Projektname

Aktueller Arbeitstitel:

* Fitness Coach Dashboard

Mögliche spätere Namen:

* offen

### 21.2 Backend-Framework

Optionen:

* Fastify
* NestJS
* Express

Tendenz:

* Fastify für schlanken Start
* NestJS, falls stärkere Struktur gewünscht ist

### 21.3 Styling

Optionen:

* bestehendes Styling aus eigenem React-Frame
* CSS Modules
* Tailwind
* eigene Design Tokens

### 21.4 Authentifizierung

Da zunächst nur ein User existiert, ist Auth im MVP nicht zwingend erforderlich.

Später möglich:

* einfacher Login
* OAuth
* Session Auth
* Auth Provider

### 21.5 Garmin-Integration

Offen:

* offizieller API-Zugriff möglich?
* manuelle FIT/GPX/TCX-Importe nötig?
* welche Daten können zuverlässig importiert werden?

### 21.6 AI-Ausgabeformat

Offen:

* JSON-only
* JSON plus erklärender Text
* Speicherung als editierbarer Plan
* direkte Übernahme in Wochenplan nur nach Bestätigung

---

## 22. Risiken

### 22.1 Garmin API-Zugriff

Der Zugriff auf offizielle Garmin-Daten kann eingeschränkt sein.

Gegenmaßnahme:

* MVP mit Mock-Daten bauen
* Importlogik abstrahieren
* Garmin erst später als Datenquelle anbinden

### 22.2 Zu großer Feature-Scope

Das Projekt kann schnell zu groß werden.

Gegenmaßnahme:

* MVP klar begrenzen
* Future Features dokumentieren
* erst Dashboard und AI-Grundlogik beweisen

### 22.3 AI-Ausgaben zu unstrukturiert

AI-generierte Trainingspläne können unbrauchbar werden, wenn sie nur als Fließtext erzeugt werden.

Gegenmaßnahme:

* strukturierte JSON-Ausgaben
* klare Schemas
* Validierung im Backend
* User-Bestätigung vor Übernahme

### 22.4 Datenmodell wird zu früh zu komplex

Trainingsdaten können sehr detailliert werden.

Gegenmaßnahme:

* mit wenigen Kernentities starten
* Rohdaten getrennt speichern
* normalisierte Daten schrittweise erweitern

---

## 23. Erste konkrete nächste Schritte

### Schritt 1

Diese Datei als `docs/00-project-blueprint.md` im Repository anlegen.

### Schritt 2

Weitere Dokumentationsdateien vorbereiten:

```txt
docs/
├── 00-project-blueprint.md
├── 01-requirements.md
├── 02-feature-scope.md
├── 03-architecture.md
├── 04-data-model.md
├── 05-garmin-integration.md
├── 06-ai-coach.md
└── 07-roadmap.md
```

### Schritt 3

Aus diesem Blueprint die Anforderungen ableiten.

### Schritt 4

MVP-Features priorisieren.

### Schritt 5

Repo-Struktur festlegen.

### Schritt 6

Erst danach mit Code beginnen.

---

## 24. Zusammenfassung

Dieses Projekt soll eine persönliche Fullstack-Webapp für Trainingsdaten, Dashboarding und AI-basierte Trainingsplanung werden.

Der wichtigste Grundsatz lautet:

> Nicht direkt loscoden, sondern zuerst ein sauberes Fundament aus Dokumentation, Architektur, Datenmodell und MVP-Scope schaffen.

Der erste MVP soll beweisen, dass Trainingsdaten gespeichert, dargestellt, ausgewertet und für AI-generierte Trainingsplanung genutzt werden können.

Garmin ist langfristig eine wichtige Datenquelle, darf aber am Anfang nicht zur technischen Blockade werden. Deshalb startet das Projekt mit Mock-Daten und einer eigenen internen Datenstruktur.

Die AI-Coach-Funktion soll nicht als einfacher Chatbot entstehen, sondern als strukturierter Trainingsassistent, der auf Basis eines Athlete Context konkrete Wochenpläne und Workouts erzeugt.