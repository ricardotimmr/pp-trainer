# Data Sources and Import Strategy

Stand: 14.06.2026

## 1. Ziel dieser Datei

Diese Datei beschreibt die Strategie für den Import von Trainings-, Aktivitäts- und Gesundheitsdaten in die Fitness Coach Dashboard Webapp.

Ursprünglich lag der Fokus stark auf Garmin. Da der Zugriff auf die offiziellen Garmin APIs jedoch noch nicht sicher ist, wird die App nicht als reine Garmin-App geplant. Stattdessen wird sie als quellunabhängige Trainingsdatenplattform aufgebaut.

Der wichtigste Architekturgrundsatz lautet:

> External sources are replaceable. The internal training model is the stable core.

Das bedeutet:

* Garmin ist die bevorzugte Datenquelle, aber nicht die einzige mögliche Quelle.
* Die App darf nicht direkt von Garmin-spezifischen Datenstrukturen abhängig sein.
* Alle externen Datenquellen werden über Adapter angebunden.
* Externe Rohdaten werden zuerst gespeichert oder verarbeitet und anschließend in ein eigenes internes Datenmodell normalisiert.
* Dashboard, Analysefunktionen und AI-Coach arbeiten ausschließlich mit dem internen App-Datenmodell.

---

## 2. Grundproblem

Die App soll langfristig Fitness- und Aktivitätsdaten automatisiert aus Garmin Connect abrufen. Dafür wären offizielle Garmin APIs wie die Garmin Health API und die Garmin Activity API ideal.

Aktuell ist jedoch noch offen:

* ob offizieller API-Zugriff gewährt wird
* wie aufwendig die Freigabe ist
* welche Daten tatsächlich verfügbar sind
* ob historische Daten abgerufen werden können
* ob API-Zugriff für ein persönliches Projekt realistisch ist
* welche Nutzungsbedingungen gelten
* ob alternative Datenquellen benötigt werden

Deshalb darf der MVP nicht davon abhängig sein, dass Garmin sofort funktioniert.

---

## 3. Architekturprinzip

Die App wird nicht datenquellenspezifisch, sondern datenmodellzentriert aufgebaut.

Statt:

```txt
Garmin API → Dashboard → AI-Coach
```

wird folgende Struktur verwendet:

```txt
Data Source
Garmin / FIT / Strava / Export / Aggregator
        ↓
Source Adapter
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

Dadurch bleibt die Anwendung flexibel.

Wenn später eine Datenquelle nicht funktioniert oder ersetzt werden muss, betrifft das nur den jeweiligen Adapter und nicht die komplette App.

---

## 4. Zentrale Entscheidung

Die App soll intern niemals direkt mit Garmin-, Strava- oder Aggregator-spezifischen Objekten arbeiten.

Stattdessen werden externe Daten in eigene interne Entities transformiert.

Beispiele für interne Entities:

```txt
User
DataSourceConnection
ImportedFile
RawActivityData
Activity
ActivityLap
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

Wichtig ist die Trennung zwischen:

```txt
Externe Rohdaten
        ↓
Normalisierte App-Daten
        ↓
Berechnete Trainingsmetriken
        ↓
AI-Kontext
        ↓
Trainingsplan / Empfehlung / Workout
```

---

## 5. Bewertete Datenquellen

Für das Projekt werden aktuell sieben mögliche Datenquellen beziehungsweise Importwege betrachtet.

Die ersten drei Optionen werden für den MVP und die erste Projektphase am höchsten priorisiert.

Aktuelle Priorisierung:

```txt
1. Manueller FIT-/GPX-/TCX-Upload
2. Offizielle Garmin APIs
3. python-garminconnect
4. Garmin Connect Export
5. Strava API
6. Aggregator API
7. Manueller JSON-/CSV-/Mock-Datenimport
```

Apple Health und Google Health Connect werden aktuell bewusst nicht weiter verfolgt, da sie eher für native Mobile Apps relevant sind und für eine reine Webapp keinen direkten MVP-Vorteil bieten.

