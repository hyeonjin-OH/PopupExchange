"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log("Login attempt:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Label htmlFor="username" className="text-lg font-medium p-5 m-5">
            아이디
          </Label>
          <Input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="h-20 text-xl px-6 rounded-xl"
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="password" className="text-lg font-medium p-5 m-5">
            비밀번호
          </Label>
          <Input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="h-20 text-xl px-6 rounded-xl"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-20 text-xl font-medium rounded-xl bg-[#E6E6E6] text-[#4C4C4C] hover:bg-[#FFE34F] hover:text-black transition-colors"
      >
        로그인
      </Button>
    </form>
  );
} 