# Requirements

Stand: 14.06.2026

## 1. Ziel dieser Datei

Diese Datei beschreibt die Anforderungen an die Fitness Coach Dashboard Webapp.

Die Anforderungen werden bewusst zwischen MVP und langfristigem Endprodukt unterschieden.

Der MVP soll beweisen, dass Trainingsdaten importiert, normalisiert, dargestellt und für AI-gestützte Trainingsplanung genutzt werden können.

Das Endprodukt beschreibt die langfristige Vision einer persönlichen Trainingsplattform mit Dashboard, Analyse, AI-Coach, Trainingsplanung und möglichen Drittanbieter-Integrationen.

---

## 2. Projektkontext

Die Anwendung ist eine persönliche Fullstack-Webapp für Trainings-, Aktivitäts- und Gesundheitsdaten.

Sie soll zunächst für einen einzelnen User entwickelt werden. Dieser User ist der Entwickler selbst.

Langfristig soll die App als persönliche Trainingszentrale dienen und folgende Bereiche verbinden:

* Trainingsdatenimport
* Aktivitätsdashboard
* Trainingsanalyse
* Wochenplanung
* AI-gestützte Trainingsplanung
* sportartspezifische Workouts
* spätere Export- und Integrationsfunktionen

Die App wird nicht als reine Garmin-App geplant. Garmin ist eine wichtige potenzielle Datenquelle, aber nicht der stabile Kern der Anwendung.

Der stabile Kern ist das interne Trainingsdatenmodell.

---

## 3. Begriffe

### MVP

Der erste nutzbare Prototyp der Anwendung.

Der MVP muss nicht alle langfristigen Funktionen enthalten, soll aber die zentrale Produktidee validieren.

### Endprodukt

Die langfristige Zielversion der Anwendung mit erweiterten Integrationen, Automatisierungen und Analysefunktionen.

### Activity

Eine abgeschlossene Trainingseinheit, zum Beispiel Radfahren, Laufen, Schwimmen oder Krafttraining.

### Planned Workout

Eine geplante Trainingseinheit innerhalb eines Trainingsplans.

### Training Plan

Ein strukturierter Plan über mehrere Tage oder Wochen.

### Athlete Context

Eine strukturierte Zusammenfassung des aktuellen sportlichen Zustands des Users. Dieser Kontext wird aus gespeicherten Daten erzeugt und dem AI-Coach als Grundlage gegeben.

### Data Source

Eine externe oder manuelle Datenquelle, aus der Trainingsdaten importiert werden können.

Beispiele:

* manueller FIT-Upload
* GPX/TCX-Datei
* Garmin API
* Garmin Export
* Strava API
* Mock-Daten

---

## 4. Prioritätsmodell

Die Anforderungen werden mit folgender Priorisierung bewertet:

| Priorität | Bedeutung                                                          |
| --------- | ------------------------------------------------------------------ |
| Must      | Muss für den MVP umgesetzt werden                                  |
| Should    | Sollte nach Möglichkeit im MVP oder direkt danach umgesetzt werden |
| Could     | Kann später umgesetzt werden                                       |
| Future    | Gehört klar zum langfristigen Endprodukt                           |

Zusätzlich wird jede Anforderung einem Scope zugeordnet:

| Scope        | Bedeutung                                |
| ------------ | ---------------------------------------- |
| MVP          | Teil des ersten validierbaren Produkts   |
| Post-MVP     | Sinnvolle Erweiterung nach dem MVP       |
| Endprodukt   | Teil der langfristigen Zielversion       |
| Out of Scope | Bewusst nicht Teil der aktuellen Planung |

---

## 5. MVP-Ziel

Der MVP soll folgende Kernfrage beantworten:

> Kann die App Trainingsdaten unabhängig von einer bestimmten Datenquelle importieren, intern normalisieren, sinnvoll darstellen und daraus AI-gestützte Trainingspläne erzeugen?

Der MVP ist erfolgreich, wenn:

* Aktivitäten importiert oder als Mock-Daten geladen werden können
* Aktivitäten im internen Datenmodell gespeichert werden können
* ein Dashboard grundlegende Trainingsinformationen darstellt
* geplante Workouts als Cards dargestellt werden können
* ein strukturierter Athlete Context erzeugt werden kann
* der AI-Coach daraus einen Wochenplan oder einzelne Workouts generieren kann
* die generierten Workouts sportartspezifisch und praktisch nutzbar sind

---

# 6. Funktionale Anforderungen

## 6.1 User und Grundkonfiguration

### FA-001 — Single-User-Betrieb

**Beschreibung:**
Die Anwendung soll zunächst für genau einen User ausgelegt sein.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Die App kann ohne Multi-User-System verwendet werden.
* Es gibt eine zentrale User-Konfiguration.
* Persönliche Trainingsdaten können einem User zugeordnet werden.
* Es ist keine öffentliche Registrierung erforderlich.

---

### FA-002 — Persönliche Sportprofil-Daten verwalten

**Beschreibung:**
Der User soll grundlegende persönliche Trainingsdaten hinterlegen können.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* Körpergewicht
* Hauptsportarten
* Trainingsziele
* aktuelle FTP
* Laufpace-Zielwerte
* Schwimmpace-Zielwerte
* Herzfrequenzzonen
* Powerzonen
* verfügbare Trainingstage

**Akzeptanzkriterien:**

* Persönliche Leistungswerte können gespeichert werden.
* Trainingszonen können vom System genutzt werden.
* Der Athlete Context kann auf diese Daten zugreifen.

---

### FA-003 — Ziele und Wettkämpfe hinterlegen

**Beschreibung:**
Der User soll sportliche Ziele und geplante Wettkämpfe hinterlegen können.

**Scope:** MVP
**Priorität:** Should

**Beispiele:**

* Triathlon
* Radrennen
* Halbmarathon
* 10-km-Lauf
* Zielzeit
* Zielpace
* Zielwatt
* Wettkampfdatum

**Akzeptanzkriterien:**