---

## 6. Option 1 — Manueller FIT-/GPX-/TCX-Upload

### Priorität

Sehr hoch.

Für den MVP aktuell die wichtigste und sicherste Importstrategie.

### Beschreibung

Beim manuellen Upload lädt der User exportierte Aktivitätsdateien in die Webapp hoch.

Mögliche Dateiformate:

* FIT
* GPX
* TCX

Diese Dateien können aus Garmin Connect oder anderen Plattformen exportiert werden.

### Warum diese Option für den MVP am wichtigsten ist

Der manuelle Upload ist aktuell die robusteste Lösung, weil er unabhängig von externen API-Freigaben funktioniert.

Vorteile:

* kein offizieller Garmin API-Zugriff erforderlich
* keine OAuth-Integration im ersten Schritt erforderlich
* echte eigene Trainingsdaten können trotzdem verwendet werden
* ideal zum Testen des Datenmodells
* ideal zum Testen der Aktivitätsdetailseiten
* ideal zum Aufbau der Normalisierungsschicht
* reduziert das Projektrisiko deutlich
* verhindert, dass der MVP an Garmin scheitert

### Geeignete Daten

Besonders geeignet für:

* abgeschlossene Aktivitäten
* Laufen
* Radfahren
* Schwimmen
* GPS-Tracks
* Dauer
* Distanz
* Pace
* Geschwindigkeit
* Höhenmeter
* Herzfrequenz
* Leistung
* Kadenz
* Runden / Splits
* teilweise Intervalldaten

### Einschränkungen

Mögliche Einschränkungen:

* kein automatischer Sync
* Gesundheitsdaten wie Schlaf, Stress oder Ruhepuls sind darüber nur eingeschränkt oder gar nicht verfügbar
* User muss Dateien manuell exportieren und hochladen
* Parsing von FIT-Dateien kann technisch aufwendiger sein
* je nach Datei können Datenfelder fehlen

### Rolle im Projekt

Diese Option sollte für den MVP als primäre Importquelle eingeplant werden.

Der MVP soll mindestens in der Lage sein, Aktivitäten über manuelle Uploads oder vorbereitete Beispieldaten zu importieren und im internen Datenmodell zu speichern.

### Bewertung

```txt
MVP-Relevanz: sehr hoch
Technisches Risiko: mittel
Externe Abhängigkeit: niedrig
Datenqualität: hoch für Aktivitäten
Automatisierung: niedrig
Langfristige Eignung: mittel
```

### Entscheidung

Der manuelle FIT-/GPX-/TCX-Upload wird als wichtigste MVP-Importstrategie behandelt.

---

## 7. Option 2 — Offizielle Garmin APIs

### Priorität

Hoch.

Langfristig bevorzugte Lösung, aber nicht MVP-blockierend.

### Beschreibung

Die offiziellen Garmin APIs wären die sauberste Lösung, um Aktivitäts- und Gesundheitsdaten strukturiert von Garmin zu erhalten.

Relevante APIs:

* Garmin Health API
* Garmin Activity API
* perspektivisch Garmin Training API
* perspektivisch Garmin Courses API

### Erwartete Datenbereiche

Mögliche Aktivitätsdaten:

* Aktivitätstyp
* Startzeit
* Dauer
* Distanz
* GPS-Daten
* Pace
* Geschwindigkeit
* Herzfrequenz
* Leistung
* Trittfrequenz
* Höhenmeter
* Kalorien
* Laps / Splits
* Schwimmdaten
* Krafttrainingsdaten

Mögliche Gesundheitsdaten:

* Schritte
* Herzfrequenz
* Ruhepuls
* Schlaf
* Stress
* Body-Battery-artige Daten
* Kalorien
* Intensitätsminuten
* Pulse Ox, falls verfügbar

### Vorteile

