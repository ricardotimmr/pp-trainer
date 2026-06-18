# Feature Scope

Stand: 14.06.2026

## 1. Ziel dieser Datei

Diese Datei definiert den Feature-Scope von `pp-trainer`.

Sie legt fest, welche Funktionen Teil des MVP sind, welche Funktionen nach dem MVP sinnvoll ergänzt werden können und welche Funktionen bewusst erst langfristig betrachtet werden.

Der Feature Scope dient als praktische Abgrenzung zwischen:

* MVP
* Post-MVP
* Endprodukt
* Out of Scope

Die Datei ergänzt die Requirements aus `docs/01-requirements.md`, ist aber weniger detailliert. Sie beantwortet vor allem die Frage:

> Was bauen wir wann?

---

## 2. Grundsatz

`pp-trainer` soll nicht als überladenes All-in-One-Produkt starten.

Der MVP soll nur beweisen, dass die zentrale Produktidee funktioniert:

> Trainingsdaten können importiert, normalisiert, dargestellt und für AI-generierte Trainingsplanung genutzt werden.

Alles, was dafür nicht zwingend notwendig ist, wird nicht in den ersten MVP aufgenommen.

Der wichtigste Grundsatz für den Scope lautet:

> Build the stable core first. Add integrations and automation later.

---

## 3. Scope-Kategorien

Für die Einordnung werden vier Scope-Kategorien verwendet.

| Kategorie    | Bedeutung                                        |
| ------------ | ------------------------------------------------ |
| MVP          | Muss im ersten nutzbaren Prototyp enthalten sein |
| Post-MVP     | Sinnvolle Erweiterung direkt nach dem MVP        |
| Endprodukt   | Langfristige Zielversion der App                 |
| Out of Scope | Bewusst nicht Teil der aktuellen Planung         |

---

## 4. MVP-Zielbild

Der MVP von `pp-trainer` ist eine persönliche Single-User-Webapp mit:

* internem Trainingsdatenmodell
* Mock-Daten oder manuellem Import
* Aktivitätsübersicht
* Aktivitätsdetailseite
* Dashboard
* Wochenplan
* Workout Cards
* AI-generiertem Wochenplan
* AI-generierten Einzeleinheiten
* Trainingszonen
* Athlete Context

Der MVP muss nicht perfekt sein. Er muss aber die Kernlogik der App sichtbar und nutzbar machen.

---

## 5. MVP Features

## 5.1 Single-User-Grundlage

### Scope

MVP

### Beschreibung

Die App wird zunächst für einen einzigen User gebaut.

Es gibt keine Registrierung, keine Rollen, kein Multi-User-System und keine öffentliche Accountverwaltung.

### Enthalten

* ein zentraler Athlete Profile Datensatz
* persönliche Trainingswerte
* Ziele und Verfügbarkeiten
* Trainingszonen
* Daten werden einem User zugeordnet

### Nicht enthalten

* Registrierung
* Login für mehrere User
* Rollenmodell
* Coach-Ansicht
* öffentliche Profile

### Begründung

Der Fokus liegt auf dem persönlichen Use Case. Multi-User-Funktionalität würde den MVP unnötig verkomplizieren.

---

## 5.2 Interne Trainingsdatenstruktur

### Scope

MVP

### Beschreibung

Die App arbeitet mit einem eigenen internen Datenmodell für Aktivitäten, Workouts, Trainingspläne und Trainingszonen.

Dieses Modell ist unabhängig von Garmin, Strava oder anderen Datenquellen.

### Enthalten

* Activity
* Planned Workout
* Workout Step
* Training Plan
* Training Zone
* Athlete Profile
* Data Source Metadata

### Nicht enthalten

* vollständiges langfristiges Performance-Modell
* komplexe historische Analysemodelle
* medizinische Erholungsmodelle

### Begründung

Das interne Datenmodell ist der stabile Kern der Anwendung. Ohne diese Schicht wäre die App zu stark von externen Datenquellen abhängig.

---

## 5.3 Mock-Daten und Beispieldaten

### Scope

MVP

### Beschreibung

Die App soll mit realistischen Mock-Daten oder vorbereiteten Beispieldaten funktionieren.

### Enthalten