* Ein Ziel kann gespeichert werden.
* Ein Ziel kann im Athlete Context verwendet werden.
* Der AI-Coach kann Trainingspläne auf dieses Ziel beziehen.

---

### FA-004 — Mehrere User unterstützen

**Beschreibung:**
Die Anwendung soll langfristig mehrere User unterstützen können.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Mehrere Accounts können getrennt gespeichert werden.
* Daten verschiedener User sind voneinander isoliert.
* Jeder User hat eigene Datenquellen, Trainingszonen und Pläne.

---

## 6.2 Datenquellen und Import

### FA-005 — Mock-Daten laden

**Beschreibung:**
Die Anwendung soll realistische Mock-Daten verwenden können.

**Scope:** MVP
**Priorität:** Must

**Zweck:**

* UI-Entwicklung
* Dashboard-Prototyping
* AI-Coach-Prototyping
* Tests unabhängig von externen APIs

**Akzeptanzkriterien:**

* Aktivitäten können aus Mock-Daten geladen werden.
* Geplante Workouts können aus Mock-Daten geladen werden.
* Gesundheitsdaten können simuliert werden.
* Die App funktioniert ohne echte Garmin-Verbindung.

---

### FA-006 — Manueller Dateiimport für Aktivitäten

**Beschreibung:**
Der User soll Aktivitätsdateien manuell importieren können.

**Scope:** MVP
**Priorität:** Must

**Unterstützte Formate im Zielbild:**

* FIT
* GPX
* TCX

**MVP-Minimum:**

* mindestens ein reales Aktivitätsformat oder ein vorbereiteter strukturierter Import

**Akzeptanzkriterien:**

* Eine Aktivitätsdatei kann ausgewählt und hochgeladen werden.
* Die Datei wird validiert.
* Die Aktivität wird in das interne Datenmodell überführt.
* Importfehler werden verständlich angezeigt.
* Importierte Aktivitäten erscheinen in der Aktivitätsübersicht.

---

### FA-007 — JSON-/CSV-Import für Entwicklung und Tests

**Beschreibung:**
Die App soll strukturierte JSON- oder CSV-Daten importieren können, um Entwicklung und Tests zu erleichtern.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Aktivitäten können aus JSON oder CSV importiert werden.
* Der Import nutzt dieselbe Normalisierung wie andere Datenquellen.
* Die Daten können für Dashboard und AI-Coach verwendet werden.

---

### FA-008 — Offizielle Garmin API anbinden

**Beschreibung:**
Die App soll langfristig die offiziellen Garmin APIs anbinden können.

**Scope:** Post-MVP / Endprodukt
**Priorität:** Future

**Relevante APIs:**

* Garmin Health API
* Garmin Activity API
* perspektivisch Garmin Training API
* perspektivisch Garmin Courses API

**Akzeptanzkriterien:**

* Garmin kann als Datenquelle verbunden werden.
* Aktivitäten können automatisch synchronisiert werden.
* Gesundheitsdaten können importiert werden.
* Historische Daten können importiert werden, sofern die API dies erlaubt.
* Die importierten Daten werden in das interne Datenmodell normalisiert.

---

### FA-009 — Inoffiziellen Garmin-Fallback prüfen

**Beschreibung:**
Die App soll konzeptionell einen privaten Import über `python-garminconnect` als Fallback ermöglichen.

**Scope:** Post-MVP
**Priorität:** Could

**Akzeptanzkriterien:**

* Die Architektur erlaubt einen separaten Garmin-Fallback-Adapter.
* Die Hauptapp bleibt unabhängig von der Library.
* Der Import erfolgt über eine definierte Zwischenschicht oder exportierte JSON-Daten.
* Die Lösung wird nicht als stabile Hauptintegration behandelt.

---

### FA-010 — Garmin Connect Export importieren

**Beschreibung:**
Die App soll Garmin-Exportdaten als Fallback importieren können.

**Scope:** Post-MVP
**Priorität:** Could

**Akzeptanzkriterien:**

* Exportierte Garmin-Daten können als Importquelle geprüft werden.
* Aktivitäten können aus Exportdaten extrahiert werden.
* Die Daten werden normalisiert gespeichert.

---

### FA-011 — Strava API anbinden

**Beschreibung:**
Die App soll langfristig Aktivitäten aus Strava importieren können.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Strava OAuth kann durchgeführt werden.
* Aktivitäten können synchronisiert werden.
* Strava-Aktivitäten werden in das interne Datenmodell normalisiert.
* Strava wird nicht als alleinige Datenbasis für den AI-Coach vorausgesetzt.

---

### FA-012 — Aggregator API anbinden

**Beschreibung:**
Die App soll langfristig einen Fitness-/Health-Data-Aggregator anbinden können.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Ein Aggregator kann als zusätzliche Datenquelle eingebunden werden.
* Die App bleibt unabhängig vom konkreten Anbieter.
* Aggregator-Daten werden wie alle anderen Datenquellen normalisiert.

---

## 6.3 Datenmodell und Normalisierung

### FA-013 — Eigenes internes Aktivitätsmodell verwenden

**Beschreibung:**
Die Anwendung soll ein eigenes internes Aktivitätsmodell verwenden und nicht direkt mit Garmin-, Strava- oder FIT-spezifischen Objekten arbeiten.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Aktivitäten werden als interne `Activity` gespeichert.
* Die ursprüngliche Datenquelle wird nur als Metainformation gespeichert.
* Dashboard und AI-Coach verwenden ausschließlich interne Datenmodelle.
* Externe Datenstrukturen tauchen nicht direkt in UI-Komponenten auf.

---

### FA-014 — Rohdaten optional speichern

**Beschreibung:**
Importierte Rohdaten sollen optional gespeichert werden können.

**Scope:** MVP
**Priorität:** Should

**Zweck:**

* Debugging
* Re-Parsing
* Nachvollziehbarkeit
* spätere Modelländerungen

**Akzeptanzkriterien:**