* offizielle Schnittstelle
* sauberer OAuth-Flow
* potenziell automatische Synchronisierung
* gute Datenqualität
* Gesundheits- und Aktivitätsdaten aus einer Quelle
* langfristig beste User Experience

### Einschränkungen und Risiken

* API-Zugriff muss von Garmin freigegeben werden
* möglicherweise eher für Business-/Partner-Anwendungen gedacht
* Freigabeprozess unklar
* mögliche Einschränkungen bei historischen Daten
* mögliche Einschränkungen bei bestimmten Metriken
* nicht sicher, ob persönlicher Single-User-Use-Case akzeptiert wird
* Implementierung hängt von API-Dokumentation und Freigabe ab

### Rolle im Projekt

Die offiziellen Garmin APIs bleiben die bevorzugte Langfristlösung.

Sie dürfen jedoch nicht Voraussetzung für den MVP sein.

### Bewertung

```txt
MVP-Relevanz: hoch, aber nicht blockierend
Technisches Risiko: mittel
Zugriffsrisiko: hoch
Externe Abhängigkeit: hoch
Datenqualität: sehr hoch
Automatisierung: hoch
Langfristige Eignung: sehr hoch
```

### Entscheidung

Die offizielle Garmin API wird als primäre Zielintegration betrachtet, aber erst umgesetzt, wenn Zugriff, Datenumfang und technische Bedingungen geklärt sind.

---

## 8. Option 3 — python-garminconnect

### Priorität

Hoch für Prototyping, mittel für langfristige Nutzung.

### Beschreibung

`python-garminconnect` ist eine inoffizielle Library, mit der Garmin-Connect-Daten ausgelesen werden können.

Sie kann für private Prototypen interessant sein, wenn offizieller API-Zugriff nicht sofort möglich ist.

### Vorteile

* wahrscheinlich schneller nutzbar als die offizielle API
* interessant für privaten Single-User-Prototyp
* kann viele Garmin-Connect-Daten zugänglich machen
* hilfreich zum Testen mit echten eigenen Daten
* gute Zwischenlösung, falls offizieller API-Zugriff lange dauert

### Einschränkungen und Risiken

* inoffiziell
* potenziell abhängig von internen Garmin-Endpunkten
* kann jederzeit durch Garmin-Änderungen brechen
* rechtliche und nutzungsbezogene Unsicherheit
* nicht ideal für ein öffentliches oder kommerzielles Produkt
* zusätzliche technische Brücke zwischen Python und TypeScript-Backend nötig, falls Backend in Node.js gebaut wird

### Mögliche technische Einbindung

Wenn diese Option genutzt wird, sollte sie nicht direkt ins Hauptbackend eingebaut werden.

Mögliche Ansätze:

```txt
Node.js Backend
        ↓
separater Python Import Worker
        ↓
normalisierte Daten
        ↓
PostgreSQL
```

oder:

```txt
Python Script
        ↓
JSON Export
        ↓
Import Endpoint im Backend
        ↓
Normalisierung
        ↓
Datenbank
```

### Rolle im Projekt

`python-garminconnect` kann als privater Datenimport-Prototyp genutzt werden.

Die Library sollte aber nicht zur zentralen Grundlage der App-Architektur werden.

### Bewertung

```txt
MVP-Relevanz: hoch für private Tests
Technisches Risiko: mittel
Zugriffsrisiko: mittel
Externe Abhängigkeit: hoch
Datenqualität: potenziell hoch
Automatisierung: mittel bis hoch
Langfristige Eignung: niedrig bis mittel
```

### Entscheidung

`python-garminconnect` wird als möglicher privater Fallback-Adapter betrachtet, aber nicht als stabile Hauptintegration geplant.

---

## 9. Option 4 — Garmin Connect Export

### Priorität

Mittel.

### Beschreibung

Garmin Connect bietet verschiedene Möglichkeiten, Daten manuell zu exportieren. Je nach Bereich können einzelne Aktivitäten oder größere Datenpakete exportiert werden.

