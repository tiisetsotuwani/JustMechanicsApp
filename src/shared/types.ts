// ============================================================
// src/shared/types.ts
// Single source of truth for all TypeScript types
// BOTH frontend and backend should reference these definitions
// ============================================================

export const BOOKING_STATUSES = [
  'pending',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
] as const;

export const USER_TYPES = ['customer', 'provider', 'admin'] as const;

export const PROVIDER_STATUSES = [
  'pending_review',
  'approved',
  'suspended',
  'rejected',
] as const;

export const SERVICE_CATEGORIES = [
  'oil_change',
  'brake_repair',
  'battery_replacement',
  'tire_service',
  'engine_diagnostics',
  'ac_repair',
  'transmission',
  'electrical',
  'suspension',
  'general_maintenance',
  'emergency_roadside',
  'other',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type UserType = (typeof USER_TYPES)[number] | null;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export type Screen =
  | 'splash'
  | 'login'
  | 'customer-dashboard'
  | 'provider-dashboard'
  | 'provider-crm'
  | 'provider-marketing'
  | 'admin-dashboard'
  | 'provider-onboarding'
  | 'request'
  | 'track'
  | 'chat'
  | 'services'
  | 'payments'
  | 'bookings'
  | 'service-history'
  | 'invoice'
  | 'job-documentation'
  | 'disputes'
  | 'profile'
  | 'directory'
  | 'edit-info'
  | 'addresses'
  | 'vehicles'
  | 'ai-chat'
  | 'privacy'
  | 'help'
  | 'notifications'
  | 'payment-methods';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  userType?: UserType;
  rating?: number | null;
  completedJobs?: number | null;
  isOnline?: boolean | null;
  onboardingStatus?: ProviderStatus | 'not_started' | 'in_progress' | null;
  providerType?: 'independent' | 'shop_owner' | 'shop_employee' | null;
  providerTier?: 'basic' | 'verified' | 'certified' | null;
  suspended?: boolean;
  suspendReason?: string;
  suspendedAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderProfile extends UserProfile {
  userType: 'provider';
  rating: number;
  completedJobs: number;
  isOnline: boolean;
  providerStatus: ProviderStatus;
  specializations: ServiceCategory[];
  yearsExperience?: number;
  businessName?: string;
  serviceRadius?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  coordinates?: Coordinates;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color?: string;
  vin?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  customerId?: string;
  service: string;
  vehicle: string;
  location: string;
  description?: string;
  coordinates?: Coordinates;
  status: BookingStatus;
  mechanicId?: string;
  mechanicName?: string;
  mechanicPhone?: string;
  mechanicImage?: string;
  estimatedArrival?: string;
  price?: number;
  laborCost?: number;
  partsCost?: number;
  calloutFee?: number;
  waitingFee?: number;
  platformFee?: number;
  totalCost?: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  arrivedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rated?: boolean;
  rating?: number;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  invoiceId?: string;
}

export interface TrackingData {
  bookingId: string;
  mechanicLocation: Coordinates;
  customerLocation?: Coordinates;
  estimatedArrival: string;
  status: BookingStatus;
  lastUpdated: string;
}

export interface ProviderAvailability {
  isOnline: boolean;
  serviceRadius: number;
  lat?: number;
  lng?: number;
  weeklySchedule?: ProviderScheduleDay[];
  activeCapacity?: number;
  updatedAt?: string;
}

export interface ProviderScheduleDay {
  day: string;
  start: string;
  end: string;
  available: boolean;
}

export interface EarningRecord {
  bookingId: string;
  service: string;
  date: string;
  amount: number;
  providerEarning: string;
  platformFee: string;
}

export interface ProviderStats {
  totalJobs: number;
  completedJobs: number;
  rating: number;
  totalEarnings: string;
  pendingJobs: number;
}

export type PaymentMethod = 'cash' | 'eft' | 'card';
export type PaymentStatus =
  | 'pending'
  | 'held'
  | 'released'
  | 'completed'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerId: string;
  mechanicId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  platformFee: number;
  providerEarning: number;
  createdAt: string;
  completedAt?: string | null;
  confirmedAt?: string | null;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface InvoiceLineItem {
  description: string;
  laborCost: number;
  partsCost: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  customerId: string;
  mechanicId?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  calloutFee: number;
  platformFee: number;
  providerEarning: number;
  total: number;
  status: 'issued' | 'paid' | 'disputed';
  createdAt: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  type: 'before' | 'during' | 'after' | 'issue';
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RatingRecord {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId?: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface DisputeMessage {
  from: string;
  text: string;
  date: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  reportedBy: string;
  type: 'quality' | 'overcharge' | 'no_show' | 'damage' | 'incomplete' | 'other';
  description: string;
  photos: string[];
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  resolution: string | null;
  messages: DisputeMessage[];
  createdAt: string;
  updatedAt?: string;
  resolvedAction?: 'refund_full' | 'refund_partial' | 'no_refund' | 'redo_service';
  resolvedAt?: string;
}

export interface OnboardingStepData {
  completedAt?: string;
  [key: string]: unknown;
}

export interface OnboardingApplication {
  status: 'not_started' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';
  steps?: Record<string, OnboardingStepData>;
  currentStep?: string;
  tier?: 'basic' | 'verified' | 'certified';
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  reviewedAt?: string;
  reviewReason?: string;
}

export interface AdminOverviewStats {
  totalCustomers: number;
  totalProviders: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  onlineProviders: number;
  totalRevenue: number;
}

export interface ApiError {
  error: string;
}

export interface ApiSuccess<T = unknown> {
  message?: string;
  data?: T;
}

export interface BookingCreateRequest {
  service: string;
  vehicle: string;
  location: string;
  description?: string;
  coordinates?: Coordinates;
}

export interface BookingUpdateStatusRequest {
  bookingId: string;
  status: BookingStatus;
  price?: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  userType: 'customer' | 'provider';
  phone?: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  targetId?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ip?: string;
}

export interface LoggerContext {
  requestId?: string;
  route?: string;
  userId?: string;
  durationMs?: number;
  status?: number;
  [key: string]: unknown;
}

export interface DispatchOffer {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  rank: number;
  distanceKm: number;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

export interface CrmCustomerSummary {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  totalJobs: number;
  totalSpent: number;
  lastServiceAt: string | null;
}

export interface CrmNote {
  id: string;
  providerId: string;
  customerId: string;
  text: string;
  tag: string;
  createdAt: string;
}

export interface CrmReminder {
  id: string;
  providerId: string;
  customerId: string;
  title: string;
  dueAt: string;
  channel: string;
  status: string;
  createdAt: string;
}

export interface MarketingSocialAccount {
  id: string;
  platform: string;
  accountName: string;
  externalId: string;
  status: string;
  createdAt: string;
}

export interface MarketingPost {
  id: string;
  text: string;
  platforms: string[];
  mediaUrls: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt: string | null;
  createdAt: string;
  publishedAt: string | null;
}
