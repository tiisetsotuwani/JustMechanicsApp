/**
 * BACKEND INTEGRATION EXAMPLE
 * 
 * This component demonstrates how to use the backend API in your components.
 * You can copy these patterns into your actual components.
 */

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export function BackendExample() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example 1: Fetch data on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const result = await api.bookings.getMyBookings();
        setBookings(result.bookings);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (api.getAuthToken()) {
      fetchBookings();
    }
  }, []);

  // Example 2: Handle form submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const result = await api.bookings.create({
        service: 'Oil Change',
        vehicle: '2020 Toyota Camry',
        location: '123 Main St, New York, NY',
        description: 'Regular maintenance',
      });
      
      console.log('Booking created:', result.booking);
      alert('Booking created successfully!');
      
      // Refresh bookings list
      const updated = await api.bookings.getMyBookings();
      setBookings(updated.bookings);
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await api.storage.upload(file, 'profile');
      
      console.log('File uploaded:', result);
      
      // Update profile with new image URL
      await api.profile.update({
        profileImage: result.url,
      });
      
      alert('Profile image updated!');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Handle authentication
  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await api.auth.signin(email, password);
      
      console.log('Signed in:', result.user);
      console.log('Profile:', result.profile);
      
      // Token is automatically stored in the api helper
      alert(`Welcome, ${result.profile.name}!`);
    } catch (err: any) {
      setError(err.message);
      alert(`Sign in failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 5: Provider - Go Online/Offline
  const handleToggleOnline = async (isOnline: boolean) => {
    try {
      setLoading(true);
      await api.provider.updateAvailability(isOnline, 15); // 15 mile radius
      alert(isOnline ? 'You are now online!' : 'You are now offline');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 6: Provider - Accept Booking
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const result = await api.bookings.accept(bookingId);
      
      console.log('Booking accepted:', result.booking);
      alert('Booking accepted! Customer has been notified.');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 7: Real-time tracking
  const handleGetTracking = async (bookingId: string) => {
    try {
      const result = await api.tracking.get(bookingId);
      console.log('Tracking data:', result.tracking);
      
      // Update map with mechanic location
      const { mechanicLocation, estimatedArrival, status } = result.tracking;
      console.log(`Mechanic at: ${mechanicLocation.lat}, ${mechanicLocation.lng}`);
      console.log(`ETA: ${estimatedArrival}`);
      console.log(`Status: ${status}`);
    } catch (err: any) {
      console.error('Tracking error:', err);
    }
  };

  // Example 8: Add/Update Address
  const handleAddAddress = async () => {
    try {
      setLoading(true);
      const result = await api.profile.addAddress({
        label: 'Home',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        isDefault: true,
      });
      
      console.log('Address added:', result.address);
      alert('Address saved!');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 9: Add/Update Vehicle
  const handleAddVehicle = async () => {
    try {
      setLoading(true);
      const result = await api.profile.addVehicle({
        year: '2020',
        make: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        licensePlate: 'ABC123',
        isDefault: true,
      });
      
      console.log('Vehicle added:', result.vehicle);
      alert('Vehicle saved!');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 10: Get Analytics
  const handleGetAnalytics = async () => {
    try {
      const result = await api.analytics.getOverview();
      console.log('Analytics:', result.analytics);
      
      const { totalBookings, completed, pending, cancelled } = result.analytics;
      alert(`Total: ${totalBookings}, Completed: ${completed}, Pending: ${pending}, Cancelled: ${cancelled}`);
    } catch (err: any) {
      console.error('Analytics error:', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Backend Integration Examples</h1>
      
      {loading && <p className="text-blue-600">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-semibold">Bookings ({bookings.length})</h2>
        
        {bookings.map((booking) => (
          <div key={booking.id} className="border p-4 rounded">
            <p><strong>Service:</strong> {booking.service}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Date:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleCreateBooking}
          className="bg-red-700 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Create Test Booking
        </button>

        <br />

        <button
          onClick={handleAddAddress}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Add Test Address
        </button>

        <br />

        <button
          onClick={handleAddVehicle}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Add Test Vehicle
        </button>

        <br />

        <button
          onClick={handleGetAnalytics}
          className="bg-purple-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Get Analytics
        </button>

        <br />

        <input
          type="file"
          onChange={handleFileUpload}
          accept="image/*"
          className="border p-2 rounded"
        />
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Quick Reference:</h3>
        <pre className="text-xs overflow-auto">{`
// Authentication
await api.auth.signup(email, password, name, userType);
await api.auth.signin(email, password);
await api.auth.signout();

// Bookings
await api.bookings.create({ service, vehicle, location });
await api.bookings.getMyBookings();
await api.bookings.accept(bookingId);
await api.bookings.updateStatus(bookingId, status, price);

// Profile
await api.profile.get();
await api.profile.update({ name, phone });
await api.profile.addAddress({ label, street, city, state, zip });
await api.profile.addVehicle({ year, make, model });

// Provider
await api.provider.updateAvailability(isOnline, radius);
await api.provider.getStats();
await api.provider.getEarnings();

// Storage
await api.storage.upload(file, folder);

// Tracking
await api.tracking.get(bookingId);
        `}</pre>
      </div>
    </div>
  );
}