Diese Exporte können als Grundlage für manuelle Importe in die eigene App dienen.

### Vorteile

* offizieller als inoffizielle Libraries
* kein API-Zugriff erforderlich
* geeignet für historische Daten
* gut für initialen Datenimport
* kann mit manueller Upload-Strategie kombiniert werden

### Einschränkungen

* nicht automatisiert
* Exportstruktur kann unhandlich sein
* möglicherweise viele einzelne Dateien
* Daten müssen aufbereitet werden
* Gesundheitsdaten eventuell nicht so komfortabel nutzbar
* keine gute langfristige User Experience

### Rolle im Projekt

Garmin Export kann als ergänzende Importstrategie verwendet werden, insbesondere für:

* initialen historischen Datenimport
* Testdaten
* Migration eigener Trainingshistorie
* Fallback, falls API-Zugriff nicht möglich ist

### Bewertung

```txt
MVP-Relevanz: mittel
Technisches Risiko: mittel
Externe Abhängigkeit: niedrig bis mittel
Datenqualität: mittel bis hoch
Automatisierung: niedrig
Langfristige Eignung: niedrig bis mittel
```

### Entscheidung

Garmin Connect Export wird als Fallback und Ergänzung zum manuellen Dateiimport berücksichtigt.

---

## 10. Option 5 — Strava API

### Priorität

Mittel bis niedrig für MVP, mittel für spätere Erweiterung.

### Beschreibung

Strava kann als alternative Quelle für Aktivitätsdaten dienen.

Viele Garmin-Aktivitäten werden ohnehin automatisch zu Strava synchronisiert. Dadurch könnte Strava als indirekte Quelle für abgeschlossene Aktivitäten genutzt werden.

### Vorteile

* verbreitete Plattform
* OAuth-basierte API
* gute Quelle für Aktivitäten
* Aktivitäten aus verschiedenen Geräten können zusammenlaufen
* potenziell einfacher zugänglich als Garmin

### Einschränkungen

* Fokus eher auf Aktivitäten, weniger auf Gesundheitsdaten
* nicht alle Garmin-Metriken vollständig vorhanden
* mögliche Einschränkungen durch API-Nutzungsbedingungen
* AI-/ML-Nutzung von API-Daten muss sorgfältig geprüft werden
* nicht ideal als primäre Quelle für Erholung, Schlaf oder Gesundheitsmetriken

### Geeignete Daten

Gut geeignet für:

* Aktivitätsliste
* Sportart
* Distanz
* Dauer
* Geschwindigkeit
* Pace
* Höhenmeter
* teilweise Herzfrequenz
* teilweise Leistung
* GPS-Track

Weniger geeignet für:

* Schlaf
* Stress
* Body Battery
* Ruhepuls
* detaillierte Garmin-spezifische Trainingsmetriken

### Rolle im Projekt

Strava kann später als zusätzliche Aktivitätsquelle eingebunden werden.

Für den MVP ist Strava nicht notwendig, solange manuelle Uploads oder Garmin-Dateien funktionieren.

### Bewertung

```txt
MVP-Relevanz: niedrig bis mittel
Technisches Risiko: mittel
Externe Abhängigkeit: hoch
Datenqualität: mittel bis hoch für Aktivitäten
Automatisierung: hoch
Langfristige Eignung: mittel
```

### Entscheidung

Strava wird als optionale spätere Aktivitätsquelle betrachtet, aber nicht als MVP-Grundlage.

---

## 11. Option 6 — Aggregator API

### Priorität

Niedrig für MVP, potenziell hoch für spätere Produktentwicklung.

### Beschreibung

Aggregator-Dienste bündeln mehrere Fitness-, Wearable- und Health-Datenquellen über eine gemeinsame API.

Mögliche Beispiele:

* Terra
* Validic
* Human API
* ähnliche Health-/Fitness-Data-Aggregatoren

