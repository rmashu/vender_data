"use client";

import { useState } from "react";
import { LockKeyhole, LogIn, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (!response.ok) {
      setIsLoading(false);
      setMessage("Invalid email or password");
      return;
    }

    window.location.assign("/dashboard");
  }

  async function signup() {
    if (isLoading) {
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Confirm password does not match");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email: email.trim().toLowerCase(), password, confirmPassword }),
    });

    setIsLoading(false);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setMessage(result.error ?? "Unable to create user");
      return;
    }

    setMode("login");
    setMessage("User created. Please wait for admin approval before login.");
  }

  return (
    <main className="flex min-h-screen bg-muted/30">
      <section className="hidden min-h-screen w-1/2 flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <div className="space-y-1">
          <p className="text-sm text-background/70">Vendor Ledger System</p>
          <h1 className="text-3xl font-semibold">Control every ledger upload, approval and report.</h1>
        </div>
        <div className="grid gap-3 text-sm text-background/80">
          <p>Role based access for admin, manager, staff and viewer users.</p>
          <p>CSV upload, vendor/store masters and audit-ready database flow.</p>
        </div>
      </section>

      <section className="flex min-h-screen flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">{mode === "login" ? "Login" : "New User"}</CardTitle>
            <CardDescription>{mode === "login" ? "Enter your account details to continue." : "Create a user account to start."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <Button type="button" variant={mode === "login" ? "default" : "ghost"} onClick={() => setMode("login")}>
                Login
              </Button>
              <Button type="button" variant={mode === "signup" ? "default" : "ghost"} onClick={() => setMode("signup")}>
                New User
              </Button>
            </div>

            {mode === "signup" && (
              <label className="grid gap-2 text-sm">
                Full name
                <div className="relative">
                  <UserPlus className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                  <Input autoComplete="off" className="pl-8" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
              </label>
            )}

            <label className="grid gap-2 text-sm">
              Email
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input autoComplete="off" className="pl-8" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              Password
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input autoComplete="new-password" className="pl-8" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
              </div>
            </label>

            {mode === "signup" && (
              <label className="grid gap-2 text-sm">
                Confirm password
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                  <Input autoComplete="new-password" className="pl-8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" />
                </div>
              </label>
            )}

            <Button className="w-full" disabled={isLoading} type="button" onClick={mode === "login" ? login : signup}>
              {mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
              {isLoading ? "Checking..." : mode === "login" ? "Login" : "Create user"}
            </Button>

            {message && <p className="text-sm text-destructive">{message}</p>}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
