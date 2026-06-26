# Phase 8 E2E Test Checklist

Status legend: ` ` = not tested · `✓` = passed · `✗` = failed / bug found

---

## Regression: Phase 7 MVP Flows

### Import
- [ ] Upload a FIT / GPX / TCX file → import succeeds, status shows "Success"
- [ ] Imported activity appears in the Activities list
- [ ] Click activity → Activity Detail opens, data correct (sport, duration, distance)
- [ ] "Activity imported" toast appears and auto-dismisses after ~4s

### Dashboard
- [ ] Current week block shows planned workouts for this week
- [ ] Completed activities appear in the weekly summary
- [ ] Weekly volume (duration / distance) updates after a completed activity
- [ ] Charts render with real data (no blank / 0 state when data exists)
- [ ] Sport/volume breakdown chart reflects correct sport distribution

### Create Workout Manually
- [ ] Select sport → form unlocks
- [ ] Add steps (single + repeat block) → session bar updates
- [ ] Set pace targets (running) → zone picker shows running_pace zones only
- [ ] Select pace zone → targetFrom/targetTo auto-filled, distance syncs from duration
- [ ] Set power targets (cycling) → zone picker shows cycling_power zones only
- [ ] Select HR zone → only zones matching workout sport shown (no cross-sport mix)
- [ ] Submit → redirected to Workout Detail
- [ ] Workout card appears in Training Plan

### AI Week Plan
- [ ] Generate week plan → loading state shown during generation
- [ ] Preview page shows all workouts for the week
- [ ] Accept → "Plan activated" toast appears
- [ ] Training Plan shows the new plan with all workouts

### AI Single Workout
- [ ] Generate single workout → preview page opens
- [ ] All step details visible (duration, distance, targets, zone names)
- [ ] Accept → "Workout added" toast appears
- [ ] Workout appears in Training Plan / current week

---

## Phase 8 New Flows

### Settings — Athlete Profile
- [ ] Edit display name / weight / FTP / max HR → save → reload → values persisted

### Settings — Training Zones
- [ ] Add a new zone set (e.g. Running Pace, 5 zones) → save → reload → zone set appears
- [ ] Edit a zone boundary → save → reload → value persisted
- [ ] Delete a zone set → reload → gone

### Settings — Goals
- [ ] Add a new goal via modal (title, type, target date) → save → reload → goal appears
- [ ] Edit goal → change priority → save → reload → priority persisted
- [ ] Delete a goal → reload → gone

### Dashboard Charts
- [ ] Charts render correctly with existing activity data
- [ ] Correct sport breakdown shown in sport distribution chart
- [ ] Empty state shown cleanly when no activities exist yet

### Import History
- [ ] Import a file → "Past Imports" section shows the entry with correct filename and status
- [ ] Filter by "Success" → only successful imports shown
- [ ] Filter by "Failed" → only failed imports shown
- [ ] Filter by "Duplicate" → only duplicates shown

### Plan Fulfillment (Link Activity to Workout)
- [ ] Open a planned workout → "Link activity" section visible
- [ ] Select an activity → link it → card shows linked-activity indicator
- [ ] Unlink → indicator disappears
- [ ] Try to delete a workout that has a linked activity → warning dialog shown
- [ ] Confirm force-delete → workout removed, activity still intact in Activities list

### AI Week Analysis
- [ ] "Analyze week" tab visible on AI Coach page
- [ ] Generate analysis → loading state shown
- [ ] Preview page shows: date range, total volume, sport breakdown, key observations, suggested focus, coach comment
- [ ] Accept → "Analysis saved" toast appears, page updates to accepted state (no navigation away)
- [ ] History panel on AI Coach page shows the entry with "Week Analysis" type label

### AI Workout Inline Edit
- [ ] Generate single workout → open preview
- [ ] Click "Edit" on a step → edit form appears inline
- [ ] Change instruction + duration → "Save" → step shows updated values
- [ ] "Edited" chip visible on modified step
- [ ] Accept → "Workout added" toast
- [ ] Open Workout Detail → edited step values shown (not original AI values)

### Zone Picker → Save → Detail Display
- [ ] Open "Create Workout" (running sport)
- [ ] Open a step edit modal → select a running pace zone → targetFrom/targetTo auto-filled
- [ ] Set duration → distance auto-calculated from zone pace
- [ ] Save workout → open Workout Detail → zone name shown on step
- [ ] Same flow for cycling with power zone
- [ ] HR zone: only zones matching workout sport shown

### Zone Picker in AI Workout Edit
- [ ] Generate a running workout → open preview → edit a step
- [ ] Select a pace zone → distance syncs from duration using zone bounds
- [ ] Accept → Workout Detail shows zone name on the step

### Toast Notifications
- [ ] AI plan accepted → "Plan activated" toast, pink with white border, auto-dismisses ~4s
- [ ] AI workout accepted → "Workout added" toast
- [ ] AI analysis accepted → "Analysis saved" toast
- [ ] Proposal discarded → "Proposal discarded" toast
- [ ] Workout status changed → "Workout marked as completed" (or missed / cancelled) toast
- [ ] Workout deleted → "Workout deleted" toast
- [ ] File import completes → "Activity imported" / "3 activities imported" toast
- [ ] JSON import completes → "Activity imported successfully" toast
- [ ] Multiple toasts can stack without overlap
- [ ] Manual × dismiss button on each toast works

---

## Additional Checks

- [ ] No console errors or warnings during any of the above flows
- [ ] Page transitions are smooth (no flicker / white flash)
- [ ] Loading states appear correctly for all async operations
- [ ] Error states show useful messages when API is unreachable
- [ ] Responsive layout intact on narrower viewport (≈1024px)