### Vorteile

* eine API für mehrere Datenquellen
* Garmin, Strava, Polar, Fitbit, WHOOP, Oura etc. potenziell über eine Schnittstelle
* weniger Integrationsaufwand bei vielen Quellen
* gute Option, wenn das Projekt später Multi-User- oder produktähnlich werden soll

### Einschränkungen

* oft kostenpflichtig
* teilweise eher für kommerzielle Produkte gedacht
* zusätzliche Abhängigkeit von Drittanbieter
* Datenschutz und Datenverarbeitung müssen genau geprüft werden
* für privaten MVP wahrscheinlich Overkill

### Rolle im Projekt

Aggregator APIs sind für den MVP nicht notwendig.

Sie bleiben eine spätere Option, falls:

* offizieller Garmin-Zugriff nicht funktioniert
* mehrere Datenquellen unterstützt werden sollen
* die App über den persönlichen Single-User-Use-Case hinauswächst
* eine professionellere Integrationsschicht benötigt wird

### Bewertung

```txt
MVP-Relevanz: niedrig
Technisches Risiko: mittel
Externe Abhängigkeit: hoch
Datenqualität: abhängig vom Anbieter
Automatisierung: hoch
Langfristige Eignung: mittel bis hoch
Kostenrisiko: hoch
```

### Entscheidung

Aggregator APIs werden als spätere Option dokumentiert, aber nicht für den MVP eingeplant.

---

## 12. Option 7 — Manueller JSON-/CSV-/Mock-Datenimport

### Priorität

Mittel bis hoch für Entwicklung, niedrig als langfristige User-Funktion.

### Beschreibung

Neben echten Aktivitätsdateien kann die App auch vorbereitete JSON- oder CSV-Daten importieren.

Diese Option ist besonders für Entwicklung, Tests und AI-Coach-Prototyping relevant.

### Vorteile

* sehr schnell umsetzbar
* ideal für Mock-Daten
* gut für UI-Entwicklung
* gut für Tests
* gut für reproduzierbare Demo-Daten
* unabhängig von externen Plattformen
* hilfreich, bevor echte Importparser fertig sind

### Einschränkungen

* keine echte Integration
* Datenqualität hängt vom manuell erstellten Format ab
* nicht komfortabel für langfristige Nutzung
* kein automatischer Sync

### Rolle im Projekt

Diese Option ist besonders in Phase 1 wichtig, um UI und AI-Coach unabhängig von echten Datenquellen entwickeln zu können.

Sie eignet sich für:

* Mock-Aktivitäten
* Beispielwochen
* Beispiel-Trainingspläne
* simulierte Gesundheitsdaten
* Tests für Normalisierung und Athlete Context

### Bewertung

```txt
MVP-Relevanz: mittel bis hoch für Entwicklung
Technisches Risiko: niedrig
Externe Abhängigkeit: keine
Datenqualität: abhängig vom Datensatz
Automatisierung: niedrig
Langfristige Eignung: niedrig
```

### Entscheidung

Manueller JSON-/CSV-/Mock-Datenimport wird als Entwicklungs- und Testwerkzeug berücksichtigt, aber nicht als zentrale Produktfunktion.

---

## 13. Bewusst ausgeschlossene Optionen

### 13.1 Apple Health

Apple Health wird aktuell nicht weiter verfolgt.

Grund:

* primär für native iOS-Apps relevant
* keine einfache direkte Webapp-Integration
* würde eine zusätzliche iOS-App oder Companion-App erfordern
* für den MVP kein klarer Vorteil

### 13.2 Google Health Connect

Google Health Connect wird aktuell nicht weiter verfolgt.

Grund:

* primär für native Android-Apps relevant
* keine direkte reine Webapp-Integration
* würde eine zusätzliche Android-App oder Companion-App erfordern
* für den MVP kein klarer Vorteil

### Entscheidung

Apple Health und Google Health Connect werden aus dem aktuellen Datenquellen-Scope entfernt.

