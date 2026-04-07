import {
  BOOKING_STATUSES,
  PROVIDER_STATUSES,
  USER_TYPES,
} from '../../shared/types';

describe('shared types constants', () => {
  it('contains the canonical booking statuses', () => {
    expect(BOOKING_STATUSES).toEqual([
      'pending',
      'assigned',
      'en_route',
      'arrived',
      'in_progress',
      'completed',
      'cancelled',
      'disputed',
    ]);
  });

  it('contains the supported user types', () => {
    expect(USER_TYPES).toEqual(['customer', 'provider', 'admin']);
  });

  it('contains the provider statuses', () => {
    expect(PROVIDER_STATUSES).toEqual([
      'pending_review',
      'approved',
      'suspended',
      'rejected',
    ]);
  });
});