* Beispielaktivitäten für Radfahren, Laufen und Schwimmen
* Beispiel-Trainingswoche
* Beispiel-Workout Cards
* Beispiel-Athlete-Profile
* Beispiel-Trainingszonen

### Nicht enthalten

* produktiver Daten-Sync
* vollständige historische Trainingsdaten
* automatische Aktualisierung

### Begründung

Mock-Daten ermöglichen UI, Datenmodell und AI-Coach zu entwickeln, ohne auf Garmin-Zugriff warten zu müssen.

---

## 5.4 Manueller Aktivitätsimport

### Scope

MVP

### Beschreibung

Der MVP soll eine Form von manuellem Aktivitätsimport unterstützen.

Der bevorzugte Zielweg ist der Upload echter Aktivitätsdateien wie FIT, GPX oder TCX. Falls das technisch zu aufwendig für den ersten Schritt ist, kann zunächst ein strukturierter JSON-Import als Zwischenschritt verwendet werden.

### Enthalten

* Datei-Upload-UI
* Importvalidierung
* Parsing oder Mapping
* Normalisierung in das interne Activity-Modell
* Anzeige importierter Aktivitäten

### MVP-Minimum

* ein funktionierender Importweg für Aktivitätsdaten

### Nicht enthalten

* automatischer Garmin Sync
* automatischer Strava Sync
* Gesundheitsdatenimport
* Massenimport großer Historien

### Begründung

Der manuelle Import ist der wichtigste MVP-Fallback, weil er echte Trainingsdaten ermöglicht, ohne von offizieller API-Freigabe abhängig zu sein.

---

## 5.5 Aktivitätsübersicht

### Scope

MVP

### Beschreibung

Die App zeigt eine Liste abgeschlossener Aktivitäten.

### Enthalten

* chronologische Aktivitätsliste
* Sportart
* Datum
* Dauer
* Distanz
* Pace oder Geschwindigkeit
* Herzfrequenz, falls vorhanden
* Leistung, falls vorhanden
* Quelle der Aktivität

### Nicht enthalten

* komplexe Filter
* erweiterte Suche
* Segmentanalyse
* persönliche Rekorde
* erweiterte Vergleichsfunktionen

### Begründung

Eine Aktivitätsübersicht ist notwendig, um importierte Daten sichtbar und überprüfbar zu machen.

---

## 5.6 Aktivitätsdetailseite

### Scope

MVP

### Beschreibung

Einzelne Aktivitäten können geöffnet und detailliert analysiert werden. Da `python-garminconnect` reiche Zeitreihendaten, Splits und Gesundheitsmetriken liefert, wird diese Seite als vollständige Analyseansicht gebaut.

### Enthalten

* Basisdaten: Sportart, Datum, Dauer, Distanz, Quelle
* Zeitreihencharts: Herzfrequenz, Kadenz, Pace/Geschwindigkeit, Elevation, Leistung
* Splits und Laps: km-Splits mit Pace, HR und Kadenz pro Abschnitt
* Zonenverteilung: Time in HR Zones als visuelle Darstellung
* Erweiterte Metriken: Max HR, Kalorien, Normalized Power, Training Stress Score falls verfügbar
* Radfahren: NP, IF, Power Zones Distribution
* Laufen: Pace-Splits, Kadenz, Ground Contact Time falls verfügbar
* Schwimmen: Bahnen, SWOLF, Strokecount, Stroke Type
* robuste Anzeige bei fehlenden Metriken

### Nicht enthalten

* interaktive GPS-Kartenansicht
* Segmentvergleich mit anderen Aktivitäten
* Bestleistungen im historischen Vergleich

### Begründung

Mit `python-garminconnect` als primärem Sync-Weg sind Zeitreihendaten, Splits und Zonenverteilung verfügbar. Diese Seite ist eine der wichtigsten Darstellungsflächen der App und soll das volle Potenzial der verfügbaren Daten zeigen.

---

## 5.7 Dashboard

### Scope

MVP

### Beschreibung

Das Dashboard ist die zentrale Einstiegsseite der App.

### Enthalten

* aktuelle Trainingswoche
* letzte Aktivitäten
* geplanter Wochenumfang
* absolvierter Wochenumfang
* Umfang pro Sportart
* nächstes geplantes Workout
* einfache AI-Hinweise oder Empfehlungen

### Nicht enthalten