Sie können später erneut bewertet werden, falls eine mobile App oder Companion-App geplant wird.

---

## 14. Priorisierung für den MVP

Für den MVP ergibt sich folgende Reihenfolge:

```txt
1. Manueller FIT-/GPX-/TCX-Upload
2. Manueller JSON-/CSV-/Mock-Datenimport für Entwicklung und Tests
3. Offizielle Garmin APIs parallel klären
4. python-garminconnect als privater Fallback prüfen
5. Garmin Connect Export als Ergänzung prüfen
6. Strava API später optional prüfen
7. Aggregator API später optional prüfen
```

Wichtig:

Der manuelle Upload wird für den MVP am höchsten priorisiert, weil er echte Trainingsdaten ermöglicht, ohne dass die App von einer externen API-Freigabe abhängig ist.

Die offiziellen Garmin APIs bleiben langfristig das bevorzugte Ziel, sind aber kein MVP-Blocker.

---

## 15. Empfohlene Import-Architektur

### 15.1 Adapter Pattern

Jede Datenquelle erhält einen eigenen Adapter.

Beispiel:

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
```

Beispiel-Interface:

```ts
interface ActivityImporter {
  source: DataSourceType;
  importActivities(input: unknown): Promise<ImportedActivity[]>;
}
```

### 15.2 Import Pipeline

Alle Datenquellen durchlaufen dieselbe Pipeline:

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

### 15.3 Vorteile dieser Struktur

* neue Datenquellen können später ergänzt werden
* bestehende Datenquellen können ersetzt werden
* Dashboard bleibt unabhängig von Importdetails
* AI-Coach bleibt unabhängig von Garmin
* Tests werden einfacher
* MVP kann ohne API-Zugang starten

---

## 16. Rohdaten und normalisierte Daten

### 16.1 Raw Data Storage

Für importierte Daten sollte optional eine Rohdatenkopie gespeichert werden.

Beispiele:

```txt
RawActivityData
RawHealthData
ImportedFile
ExternalSourcePayload
```

Zweck:

* Debugging
* Re-Parsing bei späteren Modelländerungen
* Nachvollziehbarkeit
* Schutz vor Datenverlust
* bessere Entwicklung der Normalisierungslogik

### 16.2 Canonical Training Data Model

Das interne Datenmodell ist die stabile Grundlage der App.

Beispiel:

```ts
type Activity = {
  id: string;
  source: DataSourceType;
  externalId?: string;
  sport: SportType;
  startTime: string;
  durationSeconds: number;
  distanceMeters?: number;
  elevationGainMeters?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePowerWatts?: number;
  normalizedPowerWatts?: number;
  averagePaceSecondsPerKm?: number;
  averageSpeedKmh?: number;
  calories?: number;
};
```

Beispiel für Sportarten:

```ts
type SportType =
  | 'cycling'
  | 'running'
  | 'swimming'
  | 'strength'
  | 'mobility'
  | 'other';
