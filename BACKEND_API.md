# JustMechanic Backend API Documentation

## Overview

The JustMechanic backend is built using Supabase Edge Functions with Hono framework. It provides comprehensive functionality for authentication, real-time bookings, file storage, and user management.

**Base URL:** `https://{projectId}.supabase.co/functions/v1/make-server-dd7ceef7`

## Architecture

- **Framework:** Hono (Fast web framework for Edge Functions)
- **Database:** Supabase KV Store (Key-Value database)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (Private bucket)
- **Runtime:** Deno

## Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer {access_token}
```

### Public Endpoints

#### 1. Sign Up
```
POST /auth/signup
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "userType": "customer", // or "provider"
  "phone": "555-1234" // optional
}
```

**Response:**
```json
{
  "user": { ...user object },
  "message": "User created successfully. Please sign in."
}
```

#### 2. Sign In
```
POST /auth/signin
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    ...
  },
  "user": { ...user object },
  "profile": { ...user profile }
}
```

#### 3. Get Session
```
GET /auth/session
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "user": { ...user object },
  "profile": { ...user profile }
}
```

#### 4. Sign Out
```
POST /auth/signout
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

---

## Profile Management

### Get Profile
```
GET /profile
```

**Response:**
```json
{
  "profile": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "customer",
    "phone": "555-1234",
    "profileImage": "https://...",
    "rating": 5.0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile
```
PUT /profile
```

**Body:**
```json
{
  "name": "Jane Doe",
  "phone": "555-5678",
  "profileImage": "https://..."
}
```

---

## Address Management

### Get All Addresses
```
GET /profile/addresses
```

**Response:**
```json
{
  "addresses": [
    {
      "id": "addr:123",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "isDefault": true
    }
  ]
}
```

### Add Address
```
POST /profile/addresses
```

**Body:**
```json
{
  "label": "Work",
  "street": "456 Office Blvd",
  "city": "New York",
  "state": "NY",
  "zip": "10002",
  "isDefault": false
}
```

### Update Address
```
PUT /profile/addresses
```

**Body:**
```json
{
  "id": "addr:123",
  "label": "Home Office",
  "isDefault": true
}
```

### Delete Address
```
DELETE /profile/addresses
```

**Body:**
```json
{
  "id": "addr:123"
}
```

---

## Vehicle Management

### Get All Vehicles
```
GET /profile/vehicles
```

**Response:**
```json
{
  "vehicles": [
    {
      "id": "vehicle:123",
      "year": "2020",
      "make": "Toyota",
      "model": "Camry",
      "color": "Silver",
      "licensePlate": "ABC123",
      "vin": "1234567890",
      "isDefault": true
    }
  ]
}
```

### Add Vehicle
```
POST /profile/vehicles
```

**Body:**
```json
{
  "year": "2021",
  "make": "Honda",
  "model": "Civic",
  "color": "Blue",
  "licensePlate": "XYZ789",
  "vin": "0987654321",
  "isDefault": false
}
```

### Update Vehicle
```
PUT /profile/vehicles
```

**Body:**
```json
{
  "id": "vehicle:123",
  "color": "Red",
  "isDefault": true
}
```

### Delete Vehicle
```
DELETE /profile/vehicles
```

**Body:**
```json
{
  "id": "vehicle:123"
}
```

---

## Booking Management

### Create Booking (Customer)
```
POST /bookings
```

**Body:**
```json
{
  "service": "Oil Change",
  "vehicle": "2020 Toyota Camry",
  "location": "123 Main St, New York, NY",
  "description": "Regular oil change needed",
  "coordinates": {
    "lat": 40.7580,
    "lng": -73.9855
  }
}
```

**Response:**
```json
{
  "booking": {
    "id": "booking:123",
    "customerId": "user-id",
    "service": "Oil Change",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z",
    ...
  },
  "message": "Booking created successfully"
}
```

### Get My Bookings
```
GET /bookings
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking:123",
      "service": "Oil Change",
      "status": "completed",
      "mechanicName": "John Mechanic",
      "price": "49.99",
      ...
    }
  ]
}
```

### Get Pending Bookings (Provider Only)
```
GET /bookings/pending
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking:456",
      "service": "Brake Repair",
      "status": "pending",
      "location": "789 Street Ave",
      ...
    }
  ]
}
```

### Accept Booking (Provider Only)
```
POST /bookings/accept
```

**Body:**
```json
{
  "bookingId": "booking:456"
}
```

**Response:**
```json
{
  "booking": {
    "id": "booking:456",
    "status": "assigned",
    "mechanicId": "provider-id",
    "mechanicName": "John Mechanic",
    "estimatedArrival": "15-20 min",
    ...
  },
  "message": "Booking accepted successfully"
}
```

### Update Booking Status
```
PUT /bookings/status
```

**Body:**
```json
{
  "bookingId": "booking:456",
  "status": "in-progress", // or "completed"
  "price": "149.99" // optional, for completed bookings
}
```

### Cancel Booking (Customer Only)
```
POST /bookings/cancel
```

**Body:**
```json
{
  "bookingId": "booking:123"
}
```

---

## Provider Features

### Update Availability (Online/Offline)
```
PUT /provider/availability
```

**Body:**
```json
{
  "isOnline": true,
  "serviceRadius": 15 // miles
}
```

### Get Provider Stats
```
GET /provider/stats
```

**Response:**
```json
{
  "stats": {
    "totalJobs": 150,
    "completedJobs": 145,
    "rating": 4.8,
    "totalEarnings": "12345.67",
    "pendingJobs": 3
  }
}
```

### Get Earnings
```
GET /provider/earnings
```

**Response:**
```json
{
  "earnings": [
    {
      "bookingId": "booking:123",
      "service": "Oil Change",
      "date": "2024-01-01T00:00:00Z",
      "amount": 49.99,
      "providerEarning": "42.49",
      "platformFee": "7.50"
    }
  ],
  "totalEarnings": "12345.67",
  "currency": "USD"
}
```

### Update Services Offered
```
PUT /provider/services
```

**Body:**
```json
{
  "services": [
    "Oil Change",
    "Brake Repair",
    "Tire Service",
    "Engine Diagnostics"
  ]
}
```

### Get Online Providers
```
GET /providers/online
```

**Response:**
```json
{
  "providers": [
    {
      "id": "provider-id",
      "name": "John Mechanic",
      "rating": 4.8,
      "completedJobs": 145,
      "profileImage": "https://..."
    }
  ]
}
```

---

## Storage/File Upload

### Upload File
```
POST /storage/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File object
- `folder`: Folder name (e.g., "profile", "vehicles", "general")