* komplexe Performance-Analyse
* langfristige Trendanalyse
* vollständig dynamische Widget-Konfiguration
* Race Readiness Score
* tiefgehende Erholungsanalyse

### Begründung

Das Dashboard zeigt den praktischen Nutzen der App und verbindet Aktivitätsdaten, Planung und AI-Coach.

---

## 5.8 Wochenplan

### Scope

MVP

### Beschreibung

Die App zeigt eine Trainingswoche mit geplanten Einheiten.

### Enthalten

* Wochenansicht
* geplante Workouts
* Workout Cards
* Status der Einheiten
* Öffnen einzelner Workouts
* Speicherung eines Plans

### Statuswerte

* geplant
* abgeschlossen
* verpasst
* verschoben
* angepasst

### Nicht enthalten

* Drag and Drop
* Kalender-Sync
* mehrmonatige Periodisierung
* automatische Planverschiebung
* Coach-Freigabeprozess

### Begründung

Der Wochenplan ist die zentrale Darstellungsform für AI-generierte Trainingsplanung.

---

## 5.9 Workout Cards

### Scope

MVP

### Beschreibung

Geplante Trainingseinheiten werden als Cards dargestellt.

### Enthalten

* Sportart
* Titel
* Dauer
* Intensität
* Ziel der Einheit
* Kurzbeschreibung
* Status
* Link zur Detailansicht

### Nicht enthalten

* komplexe Card-Konfiguration
* Drag and Drop
* Export-Buttons
* Vergleich mit Zielerfüllung

### Begründung

Workout Cards machen den Trainingsplan schnell erfassbar und bilden die Grundlage für spätere Export- und Bearbeitungsfunktionen.

---

## 5.10 Workout Detail

### Scope

MVP

### Beschreibung

Geplante Workouts können im Detail geöffnet werden.

### Enthalten

* Ziel der Einheit
* Warm-up
* Hauptteil
* Cool-down
* strukturierte Schritte
* Zielbereiche
* Hinweise

### Sportartspezifische Inhalte

* Radfahren mit Watt oder Puls
* Laufen mit Pace oder Puls
* Schwimmen mit Distanz, Technik und Pausen
* Krafttraining optional mit Übungen, Sätzen und Wiederholungen

### Nicht enthalten

* interaktive Workout-Ausführung
* Live-Tracking
* Export zu Garmin
* Export zu Zwift oder MyWhoosh

### Begründung

Der AI-Coach muss Einheiten erzeugen, die praktisch nachvollziehbar und in der App sinnvoll darstellbar sind.

---

## 5.11 Trainingszonen

### Scope

MVP

### Beschreibung

Der User kann Trainingszonen und Leistungswerte hinterlegen.

### Enthalten

* FTP
* Powerzonen
* Herzfrequenzzonen
* Laufpace-Bereiche
* Schwimmpace-Bereiche
* optionale Zielwerte

### Nicht enthalten

* automatische Zonenerkennung
* automatische FTP-Erkennung
* automatische Laktatschwellenanalyse
* komplexe Zonenhistorie

### Begründung

Der AI-Coach braucht persönliche Leistungswerte, um sinnvolle Einheiten mit Intensitätsvorgaben zu erstellen.

---

## 5.12 Athlete Context

### Scope

MVP

### Beschreibung

Das Backend erzeugt aus gespeicherten Daten einen strukturierten Athlete Context.

### Enthalten

* Athlete Profile
* Ziele
* verfügbare Trainingstage
* aktuelle Leistungswerte
* Trainingszonen
* letzte Aktivitäten
* aktueller Wochenumfang
* geplante Einheiten
* einfache Belastungsinformationen

### Nicht enthalten

* vollständige Langzeitanalyse
* tiefgehende Erholungsbewertung
* medizinische Interpretation
* komplexe Periodisierungslogik

### Begründung

Der Athlete Context ist die Grundlage für alle AI-Coach-Funktionen.

---

## 5.13 AI-generierter Wochenplan

### Scope

MVP

### Beschreibung

Der AI-Coach kann einen Wochenplan generieren.

### Enthalten

* Anfrage über das Frontend
* Erstellung eines Athlete Context im Backend
* AI-generierter Wochenplan
* strukturierte Ausgabe
* Darstellung als Workout Cards
* Speichern oder Verwerfen des Plans

### Nicht enthalten

