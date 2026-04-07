# JustMechanic Backend API

## Overview

- Base path: `/make-server-dd7ceef7`
- Runtime: Supabase Edge Functions with Hono
- Data store: KV via `kv_store.tsx`
- Auth: Supabase Auth bearer token
- CORS: environment-aware via `ALLOWED_ORIGINS`
- Logging: structured request logging plus per-domain audit events

All protected routes require:

```http
Authorization: Bearer {access_token}
```

## Health

### `GET /health`

Returns a simple health response for uptime checks.

## Auth

### `POST /auth/signup`

Create a customer or provider account.

Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jane Driver",
  "userType": "customer",
  "phone": "+27..."
}
```

### `POST /auth/signin`

Authenticate and return a Supabase session plus profile.

### `GET /auth/session`

Validate the current token and return:

```json
{
  "user": {},
  "profile": {}
}
```

### `POST /auth/signout`

Invalidate the current session token.

## Profile

### `GET /profile`

Return the current user profile.

### `PUT /profile`

Update editable profile fields such as name, phone, and profile image.

## Addresses

### `GET /profile/addresses`
### `POST /profile/addresses`
### `PUT /profile/addresses`
### `DELETE /profile/addresses`

Manage saved customer addresses.

## Vehicles

### `GET /profile/vehicles`
### `POST /profile/vehicles`
### `PUT /profile/vehicles`
### `DELETE /profile/vehicles`

Manage saved customer vehicles.

## Bookings

### `POST /bookings`

Create a booking.

Body:

```json
{
  "service": "Battery Replacement",
  "vehicle": "2018 VW Polo",
  "location": "Rosebank, Johannesburg",
  "description": "Car will not start",
  "coordinates": {
    "lat": -26.145,
    "lng": 28.041
  }
}
```

### `GET /bookings`

Return the current user’s bookings.

### `GET /bookings/pending`

Provider-only pending queue for unassigned jobs.

### `GET /bookings/:id`

Return a single booking by KV booking id.

### `POST /bookings/accept`

Provider accepts a pending job.

Body:

```json
{
  "bookingId": "booking:1712345678901:user-id"
}
```

### `PUT /bookings/status`

Update booking lifecycle status.

Supported statuses:

- `assigned`
- `en_route`
- `arrived`
- `in_progress`
- `completed`
- `cancelled`
- `disputed`

Optional body fields may include `price`.

### `POST /bookings/cancel`

Cancel a booking. Pending queue cleanup is handled on cancel.

### `POST /bookings/rate`

Customer submits a post-completion rating.

Body:

```json
{
  "bookingId": "booking:...",
  "rating": 5,
  "review": "Quick and professional"
}
```

### `POST /bookings/:id/photos`

Attach a job photo to a booking.

Body:

```json
{
  "photoUrl": "https://...",
  "type": "before",
  "caption": "Leaking battery terminal"
}
```

### `GET /bookings/:id/photos`

Return all saved job photos for a booking.

## Provider

### `PUT /provider/availability`

Update provider online status, service radius, and related availability data.

### `GET /provider/stats`

Return provider dashboard stats.

### `GET /provider/earnings`

Return provider earnings records and totals.

### `PUT /provider/services`

Update provider service offerings.

### `GET /providers/online`

Return currently online providers.

## Onboarding

### `GET /onboarding/status`

Return the current provider onboarding application or `not_started`.

### `POST /onboarding/step`

Persist an onboarding wizard step.

Body:

```json
{
  "step": "services_pricing",
  "data": {
    "services": ["battery_replacement", "tire_service"],
    "hourlyRate": 450
  }
}
```

### `POST /onboarding/submit`

Submit onboarding for approval or auto-approval, depending on qualification path.

### `POST /admin/onboarding/review`

Admin review endpoint for onboarding decisions.

## Chat

### `POST /chat/send`

Send a booking-linked message.

### `GET /chat/:bookingId`

Load chat history for a booking.

### `POST /chat/read`

Mark booking chat messages as read for the current participant.

## Payments

### `POST /payments`

Record a payment ledger entry.

Body:

```json
{
  "bookingId": "booking:...",
  "method": "cash",
  "amount": 850
}
```

Notes:

- Platform fee is stored at 15%.
- Cash payments are recorded as `completed`.
- Other methods start as `pending` until confirmed.

### `GET /payments/booking/:bookingId`

Get the payment record for a booking.

### `GET /payments`

Return the current user’s payment history.

### `POST /payments/confirm`

Confirm a non-cash payment.

## Invoices

### `POST /invoices/generate`

Generate a booking invoice from line items.

Body:

```json
{
  "bookingId": "booking:...",
  "lineItems": [
    {
      "description": "Battery replacement",
      "laborCost": 250,
      "partsCost": 1200,
      "quantity": 1
    }
  ]
}
```

### `GET /invoices/booking/:bookingId`

Return the invoice linked to a booking.

### `GET /invoices`

Return the current user’s invoices.

## Disputes

### `POST /disputes`

Open a dispute for a booking.

Body:

```json
{
  "bookingId": "booking:...",
  "type": "quality",
  "description": "The issue returned the next day",
  "photos": []
}
```

### `GET /disputes`

Return the current user’s disputes.

### `GET /disputes/:id`

Return one dispute by id.

### `POST /disputes/:id/respond`

Append a message to a dispute thread.

### `POST /disputes/:id/resolve`

Admin-only dispute resolution endpoint.

Supported actions:

- `refund_full`
- `refund_partial`
- `no_refund`
- `redo_service`

## Admin

All admin routes require `requireAdmin`.

### `GET /admin/overview`

Returns high-level stats:

- total customers
- total providers
- pending bookings
- active bookings
- completed bookings
- online providers
- total revenue

### `GET /admin/users`

Optional query:

- `type=customer`
- `type=provider`

### `GET /admin/users/:id`

Return one user profile.

### `GET /admin/users/:id/audit`

Return a user’s audit trail.

### `POST /admin/users/suspend`

Suspend or unsuspend a user.

### `GET /admin/bookings`

Optional query:

- `status=pending`
- `status=assigned`
- `status=completed`

### `GET /admin/debug`

Debug lookup for booking and/or user context.

Query params:

- `bookingId`
- `userId`

Response may include:

- booking
- payment
- invoice
- disputes
- chat count
- audits
- user

### `GET /admin/config/platform`
### `PUT /admin/config/platform`

Read and update platform-level config such as:

- `promoEnabled`
- `referralEnabled`
- `priorityMultiplier`
- `serviceFeePercent`

### `POST /admin/seed`

Seed the first admin user.

## Storage

### `POST /storage/upload`
### `POST /storage/url`
### `DELETE /storage/delete`
### `GET /storage/list`

Private storage helpers for profile images, documents, and job photos.

## Tracking

### `GET /tracking/:bookingId`

Return the latest tracking snapshot for a booking.

### `POST /tracking/update`

Save the latest provider location/tracking state.

## Notifications

### `POST /notifications/subscribe`

Store the authenticated user's push subscription payload.

### `POST /notifications/unsubscribe`

Remove the authenticated user's push subscription.

### `GET /notifications/preferences`

Return notification preference settings for the current user.

### `PUT /notifications/preferences`

Persist notification preference settings for the current user.

## Maps

### `GET /maps/geocode?q={query}`

Address search using OpenStreetMap Nominatim. No Google Maps API key is required.

Response:

```json
{
  "results": [
    {
      "displayName": "Sandton, Johannesburg, Gauteng, South Africa",
      "lat": -26.10757,
      "lng": 28.0567
    }
  ]
}
```

### `GET /maps/reverse?lat={lat}&lng={lng}`

Reverse geocode coordinates to an address string.

### `POST /maps/eta`

Compute distance and ETA between two coordinate points.

Body:

```json
{
  "from": { "lat": -26.2041, "lng": 28.0473 },
  "to": { "lat": -26.145, "lng": 28.041 }
}
```

Response includes:

- `distanceKm`
- `durationMin`
- `source` (`osrm` when routing service is available, otherwise `haversine`)

Notes:

- The app currently uses an OpenStreetMap-based stack instead of Google Maps.
- Frontend tiles are rendered with Leaflet + OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) with an OpenStreetMap raster fallback.
- Geocoding uses Nominatim and ETA prefers OSRM with a haversine fallback.
- This avoids paid API keys, but geocoding and ETA still require internet access unless we later self-host or ship offline map data.

## Analytics

### `GET /analytics/overview`

Returns:

```json
{
  "analytics": {
    "totalBookings": 0,
    "completed": 0,
    "pending": 0,
    "cancelled": 0,
    "inProgress": 0
  }
}
```

`inProgress` counts bookings in `in_progress`.

## Error Shape

Errors return:

```json
{
  "error": "Human-readable message"
}
```

Common status codes:

- `200` success
- `400` bad request
- `401` unauthorized
- `403` forbidden
- `404` not found
- `429` rate limited
- `500` server error

## KV Patterns

- `user:{userId}`
- `addresses:{userId}`
- `vehicles:{userId}`
- `booking:{timestamp}:{userId}`
- `customer:bookings:{userId}`
- `provider:bookings:{userId}`
- `bookings:pending`
- `provider:availability:{userId}`
- `provider:services:{userId}`
- `chat:{bookingId}`
- `payment:booking:{bookingId}`
- `invoice:booking:{bookingId}`
- `booking:photos:{bookingId}`
- `dispute:{timestamp}:{bookingId}`
- `onboarding:{userId}`
- `audit:{timestamp}:{userId}`

## Notes

- The frontend should use `src/utils/api.ts` instead of direct `fetch` calls.
- Booking statuses are canonicalized in `src/shared/types.ts`.
- Audit events are stored for auth, bookings, provider operations, onboarding, payments, invoices, disputes, chat, and admin actions.
- Current payment handling is ledger-first and processor-agnostic so a third-party gateway can be added later without changing route structure.