* Importierte Dateien oder Payloads können einer Aktivität zugeordnet werden.
* Rohdaten und normalisierte Daten sind getrennt.
* Eine Aktivität kann aus Rohdaten erneut verarbeitet werden.

---

### FA-015 — Aktivitäten deduplizieren

**Beschreibung:**
Die App soll doppelte Aktivitäten erkennen können.

**Scope:** MVP
**Priorität:** Should

**Beispiel:**
Eine Aktivität könnte später mehrfach importiert werden:

* als FIT-Datei
* über Garmin API
* über Strava
* über Garmin Export

**Akzeptanzkriterien:**

* Deduplizierung kann über externe ID, Datei-Hash, Startzeit, Dauer, Distanz und Sportart erfolgen.
* Potenzielle Duplikate werden erkannt.
* Die App verhindert offensichtliche Doppelimporte.
* Unsichere Fälle können später manuell geprüft werden.

---

### FA-016 — Aktivitätsmetriken speichern

**Beschreibung:**
Die App soll zentrale Metriken einer Aktivität speichern.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* Sportart
* Startzeit
* Dauer
* Distanz
* Höhenmeter
* Durchschnittspuls
* Maximalpuls
* Durchschnittsleistung
* Normalized Power
* Durchschnittspace
* Durchschnittsgeschwindigkeit
* Kalorien

**Akzeptanzkriterien:**

* Die wichtigsten Metriken werden einer Aktivität zugeordnet.
* Fehlende Metriken können leer bleiben.
* Die UI kann Metriken sportartspezifisch anzeigen.

---

### FA-017 — Detaildaten speichern

**Beschreibung:**
Die App soll langfristig detaillierte Aktivitätsdaten speichern können.

**Scope:** Post-MVP / Endprodukt
**Priorität:** Could

**Beispiele:**

* GPS-Track
* Herzfrequenzverlauf
* Power-Verlauf
* Pace-Verlauf
* Laps
* Splits
* Intervalle
* Schwimmlängen
* Kraftübungen

**Akzeptanzkriterien:**

* Detaildaten können einer Aktivität zugeordnet werden.
* Zeitreihen können für Charts verwendet werden.
* Laps und Splits können separat angezeigt werden.

---

## 6.4 Dashboard und Aktivitätsansicht

### FA-018 — Dashboard-Startseite anzeigen

**Beschreibung:**
Die App soll eine Dashboard-Startseite bereitstellen.

**Scope:** MVP
**Priorität:** Must

**Inhalte im MVP:**

* aktuelle Woche
* letzte Aktivitäten
* geplanter Trainingsumfang
* absolvierter Trainingsumfang
* nächstes geplantes Workout
* einfache Wochenzusammenfassung

**Akzeptanzkriterien:**

* Dashboard ist die zentrale Einstiegsseite.
* Der User sieht den aktuellen Trainingsstand auf einen Blick.
* Dashboard-Daten basieren auf dem internen Datenmodell.

---

### FA-019 — Aktivitätsübersicht anzeigen

**Beschreibung:**
Die App soll eine Liste abgeschlossener Aktivitäten anzeigen.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Aktivitäten werden chronologisch angezeigt.
* Jede Aktivität zeigt Sportart, Datum, Dauer und wichtigste Metriken.
* Aktivitäten können nach Sportart gefiltert werden.
* Eine Aktivität kann geöffnet werden.

---

### FA-020 — Aktivitätsdetailseite anzeigen

**Beschreibung:**
Die App soll eine Detailseite für einzelne Aktivitäten bereitstellen.

**Scope:** MVP
**Priorität:** Must

**MVP-Inhalte:**

* Titel
* Sportart
* Datum
* Dauer
* Distanz
* Pace oder Geschwindigkeit
* Herzfrequenz
* Leistung, falls vorhanden
* Höhenmeter
* Quelle

**Akzeptanzkriterien:**

* Eine Aktivität kann aus der Übersicht geöffnet werden.
* Die wichtigsten Metriken werden sportartspezifisch dargestellt.
* Fehlende Daten führen nicht zu UI-Fehlern.

---

### FA-021 — Charts für Trainingsdaten anzeigen

**Beschreibung:**
Die App soll Trainingsdaten visuell darstellen können.

**Scope:** Post-MVP
**Priorität:** Should

**Beispiele:**

* Wochenumfang
* Sportartenverteilung
* Belastungstrend
* Pace-Trend
* Power-Trend
* Herzfrequenztrend

**Akzeptanzkriterien:**

* Charts basieren auf normalisierten Daten.
* Charts sind verständlich beschriftet.
* Fehlende Daten werden abgefangen.

---

### FA-022 — Erweiterte Aktivitätsanalyse anzeigen

**Beschreibung:**
Die App soll langfristig detaillierte Aktivitätsanalysen bereitstellen.

**Scope:** Endprodukt
**Priorität:** Future

**Beispiele:**

* Rundenanalyse
* Intervallanalyse
* Zonenverteilung
* Bestleistungen
* persönliche Rekorde
* Vergleich mit geplanten Workouts
* Leistungsentwicklung

---

## 6.5 Trainingsplanung

### FA-023 — Wochenplan anzeigen

**Beschreibung:**
Die App soll einen Wochenplan mit geplanten Trainingseinheiten anzeigen.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Eine Woche kann mit geplanten Workouts dargestellt werden.
* Workouts erscheinen als Cards.
* Jede Card zeigt Sportart, Titel, Dauer und Intensität.
* Workouts können geöffnet werden.

---

### FA-024 — Workout Cards verwenden

**Beschreibung:**
Geplante Einheiten sollen als strukturierte Karten dargestellt werden.

**Scope:** MVP
**Priorität:** Must

**Inhalte:**

* Sportart
* Titel
* Dauer
* Intensität
* Ziel der Einheit
* Status
* Kurzbeschreibung

**Statuswerte:**

* geplant
* abgeschlossen
* verpasst
* verschoben
* angepasst

**Akzeptanzkriterien:**