* automatische Planänderung ohne User-Bestätigung
* mehrmonatige Saisonplanung
* Race-spezifische Endplanung
* automatisches Tapering
* automatische Anpassung bei Krankheit oder Verletzung

### Begründung

Der Wochenplan ist der zentrale Beweis für den Nutzen des AI-Coaches.

---

## 5.14 Performance Stats Page

### Scope

MVP

### Beschreibung

Eine eigene Seite zeigt sportartspezifische Leistungskennzahlen aus importierten Garmin-Daten.

Route: `/performance`

### Enthalten

* VO2 max (Garmin-Schätzung)
* Threshold HR pro Sportart
* Threshold Pace für Laufen und Schwimmen
* FTP für Radfahren
* Trainingszonen visuell dargestellt (nicht nur als Tabelle in Settings)
* Race Predictors: Laufen 5K / 10K / Halbmarathon / Marathon
* Race Predictors: Radfahren 40km TT
* letzte gemessene Werte mit Datum und Datenquelle
* Darstellung gegliedert nach Sportart: Laufen / Roadbike / Schwimmen

### Nicht enthalten

* historische Entwicklung der Leistungswerte über Zeit (Post-MVP)
* automatische Zonenkalibrierung
* medizinische Interpretation

### Begründung

`python-garminconnect` liefert VO2 max, Laktatschwellen-Schätzungen und Race Predictors direkt. Diese Seite macht die Leistungsdaten sichtbar und schafft eine wichtige Grundlage für den Athlete Context und den AI-Coach.

---

## 5.15 AI-generierte Einzeleinheit

### Scope

MVP

### Beschreibung

Der AI-Coach kann einzelne sportartspezifische Workouts erzeugen.

### Enthalten

* Rad-Workout
* Lauf-Workout
* Schwimm-Workout
* optional Krafttraining
* strukturierte Workout Steps
* Zielbereiche
* Beschreibung und Hinweise
* Speichern als Planned Workout

### Nicht enthalten

* direkter Export
* automatische Synchronisierung
* Live-Ausführung
* adaptive Änderung während der Einheit

### Begründung

Einzelne Workouts sind leichter zu validieren als vollständige Trainingspläne und eignen sich gut für den MVP.

---

# 6. Post-MVP Features

## 6.1 Erweiterte Charts

### Scope

Post-MVP

### Beschreibung

Nach dem MVP sollen Trainingsdaten stärker visualisiert werden.

### Mögliche Inhalte

* Wochenumfang über Zeit
* Sportartenverteilung
* Pace-Trends
* Power-Trends
* Herzfrequenz-Trends
* Intensitätsverteilung

### Grund für Post-MVP

Charts sind wichtig, aber nicht zwingend notwendig, um die Kernlogik des MVP zu validieren.

---

## 6.2 Planerfüllung

### Scope

Post-MVP

### Beschreibung

Geplante Workouts sollen mit absolvierten Aktivitäten verknüpft werden können.

### Mögliche Inhalte

* geplante vs. absolvierte Dauer
* geplante vs. absolvierte Distanz
* geplante vs. absolvierte Intensität
* Status automatisch oder manuell aktualisieren

### Grund für Post-MVP

Die Funktion ist sehr nützlich, setzt aber stabile Activity- und Workout-Modelle voraus.

---

## 6.3 Trainingswochenanalyse durch AI

### Scope

Post-MVP

### Beschreibung

Der AI-Coach kann eine abgeschlossene Trainingswoche analysieren.

### Mögliche Inhalte

* Wochenzusammenfassung
* Belastungseinordnung
* verpasste Einheiten
* mögliche Anpassungen
* Hinweis auf zu hohe oder zu niedrige Belastung

### Grund für Post-MVP

Die Wochenanalyse baut auf stabilen Aktivitätsdaten und Planerfüllung auf.

---

## 6.4 Importhistorie

### Scope

Post-MVP

### Beschreibung

Die App zeigt vergangene Importvorgänge an.

### Mögliche Inhalte

* importierte Dateien
* erfolgreiche Importe
* fehlgeschlagene Importe
* erkannte Duplikate
* Fehlerdetails

### Grund für Post-MVP

Hilfreich für Nachvollziehbarkeit, aber nicht zwingend für den ersten MVP.

---

## 6.5 Garmin Connect Export Import

