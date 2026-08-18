import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProfiles, useUpdateProfile } from "@/hooks/use-hotel-data";
import { resetStaffPassword } from "@/services/profiles.service";
import { inviteStaffMember } from "@/services/invite-staff";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabase, getSupabaseConfigStatus } from "@/lib/supabase";
import { HOTEL_STAFF_ROLES, type ProfileStatus, type UserRole } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/staff")({ component: StaffPage });

function StaffPage() {
  const { data: allStaff = [], isLoading } = useProfiles();
  const staff = allStaff.filter((s) => HOTEL_STAFF_ROLES.includes(s.role));
  const updateProfile = useUpdateProfile();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = editId ? staff.find((s) => s.id === editId) : null;
  const serverReady = getSupabaseConfigStatus().configured;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading staff…</p>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Staff Management</h2>
          <p className="text-sm text-muted-foreground">
            Admin only — invite staff by email. No public sign-up page exists.
          </p>
          {import.meta.env.DEV && serverReady && (
            <p className="mt-2 text-xs text-muted-foreground">
              Staff invites require <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
              <code className="rounded bg-muted px-1">.env</code>.
            </p>
          )}
        </div>
        <Button onClick={() => { setEditId(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <Card className="overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 text-left">Name</th>
              <th className="text-left">Email</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Role</th>
              <th className="text-left">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border/60">
                <td className="py-3 font-medium">{member.full_name}</td>
                <td>{member.email}</td>
                <td>{member.phone ?? "—"}</td>
                <td><Badge variant="outline">{member.role}</Badge></td>
                <td>{member.status}</td>
                <td className="space-x-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => { setEditId(member.id); setOpen(true); }}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await resetStaffPassword(member.email);
                        toast.success("Password setup email sent");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Reset failed");
                      }
                    }}
                  >
                    Reset Password
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Invite Staff"}</DialogTitle>
          </DialogHeader>
          <StaffForm
            initial={editing ?? undefined}
            onSubmit={async (values) => {
              try {
                if (editing) {
                  await updateProfile.mutateAsync({
                    id: editing.id,
                    patch: {
                      full_name: values.full_name,
                      phone: values.phone,
                      role: values.role,
                      status: values.status,
                    },
                  });
                  toast.success("Staff updated");
                } else {
                  const accessToken = session?.access_token ?? (await getSupabase().auth.getSession()).data.session?.access_token;
                  if (!accessToken) throw new Error("Your session expired. Sign in again.");

                  await inviteStaffMember({
                    data: {
                      accessToken,
                      full_name: values.full_name,
                      email: values.email,
                      phone: values.phone,
                      role: values.role,
                    },
                  });
                  toast.success("Invitation sent — staff will receive a password setup email");
                }
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Save failed");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function StaffForm({
  initial,
  onSubmit,
}: {
  initial?: { full_name: string; email: string; phone: string | null; role: UserRole; status: ProfileStatus };
  onSubmit: (values: { full_name: string; email: string; phone: string | null; role: UserRole; status: ProfileStatus }) => void;
}) {
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "STAFF");
  const [status, setStatus] = useState<ProfileStatus>(initial?.status ?? "ACTIVE");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ full_name: fullName, email, phone: phone || null, role, status });
      }}
    >
      <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!initial} /></div>
      <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="MANAGER">MANAGER</SelectItem>
            <SelectItem value="RECEPTIONIST">RECEPTIONIST</SelectItem>
            <SelectItem value="HOUSEKEEPING">HOUSEKEEPING</SelectItem>
            <SelectItem value="STAFF">STAFF</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {initial && (
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProfileStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full">{initial ? "Save" : "Send Invitation"}</Button>
    </form>
  );
}
