"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Good {
  id: string;
  name: string;
  description: string;
  price: number;
  storeId: string;
}

export default function GoodsManagement() {
  const params = useParams();
  const storeId = params.storeId as string;
  
  const [goods, setGoods] = useState<Good[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGood, setNewGood] = useState({
    name: '',
    description: '',
    price: 0,
    storeId: storeId
  });

  useEffect(() => {
    fetchGoods();
  }, [storeId]);

  const fetchGoods = async () => {
    try {
      const q = query(
        collection(db, 'goods'),
        where('storeId', '==', storeId)
      );
      const querySnapshot = await getDocs(q);
      const goodsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Good[];
      setGoods(goodsData);
    } catch (error) {
      console.error('Error fetching goods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'goods'), newGood);
      setShowAddForm(false);
      setNewGood({
        name: '',
        description: '',
        price: 0,
        storeId: storeId
      });
      fetchGoods();
    } catch (error) {
      console.error('Error adding good:', error);
    }
  };

  const handleDelete = async (goodId: string) => {
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'goods', goodId));
      fetchGoods();
    } catch (error) {
      console.error('Error deleting good:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">굿즈 관리</h1>
          <p className="text-gray-500 mt-1">팝업스토어의 굿즈를 관리할 수 있습니다.</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-[#FFE34F] hover:bg-[#FFD700] text-black">
              새 굿즈 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>새 굿즈 추가</DialogTitle>
              <DialogDescription>
                새로운 굿즈의 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">상품명</Label>
                  <Input
                    id="name"
                    value={newGood.name}
                    onChange={(e) => setNewGood({ ...newGood, name: e.target.value })}
                    placeholder="상품명을 입력하세요"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={newGood.description}
                    onChange={(e) => setNewGood({ ...newGood, description: e.target.value })}
                    placeholder="상품 설명을 입력하세요"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">가격</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newGood.price}
                    onChange={(e) => setNewGood({ ...newGood, price: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
                <Button type="submit" className="bg-[#FFE34F] hover:bg-[#FFD700] text-black">
                  추가
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goods.map((good) => (
          <Card key={good.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{good.name}</CardTitle>
              <CardDescription>{good.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-black">
                {good.price.toLocaleString()}원
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="destructive"
                onClick={() => handleDelete(good.id)}
                size="sm"
              >
                삭제
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 