### Scope

Post-MVP

### Beschreibung

Garmin-Exportdaten können als zusätzlicher Importweg verarbeitet werden.

### Grund für Post-MVP

Relevant für historische Daten, aber für den ersten MVP reicht ein einfacherer Importweg.

---

## 6.6 python-garminconnect Integration

### Scope

MVP

### Beschreibung

`python-garminconnect` wird als primärer privater Sync-Weg für echte Garmin-Daten genutzt. Liefert Zeitreihendaten, Splits, Körperdaten und sportartspezifische Leistungsmetriken.

### Grund für MVP

Bestätigt verfügbar und funktionsfähig für Single-User-Betrieb. Schaltet die vollständige Aktivitätsdetailseite und die Performance-Stats-Page frei. Kein Warten auf API-Freigabe erforderlich.

---

# 7. Endprodukt Features

## 7.1 Offizielle Garmin API Integration

### Scope

Endprodukt

### Beschreibung

Langfristig soll Garmin als offizielle Datenquelle angebunden werden.

### Mögliche Inhalte

* OAuth-Verbindung
* automatische Aktivitätssynchronisierung
* Gesundheitsdaten
* historische Daten, falls verfügbar
* periodische Sync-Jobs

### Grund für Endprodukt

Garmin ist langfristig sehr wertvoll, aber kein MVP-Blocker.

---

## 7.2 Strava API Integration

### Scope

Endprodukt

### Beschreibung

Strava kann als alternative Aktivitätsquelle integriert werden.

### Mögliche Inhalte

* OAuth
* Aktivitäten importieren
* Aktivitätsdetails normalisieren
* Strava als zusätzliche Quelle anzeigen

### Grund für Endprodukt

Nützlich als zusätzliche Quelle, aber nicht zentral für den ersten MVP.

---

## 7.3 Aggregator API Integration

### Scope

Endprodukt

### Beschreibung

Ein Aggregator kann später mehrere Fitnessdatenquellen über eine Schnittstelle bereitstellen.

### Mögliche Anbieter

* Terra
* Validic
* ähnliche Health- und Fitness-Aggregatoren

### Grund für Endprodukt

Für ein persönliches MVP wahrscheinlich zu groß, langfristig aber interessant.

---

## 7.4 Adaptive Trainingsplanung

### Scope

Endprodukt

### Beschreibung

Der AI-Coach kann Pläne dynamisch anpassen.

### Mögliche Inhalte

* verpasste Einheiten einordnen
* Belastung berücksichtigen
* Erholung berücksichtigen
* Einheiten verschieben
* Intensitäten reduzieren
* neue Vorschläge machen

### Grund für Endprodukt

Die Funktion ist komplex und benötigt stabile Daten, Planerfüllung und gute AI-Regeln.

---

## 7.5 Workout Export

### Scope

Endprodukt

### Beschreibung

Geplante Workouts können exportiert werden.

### Mögliche Ziele

* Garmin Connect
* Zwift
* MyWhoosh
* strukturierte Workout-Dateien
* Kalender

### Grund für Endprodukt

Export ist wertvoll, aber erst sinnvoll, wenn die interne Workout-Struktur stabil ist.

---

## 7.6 Erweiterte Aktivitätsanalyse

### Scope

Endprodukt

### Beschreibung

Aktivitäten können detailliert analysiert werden.

### Mögliche Inhalte

* Intervallanalyse
* Rundenanalyse
* Zonenverteilung
* GPS-Karte
* Zeitreihencharts
* Bestleistungen
* persönliche Rekorde

### Grund für Endprodukt

Diese Funktionen sind datenintensiv und nicht notwendig für den MVP.

---

## 7.7 Langfristige Performance-Analyse

### Scope

Endprodukt

### Beschreibung

Die App kann langfristige Leistungsentwicklungen analysieren.

### Mögliche Inhalte

* FTP-Entwicklung
* Laufpace-Entwicklung
* Schwimmpace-Entwicklung
* Trainingsumfang
* Belastungstrends
* Intensitätsverteilung
* Wettkampfform

### Grund für Endprodukt

Langfristige Analysen benötigen eine größere Datenhistorie und stabile Berechnungslogik.

---

## 7.8 Erholungsanalyse

### Scope

Endprodukt

### Beschreibung