* Jede geplante Einheit wird als Card dargestellt.
* Der Status ist sichtbar.
* Die Card führt zur Detailansicht.

---

### FA-025 — Workout Detail anzeigen

**Beschreibung:**
Ein geplantes Workout soll detailliert geöffnet werden können.

**Scope:** MVP
**Priorität:** Must

**Inhalte:**

* Ziel der Einheit
* Warm-up
* Hauptteil
* Cool-down
* Zielbereiche
* Hinweise
* geschätzte Belastung

**Akzeptanzkriterien:**

* Ein Workout kann geöffnet werden.
* Die Einheit ist praktisch nachvollziehbar.
* Schritte werden strukturiert dargestellt.

---

### FA-026 — Workouts manuell erstellen und bearbeiten

**Beschreibung:**
Der User soll geplante Workouts manuell erstellen und bearbeiten können.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Ein neues Workout kann angelegt werden.
* Titel, Sportart, Dauer und Beschreibung können bearbeitet werden.
* Workout-Schritte können gespeichert werden.
* Änderungen erscheinen im Wochenplan.

---

### FA-027 — Trainingsplan speichern

**Beschreibung:**
Die App soll einen Trainingsplan speichern können.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Eine Woche kann als Plan gespeichert werden.
* Workouts sind dem Plan zugeordnet.
* Der Plan kann erneut geladen werden.
* AI-generierte Pläne können gespeichert werden.

---

### FA-028 — Planerfüllung darstellen

**Beschreibung:**
Die App soll geplante und abgeschlossene Einheiten vergleichen können.

**Scope:** Post-MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Eine geplante Einheit kann mit einer abgeschlossenen Aktivität verknüpft werden.
* Die App erkennt, ob eine Einheit abgeschlossen wurde.
* Abweichungen bei Dauer, Distanz oder Intensität können angezeigt werden.

---

## 6.6 AI-Coach

### FA-029 — Athlete Context erzeugen

**Beschreibung:**
Die App soll aus gespeicherten Daten einen strukturierten Athlete Context erzeugen.

**Scope:** MVP
**Priorität:** Must

**Inhalte:**

* Ziele
* verfügbare Trainingstage
* Leistungswerte
* Trainingszonen
* letzte Aktivitäten
* Wochenumfang
* geplante Workouts
* verpasste Einheiten
* einfache Erholungsindikatoren, falls vorhanden

**Akzeptanzkriterien:**

* Der Athlete Context wird aus internen Daten erzeugt.
* Der Context ist strukturiert.
* Der AI-Coach kann den Context nutzen.
* Die Datenquelle der Aktivitäten ist für den AI-Coach nicht zentral.

---

### FA-030 — AI-generierten Wochenplan erstellen

**Beschreibung:**
Der AI-Coach soll einen Wochenplan generieren können.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Der User kann einen Wochenplan anfordern.
* Die AI erhält einen strukturierten Athlete Context.
* Die AI gibt einen strukturierten Plan zurück.
* Der Plan enthält mehrere Workouts.
* Workouts sind sportartspezifisch.
* Der Plan kann im Wochenplan angezeigt werden.

---

### FA-031 — AI-generierte Einzeleinheit erstellen

**Beschreibung:**
Der AI-Coach soll einzelne Workouts generieren können.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* Radeinheit mit Wattbereichen
* Laufeinheit mit Pace oder Puls
* Schwimmeinheit mit Technik und Intervallen
* Krafttrainingseinheit mit Übungen, Sätzen und Wiederholungen

**Akzeptanzkriterien:**

* Der User kann eine einzelne Einheit anfordern.
* Die Einheit enthält strukturierte Schritte.
* Zielbereiche sind sportartspezifisch.
* Die Einheit kann als Planned Workout gespeichert werden.

---

### FA-032 — AI-Ausgaben strukturiert speichern

**Beschreibung:**
AI-generierte Pläne und Workouts sollen nicht nur als Fließtext gespeichert werden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Die AI-Ausgabe kann in ein internes Workout- oder Planmodell überführt werden.
* Workouts können als Cards dargestellt werden.
* Workout-Schritte können einzeln angezeigt werden.
* Ungültige oder unvollständige AI-Ausgaben werden abgefangen.

---

### FA-033 — AI-Vorschläge vor Übernahme bestätigen

**Beschreibung:**
AI-generierte Inhalte sollen nicht automatisch verbindlich übernommen werden.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Der User sieht AI-Vorschläge vor dem Speichern.
* Der User kann Vorschläge übernehmen, bearbeiten oder verwerfen.
* Automatische Planänderungen erfolgen nicht ohne Bestätigung.

---

### FA-034 — Trainingswoche durch AI analysieren lassen

**Beschreibung:**
Der AI-Coach soll eine vergangene oder aktuelle Trainingswoche analysieren können.

**Scope:** Post-MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Der AI-Coach erhält Wochenumfang, Intensität und Aktivitäten.
* Die Ausgabe enthält eine verständliche Zusammenfassung.
* Die Ausgabe unterscheidet zwischen Beobachtung und Empfehlung.

---

### FA-035 — Adaptive Plananpassung

**Beschreibung:**
Der AI-Coach soll langfristig Pläne anpassen können, wenn Einheiten verpasst oder Belastungsdaten auffällig sind.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Verpasste Einheiten können erkannt werden.
* Die AI kann Anpassungen vorschlagen.
* Der User muss Anpassungen bestätigen.
* Die App vermeidet unrealistische Nachholempfehlungen.

---

## 6.7 Sportartspezifische Anforderungen

### FA-036 — Radsport-Workouts unterstützen

**Beschreibung:**
Die App soll Radeinheiten mit Watt-, Puls- und Intensitätsvorgaben unterstützen.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* Grundlage
* Tempo
* Sweet Spot
* Schwelle
* VO2max
* Over/Unders
* lange Ausfahrt
* Koppelfahrt

**Akzeptanzkriterien:**

* Radeinheiten können Wattbereiche enthalten.
* FTP kann berücksichtigt werden.
* Schritte können Dauer und Zielbereich enthalten.

