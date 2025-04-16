"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Student } from "@/types/student"

export default function LoginPage() {
  const [regsiterNumber, setRegisterNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!regsiterNumber || !password) {
      toast.error("Please enter both email and password")
      return
    }

    try {
      setLoading(true)

      // Query the students table to find a matching email and password
      const { data, error } = await supabase.from("students").select("*").eq("register_number", regsiterNumber).single()

      if (error) {
        throw error
      }

      const student = data as Student

      // Simple password check (in a real app, you should use proper password hashing)
      if (student && student.password === password) {
        // Store student ID in session storage
        sessionStorage.setItem("studentId", student.id.toString())
        sessionStorage.setItem("studentData", JSON.stringify(student))

        toast.success("Login successful!")

        // Redirect to dashboard or home page
        router.push("/dashboard")
      } else {
        toast.error("Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Student Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="register_number"
                type="register_number"
                placeholder="Your register number"
                value={regsiterNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Register
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