Gesundheitsdaten können zur Einordnung von Erholung und Belastung genutzt werden.

### Mögliche Inhalte

* Schlaf
* Ruhepuls
* Stress
* Body-Battery-artige Metriken
* HRV, falls verfügbar
* Belastung vs. Erholung

### Grund für Endprodukt

Diese Funktion hängt stark von verfügbaren Datenquellen ab und darf keine medizinischen Aussagen suggerieren.

---

## 7.9 Multi-User und Coach-Modus

### Scope

Endprodukt

### Beschreibung

Die App könnte später mehrere User oder eine Coach-Athlet-Struktur unterstützen.

### Mögliche Inhalte

* Registrierung
* Login
* Rollen
* Coach-Ansicht
* Athletenverwaltung
* geteilte Trainingspläne

### Grund für Endprodukt

Nicht relevant für den persönlichen MVP und würde die Architektur deutlich komplexer machen.

---

# 8. Out of Scope

Folgende Funktionen sind aktuell bewusst nicht Teil der Planung.

## 8.1 Medizinische Empfehlungen

Die App soll keine Diagnosen stellen und keine medizinisch verbindlichen Empfehlungen geben.

Nicht enthalten:

* Verletzungsdiagnosen
* Krankheitsdiagnosen
* medizinische Trainingsfreigaben
* klinische Interpretation von Gesundheitsdaten

## 8.2 Social Features

Nicht enthalten:

* öffentliche Profile
* Kommentare
* Likes
* Gruppen
* Challenges
* Social Feed

## 8.3 Bezahlmodell

Nicht enthalten:

* Abos
* Payment
* Lizenzmodell
* Paywall
* Rechnungsstellung

## 8.4 Native Mobile App

Nicht enthalten im aktuellen Scope:

* iOS-App
* Android-App
* Apple Health Integration
* Google Health Connect Integration
* Push Notifications

Eine PWA oder responsive Webapp kann später geprüft werden.

## 8.5 Vollständiger Ersatz für Garmin Connect oder TrainingPeaks

`pp-trainer` soll nicht sofort alle Funktionen bestehender Plattformen ersetzen.

Nicht enthalten im MVP:

* vollständige Geräteverwaltung
* kompletter Kalenderexport
* komplexe Performance-Management-Charts
* Team- oder Coach-Ökosystem
* öffentliche Trainingsplattform

---

# 9. Feature-Matrix

## 9.1 MVP

| Feature                     | Enthalten im MVP |
| --------------------------- | ---------------- |
| Single-User-Betrieb         | Ja               |
| Athlete Profile             | Ja               |
| Trainingszonen              | Ja               |
| Mock-Daten                  | Ja               |
| Manueller Aktivitätsimport  | Ja               |
| Internes Aktivitätsmodell   | Ja               |
| Aktivitätsübersicht         | Ja               |
| Aktivitätsdetailseite       | Ja               |
| Dashboard                   | Ja               |
| Wochenplan                  | Ja               |
| Workout Cards               | Ja               |
| Workout Detail              | Ja               |
| AI-generierter Wochenplan   | Ja               |
| AI-generierte Einzeleinheit | Ja               |
| Athlete Context             | Ja               |
| Plan speichern              | Ja               |
| python-garminconnect Sync   | Ja               |
| Performance Stats Page      | Ja               |

## 9.2 Post-MVP

| Feature                       | Scope    |
| ----------------------------- | -------- |
| Erweiterte Charts             | Post-MVP |
| Planerfüllung                 | Post-MVP |
| AI-Wochenanalyse              | Post-MVP |
| Importhistorie                | Post-MVP |
| Garmin Export Import          | Post-MVP |
| python-garminconnect Fallback | MVP (hochgestuft) |
| Detailliertere Deduplizierung | Post-MVP |

## 9.3 Endprodukt

| Feature                          | Scope      |
| -------------------------------- | ---------- |
| Offizielle Garmin API            | Endprodukt |
| Strava API                       | Endprodukt |
| Aggregator API                   | Endprodukt |
| Adaptive Trainingsplanung        | Endprodukt |
| Workout Export                   | Endprodukt |
| Garmin Training API              | Endprodukt |
| Erweiterte Aktivitätsanalyse     | Endprodukt |
| Langfristige Performance-Analyse | Endprodukt |
| Erholungsanalyse                 | Endprodukt |
| Multi-User-System                | Endprodukt |
| Coach-Modus                      | Endprodukt |

