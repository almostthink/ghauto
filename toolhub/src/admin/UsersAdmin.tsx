import { useState } from "react";
import { Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { ConfirmDialog, ErrorState, Skeleton, useToast } from "../components/ui";
import { formatDate, formatRelative } from "../lib/format";
import { useAuditLog, useDeleteUser, useSaveUser, useUsers } from "../lib/queries";
import type { Role, StaffUser } from "../lib/types";
import { AdminPanel, PageHeading } from "./components";
import { ROLE_LABELS, useAuth } from "./auth";

const ROLE_HINTS: Record<Role, string> = {
  super_admin: "Full access, including staff accounts and settings.",
  editor: "Products, categories, pages and media.",
  moderator: "Review moderation and read-only content access.",
  analyst: "Analytics and read-only catalog access."
};

interface Draft {
  id?: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  active: boolean;
}

// Staff accounts only. The public catalog has no visitor accounts at all.
export function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useUsers();
  const audit = useAuditLog(25);
  const save = useSaveUser();
  const remove = useDeleteUser();

  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<StaffUser | null>(null);

  const submit = async (draft: Draft) => {
    const values: Record<string, unknown> = {
      email: draft.email,
      name: draft.name,
      role: draft.role,
      active: draft.active
    };
    if (draft.password) values.password = draft.password;
    try {
      await save.mutateAsync({ id: draft.id, values });
      toast(draft.id ? "Account updated" : "Account created");
      setEditing(null);
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "Save failed", "error");
    }
  };

  return (
    <div className="dashboard">
      <PageHeading title="Staff accounts" text="Who can sign in to this panel, and what each role may do.">
        <button
          type="button"
          className="btn primary"
          onClick={() => setEditing({ email: "", name: "", password: "", role: "editor", active: true })}
        >
          <Plus size={16} /> New account
        </button>
      </PageHeading>

      <div className="role-grid">
        {(Object.keys(ROLE_HINTS) as Role[]).map((role) => (
          <div className="role-card" key={role}>
            <ShieldCheck size={15} />
            <b>{ROLE_LABELS[role]}</b>
            <small>{ROLE_HINTS[role]}</small>
          </div>
        ))}
      </div>

      <AdminPanel className="table-panel">
        {isLoading ? <div className="table-loading"><Skeleton height={40} /><Skeleton height={40} /></div> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {data ? (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign in</th><th /></tr>
            </thead>
            <tbody>
              {data.items.map((staff) => (
                <tr key={staff.id}>
                  <td><b>{staff.name}</b></td>
                  <td>{staff.email}</td>
                  <td><span className="status-pill">{ROLE_LABELS[staff.role]}</span></td>
                  <td>
                    <span className={staff.active ? "status-pill status-published" : "status-pill status-draft"}>
                      {staff.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>{staff.lastLoginAt ? formatRelative(staff.lastLoginAt) : "Never"}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setEditing({
                        id: staff.id, email: staff.email, name: staff.name,
                        password: "", role: staff.role, active: staff.active
                      })}
                    >
                      Edit
                    </button>
                    {staff.id !== currentUser?.id ? (
                      <button type="button" className="icon-btn danger" onClick={() => setConfirm(staff)} aria-label={`Delete ${staff.name}`}>
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Audit log" subtitle="Every administrative write, with the account that made it" className="table-panel">
        <table>
          <thead><tr><th>When</th><th>Account</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {(audit.data?.items ?? []).map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.createdAt)} · {formatRelative(entry.createdAt)}</td>
                <td>{entry.actorEmail || "system"}</td>
                <td>{entry.action}</td>
                <td>{entry.entity}{entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminPanel>

      {editing ? (
        <UserModal draft={editing} busy={save.isPending} onCancel={() => setEditing(null)} onSave={submit} />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={`Delete ${confirm.name}?`}
          message="The account loses access immediately. Their audit log entries are kept."
          confirmLabel="Delete"
          tone="danger"
          busy={remove.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            try {
              await remove.mutateAsync(confirm.id);
              toast("Account deleted");
            } catch (deleteError) {
              toast(deleteError instanceof Error ? deleteError.message : "Delete failed", "error");
            } finally {
              setConfirm(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function UserModal({ draft, busy, onCancel, onSave }: {
  draft: Draft;
  busy: boolean;
  onCancel: () => void;
  onSave: (values: Draft) => void;
}) {
  const [values, setValues] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setValues((current) => ({ ...current, [key]: value }));
  const valid = values.email.includes("@") && values.name.trim().length > 1 && (values.id || values.password.length >= 10);

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <span className="eyebrow">STAFF ACCOUNT</span>
            <h2>{draft.id ? "Edit account" : "New account"}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close"><X /></button>
        </div>

        <div className="form-grid">
          <label>Name<input value={values.name} onChange={(event) => set("name", event.target.value)} /></label>
          <label>Email<input type="email" value={values.email} onChange={(event) => set("email", event.target.value)} /></label>
          <label>
            Role
            <select value={values.role} onChange={(event) => set("role", event.target.value as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </label>
          <label className="switch-field">
            <input type="checkbox" checked={values.active} onChange={(event) => set("active", event.target.checked)} />
            Account is active
          </label>
          <label className="wide">
            {draft.id ? "New password (leave blank to keep)" : "Password"}
            <input
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set("password", event.target.value)}
              placeholder="At least 10 characters"
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn primary" onClick={() => onSave(values)} disabled={busy || !valid}>
            Save account
          </button>
        </div>
      </div>
    </div>
  );
}
