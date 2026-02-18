import { useState } from 'react';
import { ArrowLeft, Car, Plus, Edit2, Trash2, Star } from 'lucide-react';
import type { Vehicle } from '../App';

interface ManageVehiclesProps {
  vehicles: Vehicle[];
  onSave: (vehicles: Vehicle[]) => void;
  onBack: () => void;
}

export function ManageVehicles({ vehicles: initialVehicles, onSave, onBack }: ManageVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    isDefault: false,
  });

  const handleAdd = () => {
    if (formData.make && formData.model && formData.year && formData.plateNumber) {
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        ...formData,
      };
      
      let updatedVehicles = [...vehicles, newVehicle];
      if (formData.isDefault) {
        updatedVehicles = updatedVehicles.map((veh) => ({
          ...veh,
          isDefault: veh.id === newVehicle.id,
        }));
      }
      
      setVehicles(updatedVehicles);
      setFormData({ make: '', model: '', year: '', plateNumber: '', isDefault: false });
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) {
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        plateNumber: vehicle.plateNumber,
        isDefault: vehicle.isDefault,
      });
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleUpdate = () => {
    if (formData.make && formData.model && formData.year && formData.plateNumber && editingId) {
      let updatedVehicles = vehicles.map((veh) =>
        veh.id === editingId ? { ...veh, ...formData } : veh
      );
      
      if (formData.isDefault) {
        updatedVehicles = updatedVehicles.map((veh) => ({
          ...veh,
          isDefault: veh.id === editingId,
        }));
      }
      
      setVehicles(updatedVehicles);
      setFormData({ make: '', model: '', year: '', plateNumber: '', isDefault: false });
      setIsAdding(false);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const updatedVehicles = vehicles.filter((veh) => veh.id !== id);
    setVehicles(updatedVehicles);
  };

  const handleSetDefault = (id: string) => {
    const updatedVehicles = vehicles.map((veh) => ({
      ...veh,
      isDefault: veh.id === id,
    }));
    setVehicles(updatedVehicles);
  };

  const handleSaveAll = () => {
    onSave(vehicles);
    onBack();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">My Vehicles</h1>
        <p className="text-red-100 mt-2">Manage your registered vehicles</p>
      </div>

      <div className="px-6 py-6">
        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="e.g., Toyota"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., Camry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  >
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plate Number</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    placeholder="ABC123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent uppercase"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-700 focus:ring-red-700"
                />
                <span className="text-sm text-gray-700">Set as default vehicle</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ make: '', model: '', year: '', plateNumber: '', isDefault: false });
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2 text-red-700 font-semibold mb-6"
          >
            <Plus className="w-5 h-5" />
            Add New Vehicle
          </button>
        )}

        {/* Vehicle List */}
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`bg-white rounded-2xl p-6 shadow-sm ${
                vehicle.isDefault ? 'border-2 border-red-700' : ''
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.isDefault && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Year: {vehicle.year}</p>
                  <p className="text-sm text-gray-600">Plate: {vehicle.plateNumber}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {!vehicle.isDefault && (
                  <button
                    onClick={() => handleSetDefault(vehicle.id)}
                    className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(vehicle.id)}
                  className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {vehicles.length === 0 && !isAdding && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles added</h3>
            <p className="text-gray-600">Add your first vehicle to get started</p>
          </div>
        )}

        {/* Save Button */}
        {vehicles.length > 0 && (
          <button
            onClick={handleSaveAll}
            className="w-full bg-red-700 text-white py-4 rounded-xl font-semibold hover:bg-red-800 transition-colors mt-6"
          >
            Save All Changes
          </button>
        )}
      </div>
    </div>
  );
}