---

### FA-037 — Lauf-Workouts unterstützen

**Beschreibung:**
Die App soll Laufeinheiten mit Pace-, Puls- oder Intensitätsvorgaben unterstützen.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* lockerer Dauerlauf
* langer Lauf
* Tempodauerlauf
* Schwellenintervalle
* VO2max-Intervalle
* Steigerungen
* Koppellauf

**Akzeptanzkriterien:**

* Laufeinheiten können Pacebereiche enthalten.
* Herzfrequenzzonen können berücksichtigt werden.
* Schritte können Dauer, Distanz und Zielpace enthalten.

---

### FA-038 — Schwimm-Workouts unterstützen

**Beschreibung:**
Die App soll Schwimmeinheiten mit Technikübungen, Intervallen und Pausen unterstützen.

**Scope:** MVP
**Priorität:** Must

**Beispiele:**

* Technik
* Grundlage
* kurze Intervalle
* längere Intervalle
* Pullbuoy/Paddles Sets
* CSS-orientierte Sets

**Akzeptanzkriterien:**

* Schwimmeinheiten können Distanzen enthalten.
* Pausen können definiert werden.
* Technikhinweise können gespeichert werden.
* Pace pro 100 m kann verwendet werden.

---

### FA-039 — Krafttraining unterstützen

**Beschreibung:**
Die App soll Krafttrainingseinheiten strukturieren können.

**Scope:** MVP
**Priorität:** Should

**Beispiele:**

* Unterkörper
* Oberkörper
* Core
* Stabilität
* Mobility
* Prehab

**Akzeptanzkriterien:**

* Übungen können mit Sätzen und Wiederholungen beschrieben werden.
* Hinweise zur Belastung können ergänzt werden.
* Krafttraining kann in den Wochenplan integriert werden.

---

## 6.8 Analyse und Trainingsmetriken

### FA-040 — Wochenumfang berechnen

**Beschreibung:**
Die App soll den Trainingsumfang pro Woche berechnen.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Gesamttrainingszeit pro Woche wird berechnet.
* Umfang pro Sportart wird berechnet.
* Der Wochenumfang kann im Dashboard angezeigt werden.

---

### FA-041 — Intensität grob einordnen

**Beschreibung:**
Die App soll Aktivitäten und geplante Workouts grob nach Intensität einordnen.

**Scope:** MVP
**Priorität:** Should

**Mögliche Intensitäten:**

* recovery
* easy
* tempo
* threshold
* vo2max
* race
* strength

**Akzeptanzkriterien:**

* Aktivitäten und Workouts können eine Intensität haben.
* Die Intensität kann im Dashboard und Wochenplan angezeigt werden.
* Der AI-Coach kann Intensitäten verwenden.

---

### FA-042 — Trainingsbelastung berechnen

**Beschreibung:**
Die App soll langfristig Trainingsbelastung berechnen können.

**Scope:** Post-MVP
**Priorität:** Should

**Mögliche Metriken:**

* Trainingszeit
* Intensitätsgewichtung
* TSS-ähnliche Metriken
* Wochenbelastung
* Belastungstrend

**Akzeptanzkriterien:**

* Belastung kann pro Aktivität geschätzt werden.
* Wochenbelastung kann summiert werden.
* Trends können visualisiert werden.

---

### FA-043 — Erholungsindikatoren berücksichtigen

**Beschreibung:**
Die App soll langfristig Schlaf, Ruhepuls, Stress oder ähnliche Erholungsdaten berücksichtigen.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Erholungsdaten können gespeichert werden.
* Erholung kann im Dashboard angezeigt werden.
* Der AI-Coach kann Erholung in Empfehlungen einbeziehen.

---

### FA-044 — Langfristige Leistungsentwicklung analysieren

**Beschreibung:**
Die App soll langfristig Leistungsentwicklungen analysieren können.

**Scope:** Endprodukt
**Priorität:** Future

**Beispiele:**

* FTP-Entwicklung
* Laufpace-Entwicklung
* Schwimmpace-Entwicklung
* Wochenumfang
* Intensitätsverteilung
* Bestleistungen

---

## 6.9 Export und externe Trainingsplattformen

### FA-045 — Workouts exportieren

**Beschreibung:**
Die App soll langfristig geplante Workouts exportieren können.

**Scope:** Endprodukt
**Priorität:** Future

**Mögliche Ziele:**

* Zwift
* MyWhoosh
* Garmin Connect
* strukturierte Workout-Dateien
* Kalender

**Akzeptanzkriterien:**

* Ein geplantes Workout kann in ein kompatibles Format umgewandelt werden.
* Der Export ist sportartspezifisch.
* Die Exportfunktion ist von der internen Workout-Struktur abgeleitet.

---

### FA-046 — Garmin Training API nutzen

**Beschreibung:**
Die App soll langfristig geplante Workouts zu Garmin Connect übertragen können.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Workouts können in Garmin-kompatible Struktur übersetzt werden.
* Die Übertragung erfolgt nur nach Bestätigung.
* Fehler werden nachvollziehbar angezeigt.

---

## 6.10 Einstellungen und Verwaltung

### FA-047 — Trainingszonen verwalten

**Beschreibung:**
Der User soll Trainingszonen verwalten können.

**Scope:** MVP
**Priorität:** Must

**Zonenarten:**

* Herzfrequenzzonen
* Powerzonen
* Pacezonen
* Schwimmpace-Bereiche

**Akzeptanzkriterien:**

* Zonen können gespeichert werden.
* Workouts können auf Zonen referenzieren.
* Der AI-Coach kann Zonen verwenden.

---

### FA-048 — Datenquellen verwalten

**Beschreibung:**
Der User soll sehen können, aus welcher Quelle Daten stammen.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Aktivitäten speichern ihre Quelle.
* Die Quelle kann in Detailansichten angezeigt werden.
* Datenquellen können später erweiterbar verwaltet werden.

---

### FA-049 — Importhistorie anzeigen

