"use client"

import { useEffect, useState, useRef } from "react"
import { registerUser, fetchAllUsers, updateUser, type User } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "user" })
  const [editForm, setEditForm] = useState<Partial<User> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 👇 Ref for edit form
  const editFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetchAllUsers()
    if (res.success) {
      setUsers(res.users)
    } else {
      setError(res.error || "Failed to load users")
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await registerUser(form)
    if (res.success) {
      setForm({ name: "", username: "",  password: "", role: "user" })
      setSuccess("🎉 User registered successfully!")
      await loadUsers()
    } else {
      setError(res.error || "Failed to register user")
    }
    setSubmitting(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm?.id) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await updateUser(editForm.id, editForm)
    if (res.success) {
      setSuccess("✅ User updated successfully!")
      setEditForm(null)
      await loadUsers()
    } else {
      setError(res.error || "Failed to update user")
    }
    setSubmitting(false)
  }

  // 👇 When editForm is set, scroll to form
  useEffect(() => {
    if (editForm && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [editForm])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Users</h1>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-600 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Register User */}
      <Card>
        <CardHeader>
          <CardTitle>Register New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="executive">Executive</option>
                <option value="auditor">Auditor</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Add User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Edit User Form */}
      {editForm && (
        <Card ref={editFormRef}>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={editForm.username || ""} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
              </div>
             <div>
  <Label>Password</Label>
  <Input
    type="password"
    placeholder="Enter new password"
    value={editForm.password || ""}
    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
  />
  <small className="text-gray-500">Leave blank to keep the current password</small>
</div>
              <div>
                <Label>Role</Label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={editForm.role || "user"}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="executive">Executive</option>
                  <option value="auditor">Auditor</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Updating..." : "Update User"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditForm(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div>
        <h2 className="text-xl font-semibold mt-6 mb-4">Users List</h2>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>{user.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p className="text-sm text-gray-500">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    onClick={() => setEditForm(user)}
                  >
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
