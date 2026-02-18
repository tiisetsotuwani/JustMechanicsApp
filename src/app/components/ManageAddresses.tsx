import { useState } from 'react';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Home, Briefcase, MapPinned } from 'lucide-react';
import type { Address } from '../App';

interface ManageAddressesProps {
  addresses: Address[];
  onSave: (addresses: Address[]) => void;
  onBack: () => void;
}

export function ManageAddresses({ addresses: initialAddresses, onSave, onBack }: ManageAddressesProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ label: '', address: '', isDefault: false });

  const handleAdd = () => {
    if (formData.label && formData.address) {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData,
      };
      
      let updatedAddresses = [...addresses, newAddress];
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === newAddress.id,
        }));
      }
      
      setAddresses(updatedAddresses);
      setFormData({ label: '', address: '', isDefault: false });
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (address) {
      setFormData({ label: address.label, address: address.address, isDefault: address.isDefault });
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleUpdate = () => {
    if (formData.label && formData.address && editingId) {
      let updatedAddresses = addresses.map((addr) =>
        addr.id === editingId ? { ...addr, ...formData } : addr
      );
      
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === editingId,
        }));
      }
      
      setAddresses(updatedAddresses);
      setFormData({ label: '', address: '', isDefault: false });
      setIsAdding(false);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id);
    setAddresses(updatedAddresses);
  };

  const handleSetDefault = (id: string) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    setAddresses(updatedAddresses);
  };

  const handleSaveAll = () => {
    onSave(addresses);
    onBack();
  };

  const getIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('home')) return Home;
    if (lower.includes('work') || lower.includes('office')) return Briefcase;
    return MapPinned;
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Saved Addresses</h1>
        <p className="text-red-100 mt-2">Manage your service locations</p>
      </div>

      <div className="px-6 py-6">
        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Home, Work"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent resize-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-700 focus:ring-red-700"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ label: '', address: '', isDefault: false });
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  className="flex-1 bg-red-700 text-white py-3 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Address
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
            Add New Address
          </button>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.map((address) => {
            const Icon = getIcon(address.label);
            return (
              <div
                key={address.id}
                className={`bg-white rounded-2xl p-6 shadow-sm ${
                  address.isDefault ? 'border-2 border-red-700' : ''
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{address.label}</h3>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{address.address}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address.id)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {addresses.length === 0 && !isAdding && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
            <p className="text-gray-600">Add your first address to get started</p>
          </div>
        )}

        {/* Save Button */}
        {addresses.length > 0 && (
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