**Beschreibung:**
Die App soll eine Übersicht über Importvorgänge bereitstellen.

**Scope:** Post-MVP
**Priorität:** Could

**Akzeptanzkriterien:**

* Erfolgreiche und fehlgeschlagene Importe werden geloggt.
* Importfehler sind nachvollziehbar.
* Importierte Dateien können Aktivitäten zugeordnet werden.

---

# 7. Nicht-funktionale Anforderungen

## 7.1 Architektur und Wartbarkeit

### NFA-001 — Quellunabhängige Architektur

**Beschreibung:**
Die Anwendung muss so aufgebaut sein, dass Datenquellen austauschbar sind.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Datenquellen sind über Adapter angebunden.
* Das interne Datenmodell ist unabhängig von Garmin.
* Dashboard und AI-Coach nutzen nur normalisierte Daten.

---

### NFA-002 — TypeScript-first Entwicklung

**Beschreibung:**
Frontend, Backend und gemeinsame Typen sollen TypeScript verwenden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Kernmodelle sind typisiert.
* API-Datenstrukturen sind typisiert.
* AI-Ausgaben werden gegen definierte Strukturen validiert.

---

### NFA-003 — Modulare Projektstruktur

**Beschreibung:**
Das Projekt soll modular aufgebaut sein.

**Scope:** MVP
**Priorität:** Must

**Mögliche Struktur:**

```txt
apps/web
apps/api
packages/shared
docs
```

**Akzeptanzkriterien:**

* Frontend und Backend sind logisch getrennt.
* Gemeinsame Typen können ausgelagert werden.
* Dokumentation liegt im Repository.

---

### NFA-004 — Erweiterbarkeit

**Beschreibung:**
Neue Sportarten, Datenquellen und Analysefunktionen sollen später ergänzt werden können.

**Scope:** MVP / Endprodukt
**Priorität:** Must

**Akzeptanzkriterien:**

* Sportarten sind nicht hart auf eine einzelne Quelle beschränkt.
* Datenquellen können ergänzt werden.
* AI-Coach kann neue Workout-Typen unterstützen.

---

## 7.2 Datenschutz und Sicherheit

### NFA-005 — Keine sensiblen API Keys im Frontend

**Beschreibung:**
Externe API Keys und OpenAI-Zugangsdaten dürfen nicht im Frontend gespeichert werden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* AI-Requests laufen über das Backend.
* API Keys liegen in Environment Variables.
* Secrets werden nicht ins Repository committed.

---

### NFA-006 — Persönliche Trainingsdaten schützen

**Beschreibung:**
Trainings- und Gesundheitsdaten müssen vertraulich behandelt werden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Daten liegen nicht öffentlich zugänglich.
* Lokale Entwicklung nutzt sichere `.env`-Dateien.
* Spätere Deployments müssen Zugriffsschutz berücksichtigen.

---

### NFA-007 — Kein medizinischer Anspruch

**Beschreibung:**
Die App darf keine medizinischen Diagnosen oder medizinisch verbindlichen Empfehlungen geben.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* AI-Ausgaben werden als Trainingsempfehlungen gekennzeichnet.
* Gesundheitliche Auffälligkeiten werden nicht diagnostiziert.
* Bei kritischen Themen wird keine medizinische Sicherheit suggeriert.

---

## 7.3 Zuverlässigkeit und Fehlerbehandlung

### NFA-008 — Importfehler verständlich anzeigen

**Beschreibung:**
Fehler beim Datenimport müssen nachvollziehbar dargestellt werden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Ungültige Dateien verursachen keinen App-Absturz.
* Fehlermeldungen erklären das Problem verständlich.
* Fehler werden intern loggbar gemacht.

---

### NFA-009 — Fehlende Daten robust behandeln

**Beschreibung:**
Die App muss mit unvollständigen Aktivitätsdaten umgehen können.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Fehlende Powerdaten führen nicht zu Fehlern.
* Fehlende GPS-Daten führen nicht zu Fehlern.
* Fehlende Herzfrequenzdaten werden sauber angezeigt.
* UI-Komponenten zeigen leere Zustände sinnvoll an.

---

### NFA-010 — AI-Ausgaben validieren

**Beschreibung:**
AI-generierte Inhalte müssen validiert werden, bevor sie gespeichert werden.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Ungültige AI-Antworten werden abgefangen.
* Fehlende Pflichtfelder verhindern Speichern.
* Der User bekommt eine verständliche Rückmeldung.

---

## 7.4 Performance

### NFA-011 — Schnelle Dashboard-Ladezeiten

**Beschreibung:**
Das Dashboard soll auch mit wachsender Aktivitätshistorie performant bleiben.

**Scope:** MVP / Post-MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Dashboard lädt nicht alle Rohdaten ungefiltert.
* Aggregierte Werte werden effizient berechnet oder zwischengespeichert.
* Große Detaildaten werden nur bei Bedarf geladen.

---

### NFA-012 — Skalierbare Datenverarbeitung

**Beschreibung:**
Import und Analyse sollen langfristig auch mit vielen Aktivitäten funktionieren.

**Scope:** Endprodukt
**Priorität:** Future

**Akzeptanzkriterien:**

* Importprozesse können ausgelagert werden.
* Background Jobs können ergänzt werden.
* Rechenintensive Analysen blockieren nicht die UI.

---

## 7.5 Usability und Design

### NFA-013 — Übersichtliche Trainingsdarstellung

**Beschreibung:**
Trainingsdaten sollen schnell verständlich sein.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Wichtige Daten sind auf einen Blick sichtbar.
* Dashboard, Wochenplan und Aktivitäten sind klar getrennt.
* Cards und Detailansichten folgen einer einheitlichen Struktur.

---

### NFA-014 — Responsive Webapp

**Beschreibung:**
Die App soll auf Desktop und größeren mobilen Ansichten nutzbar sein.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Dashboard ist auf Desktop gut nutzbar.
* Wochenplan ist responsive.
* Aktivitätsdetails bleiben auf kleineren Screens lesbar.

