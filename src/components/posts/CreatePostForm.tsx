"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TradeType = "교환" | "판매" | "구매";
type TradeMethod = "직거래" | "택배";

interface FormData {
  title: string;
  tradeType: TradeType | "";
  tradeMethod: TradeMethod | "";
  price: string;
  description: string;
  images: File[];
}

export function CreatePostForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    tradeType: "",
    tradeMethod: "",
    price: "",
    description: "",
    images: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement post creation logic
    console.log("Creating post:", formData);
    router.push("/posts");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <Label htmlFor="title" className="text-lg">제목</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="h-12 text-lg"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="text-lg">거래 형태</Label>
          <Select
            value={formData.tradeType}
            onValueChange={(value: TradeType) => setFormData({ ...formData, tradeType: value })}
          >
            <SelectTrigger className="h-12 text-lg">
              <SelectValue placeholder="선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="교환">교환</SelectItem>
              <SelectItem value="판매">판매</SelectItem>
              <SelectItem value="구매">구매</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-lg">거래 방식</Label>
          <Select
            value={formData.tradeMethod}
            onValueChange={(value: TradeMethod) => setFormData({ ...formData, tradeMethod: value })}
          >
            <SelectTrigger className="h-12 text-lg">
              <SelectValue placeholder="선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="직거래">직거래</SelectItem>
              <SelectItem value="택배">택배</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.tradeType !== "교환" && (
        <div className="space-y-4">
          <Label htmlFor="price" className="text-lg">가격</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
            className="h-12 text-lg"
            placeholder="원"
            required={formData.tradeType !== "교환"}
          />
        </div>
      )}

      <div className="space-y-4">
        <Label htmlFor="description" className="text-lg">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="min-h-[200px] text-lg p-4"
          placeholder="거래하고자 하는 굿즈에 대해 자세히 설명해주세요."
          required
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="images" className="text-lg">사진</Label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            setFormData({ ...formData, images: files });
          }}
          className="h-12 text-lg"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-lg"
          onClick={() => router.back()}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 text-lg bg-[#E6E6E6] text-[#4C4C4C] hover:bg-[#FFE34F] hover:text-black transition-colors"
        >
          등록
        </Button>
      </div>
    </form>
  );
} 