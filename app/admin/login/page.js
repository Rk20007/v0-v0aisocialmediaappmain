import { redirect } from "next/navigation"
import AdminLoginForm from "@/components/admin/admin-login-form"

export const metadata = {
  title: "Admin Login - ColorKode"
}

export default async function AdminLoginPage() {
  return <AdminLoginForm />
}