## 9.4 Out of Scope

| Feature                                        | Status       |
| ---------------------------------------------- | ------------ |
| Medizinische Diagnosen                         | Out of Scope |
| Social Feed                                    | Out of Scope |
| Bezahlmodell                                   | Out of Scope |
| Native Mobile App im MVP                       | Out of Scope |
| Apple Health im MVP                            | Out of Scope |
| Google Health Connect im MVP                   | Out of Scope |
| Vollautomatische Planänderung ohne Bestätigung | Out of Scope |

---

# 10. MVP-Cutline

Die MVP-Cutline beschreibt, wo der erste Build bewusst endet.

Der MVP endet nach folgendem Funktionsumfang:

```txt
Daten können importiert oder simuliert werden
        ↓
Daten werden intern normalisiert
        ↓
Aktivitäten werden angezeigt
        ↓
Dashboard zeigt aktuelle Trainingsinformationen
        ↓
Wochenplan zeigt geplante Workouts
        ↓
Athlete Context wird erzeugt
        ↓
AI generiert Wochenplan oder Einzelworkout
        ↓
User kann Vorschlag übernehmen oder verwerfen
```

Alles darüber hinaus ist Post-MVP oder Endprodukt.

---

# 11. Scope-Risiken

## 11.1 Risiko: Zu viele Datenquellen gleichzeitig

### Problem

Wenn Garmin, Strava, FIT, Aggregator und Export gleichzeitig umgesetzt werden, wird der MVP zu groß.

### Entscheidung

Der MVP startet mit Mock-Daten und manuellem Import.

---

## 11.2 Risiko: AI-Coach wird zu früh zu mächtig geplant

### Problem

Adaptive Planung, Wochenanalyse und automatische Planänderung können schnell komplex werden.

### Entscheidung

Der MVP enthält nur:

* Wochenplan generieren
* Einzeleinheit generieren
* Vorschläge anzeigen
* User entscheidet über Übernahme

---

## 11.3 Risiko: Dashboard wird zu analytisch

### Problem

Zu viele Charts und Metriken können den MVP verlangsamen.

### Entscheidung

Der MVP enthält nur einfache Übersichten. Erweiterte Charts kommen später.

---

## 11.4 Risiko: Datenmodell wird für Future Features überbaut

### Problem

Wenn das Datenmodell zu früh alle Endprodukt-Ideen abbilden soll, wird es unnötig komplex.

### Entscheidung

Das Datenmodell wird zuerst für MVP-Features entworfen, aber so, dass spätere Erweiterungen möglich bleiben.

---

# 12. Entscheidung für die nächste Projektphase

Bevor das Datenmodell ausgearbeitet wird, gilt folgende Scope-Entscheidung:

## Datenmodell muss im ersten Schritt abbilden

* User oder Athlete Profile
* Activity
* Activity Source
* Imported File oder Raw Data Reference
* Training Zone
* Training Plan
* Planned Workout
* Workout Step
* Athlete Context Snapshot oder generierbarer Context
* AI Coach Output

## Datenmodell muss im ersten Schritt nicht vollständig abbilden

* Multi-User-Rollen
* Coach-Athlet-Beziehungen
* Zahlungsmodelle
* Social Features
* Garmin OAuth Details
* Strava OAuth Details
* Aggregator-spezifische Modelle
* langfristige Performance-Scores
* medizinische Erholungsmodelle

---

# 13. Zusammenfassung

Der Feature Scope von `pp-trainer` ist bewusst fokussiert.

Der MVP soll nicht alle langfristigen Ideen umsetzen, sondern den stabilen Kern beweisen:

* Datenimport
* internes Trainingsdatenmodell
* Dashboard
* Aktivitäten
* Wochenplan
* Workout Cards
* Athlete Context
* AI-generierte Trainingsplanung

Garmin, Strava, Aggregatoren, Exportfunktionen, adaptive Planung und tiefgehende Analysen bleiben wichtig, werden aber nicht in den ersten MVP gezogen.

Diese Abgrenzung schützt das Projekt vor unnötiger Komplexität und bildet die Grundlage für das nächste Dokument:

```txt
docs/04-data-model.md
```