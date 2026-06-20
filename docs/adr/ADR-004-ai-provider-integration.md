# ADR-004: AI Provider Integration

Status: Accepted

Date: 2026-06-20

## Context

AI provider access must be routed through the backend and must not expose secrets to the frontend.

The AI Coach is a core MVP concept, but real AI generation is not part of Phase
3. Phase 3 only prepares backend data and the Athlete Context Builder so later
AI requests can be made safely and reproducibly.

The frontend prototype currently shows AI Coach output from mock data. Future
phases will generate week plans, single workouts and recommendations from
stored athlete data.

## Decision

All AI provider access must go through the backend.

The frontend must never call OpenAI or any other AI provider directly and must
never receive provider API keys or secrets.

The backend AI flow should be:

```txt
Frontend request
        ↓
Backend AI endpoint
        ↓
Athlete Context Builder
        ↓
AI provider call
        ↓
Structured output validation
        ↓
Persist draft output / plan / workout
        ↓
Frontend DTO response
```

Phase 3 does not implement real provider calls. It should prepare:

- `AthleteContextBuilder` service
- optional `AthleteContextSnapshot` persistence
- AI output persistence targets
- clear DTO/schema boundaries for future structured output validation

The first AI provider target is OpenAI through the backend, but the internal app
should not make provider-specific objects part of the frontend or database
domain.

## Consequences

- `OPENAI_API_KEY` and future provider secrets stay backend-only.
- AI requests can be logged, validated, rate-limited and audited centrally.
- The AI Coach can use normalized internal data instead of raw Garmin/source
  payloads.
- AI outputs must be treated as drafts until validated and accepted.
- Future AI work depends on reliable Athlete Context construction from the
  database.
- Phase 3 should not create fake direct frontend AI integrations.
- Provider replacement remains possible because the frontend depends on app DTOs,
  not provider response objects.

## Out of Scope for Phase 3

- Real OpenAI API calls.
- Prompt engineering implementation.
- AI-generated week plan persistence workflow.
- AI-generated single workout persistence workflow.
- Automatic plan adjustment.
- User confirmation flows beyond existing frontend prototype behavior.

## Alternatives Considered

### Frontend calls AI provider directly

Rejected because it would expose secrets, bypass backend validation and couple
the UI to provider-specific APIs.

### Store only raw AI text

Rejected as the long-term model. Raw text can be retained for debugging, but
plans and workouts must become structured internal entities before they drive
the app.
