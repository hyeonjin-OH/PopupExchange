"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-4 mb-8">
      <Input
        type="text"
        placeholder="검색어를 입력하세요"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 h-12 text-lg px-4"
      />
      <Button 
        type="submit"
        className="h-12 px-8 text-lg bg-[#E6E6E6] text-[#4C4C4C] hover:bg-[#FFE34F] hover:text-black transition-colors"
      >
        검색
      </Button>
    </form>
  );
} 