**Response:**
```json
{
  "path": "user-id/profile/123456.jpg",
  "url": "https://...signed-url...",
  "message": "File uploaded successfully"
}
```

### Get Signed URL
```
POST /storage/url
```

**Body:**
```json
{
  "path": "user-id/profile/123456.jpg"
}
```

**Response:**
```json
{
  "url": "https://...signed-url..."
}
```

### Delete File
```
DELETE /storage/delete
```

**Body:**
```json
{
  "path": "user-id/profile/123456.jpg"
}
```

### List Files
```
GET /storage/list?folder=profile
```

**Response:**
```json
{
  "files": [
    {
      "name": "123456.jpg",
      "id": "...",
      "updated_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "last_accessed_at": "2024-01-01T00:00:00Z",
      "metadata": {...}
    }
  ]
}
```

---

## Real-Time Tracking

### Get Tracking Data
```
GET /tracking/{bookingId}
```

**Response:**
```json
{
  "tracking": {
    "bookingId": "booking:123",
    "mechanicLocation": {
      "lat": 40.7580,
      "lng": -73.9855
    },
    "estimatedArrival": "15-20 min",
    "status": "assigned",
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

---

## Analytics

### Get Overview
```
GET /analytics/overview
```

**Response:**
```json
{
  "analytics": {
    "totalBookings": 50,
    "completed": 45,
    "pending": 2,
    "cancelled": 3,
    "inProgress": 0
  }
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request (missing fields, validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Usage

Import the API helper:

```typescript
import { api } from '/src/utils/api';

// Sign in
const result = await api.auth.signin('user@example.com', 'password');

// Create booking
const booking = await api.bookings.create({
  service: 'Oil Change',
  vehicle: '2020 Toyota Camry',
  location: '123 Main St',
});

// Upload profile image
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const uploadResult = await api.storage.upload(file, 'profile');
```

---

## Database Schema (KV Store)

The backend uses a key-value store with these key patterns:

- `user:{userId}` - User profile
- `addresses:{userId}` - User's saved addresses (array)
- `vehicles:{userId}` - User's vehicles (array)
- `booking:{timestamp}:{userId}` - Booking details
- `customer:bookings:{userId}` - Customer's booking IDs (array)
- `provider:bookings:{userId}` - Provider's booking IDs (array)
- `provider:services:{userId}` - Provider's offered services (array)
- `provider:availability:{userId}` - Provider's availability settings
- `bookings:pending` - Queue of pending booking IDs (array)

---

## Notes

- **Email Confirmation:** Currently disabled (email server not configured). Users are auto-confirmed on signup.
- **Platform Fee:** Providers receive 85% of payment, platform takes 15%.
- **File Size Limit:** 5MB per file upload.
- **Storage:** All files stored in private bucket, accessible via signed URLs only.
- **Real-time Updates:** Tracking endpoint provides simulated real-time location data.

---

## Support

For issues or questions, contact the development team or check the application logs in the Supabase dashboard.
