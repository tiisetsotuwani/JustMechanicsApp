import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const profileRoutes = {
  // Get user profile
  get: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const profile = await kv.get(`user:${userId}`);

      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      return c.json({ profile });
    } catch (error) {
      console.log(`Get profile error: ${error}`);
      return c.json({ error: 'Internal server error getting profile' }, 500);
    }
  },

  // Update user profile
  update: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { name, phone, profileImage } = body;

      const profile = await kv.get(`user:${userId}`);

      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      if (name) profile.name = name;
      if (phone !== undefined) profile.phone = phone;
      if (profileImage !== undefined) profile.profileImage = profileImage;
      
      profile.updatedAt = new Date().toISOString();

      await kv.set(`user:${userId}`, profile);

      console.log(`Profile updated for user ${userId}`);
      return c.json({ profile, message: 'Profile updated successfully' });
    } catch (error) {
      console.log(`Update profile error: ${error}`);
      return c.json({ error: 'Internal server error updating profile' }, 500);
    }
  },

  // Get user addresses
  getAddresses: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const addresses = await kv.get(`addresses:${userId}`) || [];

      return c.json({ addresses });
    } catch (error) {
      console.log(`Get addresses error: ${error}`);
      return c.json({ error: 'Internal server error getting addresses' }, 500);
    }
  },

  // Add address
  addAddress: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { label, street, city, state, zip, isDefault } = body;

      if (!label || !street || !city || !state || !zip) {
        return c.json({ error: 'Missing required address fields' }, 400);
      }

      const addresses = await kv.get(`addresses:${userId}`) || [];
      
      const newAddress = {
        id: `addr:${Date.now()}`,
        label,
        street,
        city,
        state,
        zip,
        isDefault: isDefault || addresses.length === 0,
        createdAt: new Date().toISOString(),
      };

      // If this is default, unset others
      if (newAddress.isDefault) {
        addresses.forEach((addr: any) => addr.isDefault = false);
      }

      addresses.push(newAddress);
      await kv.set(`addresses:${userId}`, addresses);

      console.log(`Address added for user ${userId}`);
      return c.json({ address: newAddress, message: 'Address added successfully' });
    } catch (error) {
      console.log(`Add address error: ${error}`);
      return c.json({ error: 'Internal server error adding address' }, 500);
    }
  },

  // Update address
  updateAddress: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { id, label, street, city, state, zip, isDefault } = body;

      if (!id) {
        return c.json({ error: 'Address ID required' }, 400);
      }

      const addresses = await kv.get(`addresses:${userId}`) || [];
      const addressIndex = addresses.findIndex((a: any) => a.id === id);

      if (addressIndex === -1) {
        return c.json({ error: 'Address not found' }, 404);
      }

      // If setting as default, unset others
      if (isDefault) {
        addresses.forEach((addr: any) => addr.isDefault = false);
      }

      addresses[addressIndex] = {
        ...addresses[addressIndex],
        label: label || addresses[addressIndex].label,
        street: street || addresses[addressIndex].street,
        city: city || addresses[addressIndex].city,
        state: state || addresses[addressIndex].state,
        zip: zip || addresses[addressIndex].zip,
        isDefault: isDefault !== undefined ? isDefault : addresses[addressIndex].isDefault,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`addresses:${userId}`, addresses);

      console.log(`Address ${id} updated for user ${userId}`);
      return c.json({ address: addresses[addressIndex], message: 'Address updated successfully' });
    } catch (error) {
      console.log(`Update address error: ${error}`);
      return c.json({ error: 'Internal server error updating address' }, 500);
    }
  },

  // Delete address
  deleteAddress: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { id } = await c.req.json();

      if (!id) {
        return c.json({ error: 'Address ID required' }, 400);
      }

      const addresses = await kv.get(`addresses:${userId}`) || [];
      const updatedAddresses = addresses.filter((a: any) => a.id !== id);

      if (addresses.length === updatedAddresses.length) {
        return c.json({ error: 'Address not found' }, 404);
      }

      await kv.set(`addresses:${userId}`, updatedAddresses);

      console.log(`Address ${id} deleted for user ${userId}`);
      return c.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.log(`Delete address error: ${error}`);
      return c.json({ error: 'Internal server error deleting address' }, 500);
    }
  },

  // Get user vehicles
  getVehicles: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const vehicles = await kv.get(`vehicles:${userId}`) || [];

      return c.json({ vehicles });
    } catch (error) {
      console.log(`Get vehicles error: ${error}`);
      return c.json({ error: 'Internal server error getting vehicles' }, 500);
    }
  },

  // Add vehicle
  addVehicle: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { year, make, model, color, licensePlate, vin, isDefault } = body;

      if (!year || !make || !model) {
        return c.json({ error: 'Missing required vehicle fields: year, make, model' }, 400);
      }

      const vehicles = await kv.get(`vehicles:${userId}`) || [];
      
      const newVehicle = {
        id: `vehicle:${Date.now()}`,
        year,
        make,
        model,
        color: color || '',
        licensePlate: licensePlate || '',
        vin: vin || '',
        isDefault: isDefault || vehicles.length === 0,
        createdAt: new Date().toISOString(),
      };

      // If this is default, unset others
      if (newVehicle.isDefault) {
        vehicles.forEach((v: any) => v.isDefault = false);
      }

      vehicles.push(newVehicle);
      await kv.set(`vehicles:${userId}`, vehicles);

      console.log(`Vehicle added for user ${userId}`);
      return c.json({ vehicle: newVehicle, message: 'Vehicle added successfully' });
    } catch (error) {
      console.log(`Add vehicle error: ${error}`);
      return c.json({ error: 'Internal server error adding vehicle' }, 500);
    }
  },

  // Update vehicle
  updateVehicle: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { id, year, make, model, color, licensePlate, vin, isDefault } = body;

      if (!id) {
        return c.json({ error: 'Vehicle ID required' }, 400);
      }

      const vehicles = await kv.get(`vehicles:${userId}`) || [];
      const vehicleIndex = vehicles.findIndex((v: any) => v.id === id);

      if (vehicleIndex === -1) {
        return c.json({ error: 'Vehicle not found' }, 404);
      }

      // If setting as default, unset others
      if (isDefault) {
        vehicles.forEach((v: any) => v.isDefault = false);
      }

      vehicles[vehicleIndex] = {
        ...vehicles[vehicleIndex],
        year: year || vehicles[vehicleIndex].year,
        make: make || vehicles[vehicleIndex].make,
        model: model || vehicles[vehicleIndex].model,
        color: color !== undefined ? color : vehicles[vehicleIndex].color,
        licensePlate: licensePlate !== undefined ? licensePlate : vehicles[vehicleIndex].licensePlate,
        vin: vin !== undefined ? vin : vehicles[vehicleIndex].vin,
        isDefault: isDefault !== undefined ? isDefault : vehicles[vehicleIndex].isDefault,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`vehicles:${userId}`, vehicles);

      console.log(`Vehicle ${id} updated for user ${userId}`);
      return c.json({ vehicle: vehicles[vehicleIndex], message: 'Vehicle updated successfully' });
    } catch (error) {
      console.log(`Update vehicle error: ${error}`);
      return c.json({ error: 'Internal server error updating vehicle' }, 500);
    }
  },

  // Delete vehicle
  deleteVehicle: async (c: Context) => {
    try {
      const userId = c.get('userId');
      const { id } = await c.req.json();

      if (!id) {
        return c.json({ error: 'Vehicle ID required' }, 400);
      }

      const vehicles = await kv.get(`vehicles:${userId}`) || [];
      const updatedVehicles = vehicles.filter((v: any) => v.id !== id);

      if (vehicles.length === updatedVehicles.length) {
        return c.json({ error: 'Vehicle not found' }, 404);
      }

      await kv.set(`vehicles:${userId}`, updatedVehicles);

      console.log(`Vehicle ${id} deleted for user ${userId}`);
      return c.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.log(`Delete vehicle error: ${error}`);
      return c.json({ error: 'Internal server error deleting vehicle' }, 500);
    }
  },
};