---

### NFA-015 — Keine unnötige Komplexität im MVP

**Beschreibung:**
Der MVP soll bewusst fokussiert bleiben.

**Scope:** MVP
**Priorität:** Must

**Akzeptanzkriterien:**

* Future Features werden dokumentiert, aber nicht direkt umgesetzt.
* Keine Multi-User-Komplexität im MVP.
* Kein Export zu Drittplattformen im MVP.
* Keine mobile Companion App im MVP.

---

## 7.6 Testbarkeit

### NFA-016 — Importlogik testbar machen

**Beschreibung:**
Parser, Normalisierung und Deduplizierung sollen testbar sein.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Beispielinputs können getestet werden.
* Normalisierte Outputs können geprüft werden.
* Fehlerfälle können reproduziert werden.

---

### NFA-017 — AI-Kontext testbar machen

**Beschreibung:**
Der Athlete Context Builder soll testbar sein.

**Scope:** MVP
**Priorität:** Should

**Akzeptanzkriterien:**

* Aus festen Trainingsdaten entsteht ein erwartbarer Context.
* Fehlende Daten werden korrekt behandelt.
* Der Context enthält keine unnötigen Rohdaten.

---

# 8. User Stories

## 8.1 MVP User Stories

### US-001 — Aktivitäten importieren

Als User möchte ich eine Aktivitätsdatei importieren, damit ich meine echten Trainingsdaten in der App verwenden kann.

**Akzeptanzkriterien:**

* Ich kann eine Datei auswählen.
* Die App erkennt gültige Aktivitätsdaten.
* Die Aktivität erscheint in meiner Aktivitätsliste.

---

### US-002 — Trainingswoche überblicken

Als User möchte ich auf dem Dashboard meine aktuelle Trainingswoche sehen, damit ich schnell verstehe, was geplant und was bereits absolviert ist.

**Akzeptanzkriterien:**

* Ich sehe geplante Workouts.
* Ich sehe absolvierte Aktivitäten.
* Ich sehe den Wochenumfang.

---

### US-003 — Aktivität im Detail anschauen

Als User möchte ich eine Aktivität öffnen können, damit ich die wichtigsten Trainingsmetriken sehen kann.

**Akzeptanzkriterien:**

* Ich sehe Dauer, Distanz, Pace oder Geschwindigkeit.
* Ich sehe Herzfrequenz und Leistung, falls vorhanden.
* Ich sehe die Datenquelle.

---

### US-004 — Wochenplan erzeugen lassen

Als User möchte ich mir von der AI einen Wochenplan erstellen lassen, damit ich eine strukturierte Trainingswoche bekomme.

**Akzeptanzkriterien:**

* Die AI berücksichtigt meine Ziele und Leistungswerte.
* Der Plan enthält mehrere Workouts.
* Die Workouts sind sportartspezifisch.
* Ich kann den Plan speichern oder verwerfen.

---

### US-005 — Einzelnes Workout erzeugen lassen

Als User möchte ich mir eine konkrete Einheit generieren lassen, damit ich für einen bestimmten Tag ein passendes Training bekomme.

**Akzeptanzkriterien:**

* Ich kann Sportart und Ziel der Einheit angeben.
* Die AI erzeugt strukturierte Schritte.
* Die Einheit kann gespeichert werden.

---

### US-006 — Trainingszonen speichern

Als User möchte ich meine Trainingszonen hinterlegen, damit die App und der AI-Coach passende Intensitätsbereiche verwenden können.

**Akzeptanzkriterien:**

* Ich kann Power-, Pace- und Pulszonen speichern.
* Workouts können diese Zonen verwenden.
* Der AI-Coach berücksichtigt diese Werte.

---

## 8.2 Post-MVP User Stories

### US-007 — Garmin automatisch synchronisieren

Als User möchte ich Garmin automatisch verbinden, damit neue Aktivitäten ohne manuellen Upload in der App erscheinen.

---

### US-008 — Woche analysieren lassen

Als User möchte ich meine Trainingswoche analysieren lassen, damit ich Belastung, Fortschritt und Probleme besser verstehe.

---

### US-009 — Verpasste Einheit einordnen

Als User möchte ich eine verpasste Einheit vom AI-Coach einordnen lassen, damit ich weiß, ob ich sie nachholen, ersetzen oder streichen sollte.

---

### US-010 — Planerfüllung prüfen

Als User möchte ich sehen, ob ich geplante Einheiten erfüllt habe, damit ich Plan und Realität vergleichen kann.

---

## 8.3 Endprodukt User Stories

### US-011 — Workouts exportieren

Als User möchte ich geplante Workouts exportieren, damit ich sie in Garmin, Zwift oder MyWhoosh nutzen kann.

---

### US-012 — Adaptive Trainingsplanung nutzen

Als User möchte ich, dass mein Trainingsplan dynamisch angepasst wird, damit er auf Belastung, Erholung und verpasste Einheiten reagiert.

---

### US-013 — Langfristige Entwicklung analysieren

Als User möchte ich meine Leistungsentwicklung über Monate verfolgen, damit ich Fortschritte und Schwächen erkenne.

---

# 9. MVP-Abgrenzung

## 9.1 Muss im MVP enthalten sein

Der MVP muss enthalten:

* Single-User-Nutzung
* internes Aktivitätsmodell
* Mock-Daten
* manueller Import oder strukturierter Beispieldatenimport
* Aktivitätsübersicht
* Aktivitätsdetailansicht
* Dashboard
* Wochenplan
* Workout Cards
* Workout Detail
* Trainingszonen
* Athlete Context
* AI-generierter Wochenplan
* AI-generierte Einzeleinheit
* Speicherung von Trainingsplänen

---

## 9.2 Sollte im MVP enthalten sein

Der MVP sollte enthalten:

* manuelle Workout-Erstellung
* Deduplizierung
* Rohdatenspeicherung
* JSON-/CSV-Import für Tests
* einfache Charts
* einfache Intensitätsklassifikation
* User-Bestätigung bei AI-Vorschlägen

