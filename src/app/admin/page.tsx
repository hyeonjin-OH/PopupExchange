"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PopupStore {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'inactive';
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<PopupStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'active' as const
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'popupStores'));
      const storesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PopupStore[];
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'popupStores'), newStore);
      setShowAddForm(false);
      setNewStore({
        name: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'active'
      });
      fetchStores();
    } catch (error) {
      console.error('Error adding store:', error);
    }
  };

  const handleStatusToggle = async (storeId: string, currentStatus: string) => {
    try {
      const storeRef = doc(db, 'popupStores', storeId);
      await updateDoc(storeRef, {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      fetchStores();
    } catch (error) {
      console.error('Error updating store status:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">팝업스토어 관리</h1>
        <Button
          onClick={() => setShowAddForm(true)}
        >
          새 팝업스토어 추가
        </Button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold mb-6">새 팝업스토어 추가</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="storeName">스토어명</Label>
                <Input
                  id="storeName"
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">위치</Label>
                <Input
                  id="location"
                  type="text"
                  value={newStore.location}
                  onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newStore.startDate}
                  onChange={(e) => setNewStore({ ...newStore, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newStore.endDate}
                  onChange={(e) => setNewStore({ ...newStore, endDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={newStore.description}
                  onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                >
                  추가
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{store.name}</h2>
                <p className="text-gray-600">{store.location}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/admin/stores/${store.id}/goods`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  굿즈 관리
                </Link>
                <button
                  onClick={() => handleStatusToggle(store.id, store.status)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    store.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {store.status === 'active' ? '운영중' : '종료'}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>기간: {store.startDate} ~ {store.endDate}</p>
              <p className="mt-2">{store.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 