```

---

## 17. Deduplication

Da dieselbe Aktivität über mehrere Wege importiert werden könnte, braucht die App eine Deduplizierungsstrategie.

Beispiel:

Eine Radfahrt könnte vorkommen als:

* Garmin FIT-Datei
* Garmin API Aktivität
* Strava Aktivität
* Garmin Export Datei

Mögliche Vergleichskriterien:

* Startzeit
* Dauer
* Distanz
* Sportart
* externe ID
* Datei-Hash
* Quelle
* Aktivitätsname

Mögliche Strategie:

```txt
1. Wenn externalId + source eindeutig ist → Match
2. Wenn Datei-Hash bereits existiert → Duplikat
3. Wenn Startzeit, Dauer, Distanz und Sportart sehr ähnlich sind → potenzielles Duplikat
4. User kann bei Unsicherheit entscheiden
```

---

## 18. Relevanz für den AI-Coach

Der AI-Coach darf nicht wissen müssen, ob eine Aktivität aus Garmin, Strava oder einem manuellen Upload stammt.

Der AI-Coach arbeitet nur mit einem strukturierten Athlete Context.

Beispiel:

```txt
Athlete Context
├── aktuelle Ziele
├── nächste Wettkämpfe
├── verfügbare Trainingstage
├── aktuelle Leistungswerte
├── letzte 7 Tage Belastung
├── letzte 4 Wochen Umfang
├── letzte Aktivitäten
├── geplante Einheiten
├── verpasste Einheiten
└── Erholungsindikatoren
```

Die Datenquelle ist nur Metainformation.

Wichtig ist:

```txt
Nicht: Garmin sagt X
Sondern: Das interne Modell berechnet/enthält X
```

---

## 19. Konsequenz für das Dashboard

Auch das Dashboard darf nicht datenquellenspezifisch aufgebaut werden.

Schlecht:

```txt
GarminActivityCard
GarminSleepWidget
GarminPowerChart
```

Besser:

```txt
ActivityCard
SleepWidget
PowerChart
TrainingLoadWidget
```

Die Datenquelle kann im UI optional angezeigt werden, soll aber nicht die Komponentenstruktur bestimmen.

Beispiel:

```txt
ActivityCard
Sport: Cycling
Source: Garmin FIT Upload
Duration: 2:14:32
Distance: 68.4 km
Average Power: 214 W
```

---

## 20. Entscheidung für die aktuelle Projektphase

Für die aktuelle Projektphase gilt:

### Primär

* internes Datenmodell definieren
* Mock-Daten erstellen
* manuellen FIT-/GPX-/TCX-Upload für MVP einplanen
* Dashboard und AI-Coach auf normalisierte Daten ausrichten

### Parallel

* offiziellen Garmin API-Zugriff klären
* technische Machbarkeit von `python-garminconnect` prüfen
* Garmin Connect Exportmöglichkeiten prüfen

### Später

* Strava API bewerten
* Aggregator API bewerten
* Apple Health und Google Health Connect nur bei Mobile-App-Relevanz erneut prüfen

---

## 21. Aktuelle Empfehlung

Die App sollte in folgender Reihenfolge entwickelt werden:

```txt
1. Internes Datenmodell und Import-Pipeline konzipieren
2. Mock-Daten und manuelle JSON-Daten für UI und AI-Coach nutzen
3. Manuellen FIT-/GPX-/TCX-Upload als MVP-Importfunktion vorbereiten
4. Aktivitäten normalisieren und in PostgreSQL speichern
5. Dashboard und Aktivitätsdetailseiten auf Basis interner Daten bauen
6. Athlete Context aus internen Daten generieren
7. AI-Coach mit Athlete Context verbinden
8. Offizielle Garmin API parallel weiter klären
9. Falls möglich: Garmin Official Adapter implementieren
10. Falls nicht möglich: python-garminconnect oder Garmin Export als Fallback nutzen
```

---

## 22. Zusammenfassung

Die Datenquellenstrategie verhindert, dass das Projekt von Garmin abhängig wird.

Für den MVP ist der manuelle FIT-/GPX-/TCX-Upload aktuell die beste und sicherste Lösung, weil damit echte Trainingsdaten genutzt werden können, ohne auf eine API-Freigabe warten zu müssen.

Die offiziellen Garmin APIs bleiben langfristig das bevorzugte Ziel, sind aber kein Blocker.

`python-garminconnect` kann als privater Prototyp-Fallback interessant sein, sollte aber nicht zur zentralen Architekturgrundlage werden.

Strava und Aggregator APIs bleiben spätere Optionen.

Apple Health und Google Health Connect werden aktuell aus dem Scope entfernt, weil sie für eine reine Webapp im MVP keinen klaren Vorteil bieten.

Der stabile Kern der App ist nicht Garmin, sondern das eigene interne Trainingsdatenmodell.