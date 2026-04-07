# JustMechanicApp — Project Guidelines

## General Rules
- All production screens must load live data through `src/utils/api.ts`. Do not hardcode mock data into frontend components.
- Every async UI flow must handle loading and error states with clear, user-friendly messaging.
- Keep modules focused. Extract reusable helpers and UI into separate files before a screen becomes difficult to follow.
- Use strict TypeScript types from `src/shared/types.ts`. Do not introduce `any`.
- Persisted user data such as profile, bookings, addresses, and vehicles must be refreshed from the backend on load and after successful mutations.

## Design System
- Brand primary color is red-700 (`#b91c1c`). Use `bg-red-700`, `text-red-700`, and related shades for primary actions.
- Prefer Tailwind utility classes. Only use inline styles where a library integration requires them.
- Use `rounded-xl` or `rounded-2xl` for cards, forms, and buttons.
- Use the system font stack already provided by the app.
- Bottom navigation should stay at five items or fewer, with the active state styled using `text-red-700`.
- Standard cards should follow `bg-white rounded-2xl p-6 shadow-sm`.
- Customer and provider screens should include `pb-20` so bottom navigation does not overlap content.

## Architecture
- `src/utils/api.ts` is the single frontend API client. Components must not call `fetch` directly.
- `src/app/App.tsx` owns top-level app state, session restoration, and screen routing.
- Screen components live in `src/app/components/`.
- Shared frontend/backend types belong in `src/shared/types.ts`.
- Supabase Edge Functions live in `supabase/functions/server/`.

## Data Flow
- On session restore or login, fetch the current profile plus any relevant collections such as bookings, addresses, and vehicles.
- Screens that display mutable backend data should refresh on mount so the UI reflects the latest state.
- For create, update, and delete actions, call the API first and then sync local state from the successful result when possible.
- If an API request fails, preserve useful local state where it is safe to do so and show an actionable error message.

## API Integration Rules
- Every button or quick action shown in production must have a working handler or a clear placeholder message.
- Booking creation must pass `description` when the user provides it.
- Tracking, profile, booking, and provider dashboard screens should prefer real backend data and use fallback UI only when the API is unavailable.
- Keep auth token management centralized through `api.setAuthToken()` and session restoration in `App.tsx`.

## Types And Status Values
- Booking statuses are: `'pending' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'`.
- User types are: `'customer' | 'provider' | 'admin'`.
- Provider statuses are: `'pending_review' | 'approved' | 'suspended' | 'rejected'`.

## Testing
- Add or update tests for API helpers and UI flows when behavior changes.
- Cover customer and provider flows, including error handling paths where practical.
- Verify file upload flows that update profile images.
- Run `corepack pnpm test` before wrapping up changes.
