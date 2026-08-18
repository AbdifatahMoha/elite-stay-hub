import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPendingStaff, approveStaffProfile, rejectStaffProfile } from "@/services/profiles.service";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { UserRole } from "@/types/database";
import { useState } from "react";

export const Route = createFileRoute("/admin/approve-staff")({ component: ApproveStaffPage });

function ApproveStaffPage() {
  const { profile: adminProfile } = useAuth();
  const qc = useQueryClient();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-staff"],
    queryFn: fetchPendingStaff,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading applications…</p>;

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Approve Staff</h2>
        <p className="text-sm text-muted-foreground">
          Review staff registration requests and assign roles before they can access the portal.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No pending staff applications.</Card>
      ) : (
        <div className="space-y-4">
          {pending.map((member) => (
            <PendingStaffCard
              key={member.id}
              member={member}
              onApprove={async (role) => {
                if (!adminProfile) return;
                try {
                  await approveStaffProfile(member.id, adminProfile.id, role);
                  await qc.invalidateQueries({ queryKey: ["pending-staff"] });
                  await qc.invalidateQueries({ queryKey: ["profiles"] });
                  toast.success(`${member.full_name} approved as ${role}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Approval failed");
                }
              }}
              onReject={async () => {
                try {
                  await rejectStaffProfile(member.id);
                  await qc.invalidateQueries({ queryKey: ["pending-staff"] });
                  toast.success("Application rejected");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Rejection failed");
                }
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PendingStaffCard({
  member,
  onApprove,
  onReject,
}: {
  member: { id: string; full_name: string; email: string; phone: string | null; position: string | null; created_at: string };
  onApprove: (role: UserRole) => void;
  onReject: () => void;
}) {
  const [role, setRole] = useState<UserRole>("STAFF");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{member.full_name}</h3>
            <Badge variant="outline">PENDING</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
          <p className="text-sm text-muted-foreground">{member.phone ?? "No phone"} · {member.position ?? "No position"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Applied {new Date(member.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-44">
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">STAFF</SelectItem>
                <SelectItem value="RECEPTIONIST">RECEPTIONIST</SelectItem>
                <SelectItem value="HOUSEKEEPING">HOUSEKEEPING</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => onApprove(role)}>Approve</Button>
          <Button variant="outline" onClick={onReject}>Reject</Button>
        </div>
      </div>
    </Card>
  );
}
