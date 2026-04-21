"use client";

import { useEffect, useState } from "react";
import {
  Users, Plus, Trash2, Loader2, Eye, EyeOff, Shield, User, Pencil, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  _count: { waNumbers: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [showPass, setShowPass] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"USER" | "ADMIN">("USER");
  const [editShowPass, setEditShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create user");
      } else {
        setName(""); setEmail(""); setPassword(""); setRole("USER");
        setShowForm(false);
        fetchUsers();
      }
    } catch {
      setFormError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u: UserRecord) => {
    setEditId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword("");
    setEditRole(u.role);
    setEditError("");
    setEditShowPass(false);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setEditError("");
    try {
      const body: Record<string, string> = {
        name: editName,
        email: editEmail,
        role: editRole,
      };
      if (editPassword.trim()) body.password = editPassword;

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Failed to save");
      } else {
        setEditId(null);
        fetchUsers();
      }
    } catch {
      setEditError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? All their WA numbers will be removed.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = "app-input";

  return (
    <div className="space-y-5">
      <div className="app-page-header">
        <div>
          <span className="app-kicker">Administration</span>
          <h1 className="app-page-title mt-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-[#546dfe]" />
            User Management
          </h1>
          <p className="app-page-description">
            {users.length} user{users.length !== 1 ? "s" : ""} total across this workspace.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="app-button-primary"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "New User"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="app-card space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create New User</h2>
            <p className="mt-1 text-sm text-slate-500">Add a new team member to the CRM workspace.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className={inputCls} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@example.com" className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={inputCls + " pr-10"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")} className="app-select">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="app-button-primary disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="app-button-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="app-card overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg", u.role === "ADMIN" ? "bg-[#eef1ff]" : "bg-[#f3f6fb]")}>
                  {u.role === "ADMIN" ? <Shield className="h-5 w-5 text-[#546dfe]" /> : <User className="h-5 w-5 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", u.role === "ADMIN" ? "bg-[#eef1ff] text-[#546dfe]" : "bg-[#f2f5fb] text-slate-500")}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {u._count.waNumbers} WA number{u._count.waNumbers !== 1 ? "s" : ""} · Joined {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => editId === u.id ? setEditId(null) : startEdit(u)}
                    className={cn("app-icon-button h-9 w-9", editId === u.id ? "border-[#b9c7ff] bg-[#eef1ff] text-[#546dfe]" : "")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    disabled={deleting === u.id}
                    className="app-icon-button h-9 w-9 text-slate-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {editId === u.id && (
                <div className="border-t border-[#e8edf6] bg-[#fafbfe] px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Edit User</p>
                  <div className="mb-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Email</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">New Password <span className="text-slate-400">(leave empty to keep current)</span></label>
                      <div className="relative">
                        <input type={editShowPass ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                        <button type="button" onClick={() => setEditShowPass(!editShowPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                          {editShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Role</label>
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as "USER" | "ADMIN")} className="app-select">
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  {editError && <p className="mb-2 text-xs text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(u.id)} disabled={saving} className="app-button-primary disabled:opacity-50">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className="app-button-secondary">
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