---

## 9.3 Nicht Teil des MVP

Nicht Teil des MVP:

* Multi-User-System
* öffentliche Registrierung
* Bezahlmodell
* Coach-Modus
* Garmin Live-Sync
* Strava Live-Sync
* Zwift-/MyWhoosh-Export
* Garmin Workout Push
* mobile Companion App
* Apple Health
* Google Health Connect
* vollständige medizinische Erholungsanalyse
* Social Features

---

# 10. Endprodukt-Abgrenzung

Das langfristige Endprodukt kann enthalten:

* Garmin API Synchronisierung
* Strava Import
* Aggregator Integration
* automatische Gesundheitsdaten
* Schlaf- und Erholungsanalyse
* adaptive AI-Trainingsplanung
* Export strukturierter Workouts
* Wettkampfplanung
* Saisonplanung
* Planerfüllungsanalyse
* langfristige Performance-Analysen
* mobile Ansicht oder PWA
* eventuell Multi-User- oder Coach-Modus

Diese Funktionen sind für die langfristige Vision relevant, aber nicht für den ersten MVP erforderlich.

---

# 11. Offene Fragen

## 11.1 Technische Fragen

* Wird das Backend mit Fastify oder NestJS umgesetzt?
* Wie wird der erste FIT-Parser eingebunden?
* Wird der MVP zuerst vollständig mit Mock-Daten gebaut?
* Welche Datenbankstruktur ist für Activities und Workout Steps ideal?
* Wie werden AI-Ausgaben validiert?
* Wie wird der Athlete Context versioniert?

## 11.2 Produktfragen

* Welche Dashboard-Kacheln sind im MVP wirklich notwendig?
* Soll der AI-Coach eher als Chat oder als Generator für konkrete Aktionen funktionieren?
* Soll die App stärker wie TrainingPeaks oder stärker wie ein persönliches Analyse-Dashboard wirken?
* Welche Sportart ist für den ersten vollständigen Workout-Flow am wichtigsten?
* Wie detailliert müssen Schwimm-Workouts im MVP sein?

## 11.3 Datenquellen-Fragen

* Wird offizieller Garmin API-Zugriff gewährt?
* Können historische Garmin-Daten importiert werden?
* Welches manuelle Dateiformat wird zuerst unterstützt?
* Ist `python-garminconnect` als privater Fallback akzeptabel?
* Reicht für den Start ein JSON-Import mit realen exportierten Daten?

---

# 12. Risiken und Gegenmaßnahmen

## 12.1 Risiko: Garmin API-Zugriff wird nicht gewährt

**Auswirkung:**
Automatischer Garmin Sync kann nicht umgesetzt werden.

**Gegenmaßnahme:**
MVP basiert auf manuellen Uploads, Mock-Daten und internem Datenmodell.

---

## 12.2 Risiko: MVP wird zu groß

**Auswirkung:**
Projekt verliert Fokus und wird nicht fertig.

**Gegenmaßnahme:**
MVP auf Import, Dashboard, Wochenplan und AI-Coach v1 begrenzen.

---

## 12.3 Risiko: AI-Ausgaben sind unbrauchbar

**Auswirkung:**
Trainingspläne sind nicht sinnvoll oder nicht strukturiert nutzbar.

**Gegenmaßnahme:**
Athlete Context, klare Schemas, Validierung und User-Bestätigung verwenden.

---

## 12.4 Risiko: Datenmodell wird zu Garmin-spezifisch

**Auswirkung:**
Spätere Datenquellen erfordern große Umbauten.

**Gegenmaßnahme:**
Canonical Training Data Model als stabile Zwischenschicht verwenden.

---

## 12.5 Risiko: Importdaten sind unvollständig

**Auswirkung:**
Dashboard oder AI-Coach können nicht alle Metriken verwenden.

**Gegenmaßnahme:**
Fehlende Daten zulassen, optionale Felder verwenden und robuste UI-Zustände bauen.

---

# 13. Definition of Done für den MVP

Der MVP gilt als abgeschlossen, wenn folgende Punkte erfüllt sind:

* Die App besitzt eine lauffähige Frontend- und Backend-Grundstruktur.
* Aktivitäten können aus Mock-Daten oder manuellem Import geladen werden.
* Aktivitäten werden in ein internes Datenmodell normalisiert.
* Aktivitäten können in einer Übersicht angezeigt werden.
* Einzelne Aktivitäten können im Detail geöffnet werden.
* Ein Dashboard zeigt aktuelle Trainingsdaten.
* Ein Wochenplan zeigt geplante Workouts als Cards.
* Workouts können im Detail geöffnet werden.
* Trainingszonen können gespeichert oder konfiguriert werden.
* Ein Athlete Context kann aus gespeicherten Daten erzeugt werden.
* Der AI-Coach kann einen Wochenplan generieren.
* Der AI-Coach kann eine einzelne Einheit generieren.
* AI-generierte Workouts können strukturiert dargestellt werden.
* Garmin API-Zugriff ist nicht notwendig, damit der MVP funktioniert.
* Future Features sind dokumentiert, aber nicht blockierend.

---

# 14. Zusammenfassung

Die Anforderungen definieren die Fitness Coach Dashboard Webapp als quellunabhängige Trainingsdatenplattform mit Dashboard, Trainingsplanung und AI-Coach.

Der MVP konzentriert sich auf:

* internes Datenmodell
* manuellen oder simulierten Datenimport
* Aktivitätsübersicht
* Dashboard
* Wochenplan
* Workout Cards
* Athlete Context
* AI-generierte Trainingspläne und Einheiten

Das langfristige Endprodukt erweitert diese Grundlage um automatische Integrationen, tiefere Analysen, adaptive Trainingsplanung und mögliche Exportfunktionen.

Die wichtigste Anforderung bleibt:

> Die App darf nicht von einer einzelnen Datenquelle abhängig sein. Datenquellen sind austauschbar, das interne Trainingsmodell ist der stabile Kern.