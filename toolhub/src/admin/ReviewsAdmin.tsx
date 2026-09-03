import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorState, Skeleton, StarRating, useToast } from "../components/ui";
import { formatDate } from "../lib/format";
import { useDeleteReview, useReviews, useSaveReview } from "../lib/queries";
import type { ReviewStatus } from "../lib/types";
import { AdminPanel, PageHeading } from "./components";

const FILTERS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" }
];

export function ReviewsAdmin() {
  const toast = useToast();

  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [confirm, setConfirm] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useReviews({
    status: filter === "all" ? undefined : filter,
    limit: 100
  });
  const save = useSaveReview();
  const remove = useDeleteReview();

  const setStatus = async (id: string, status: ReviewStatus) => {
    try {
      await save.mutateAsync({ id, values: { status } });
      toast(status === "approved" ? "Review approved and rating recalculated" : `Review ${status}`);
    } catch (statusError) {
      toast(statusError instanceof Error ? statusError.message : "Update failed", "error");
    }
  };

  return (
    <div className="dashboard">
      <PageHeading title="Reviews" text="Visitor reviews are anonymous and stay hidden until a moderator approves them." />

      <AdminPanel className="table-panel">
        <div className="table-toolbar">
          <div className="chips">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={filter === item.key ? "chip active" : "chip"}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                {data?.counts?.[item.key] ? ` (${data.counts[item.key]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <div className="table-loading"><Skeleton height={40} /><Skeleton height={40} /></div> : null}
        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {data && data.items.length === 0 ? (
          <EmptyState title="Nothing to moderate" text="No reviews match this filter right now." />
        ) : null}

        {data && data.items.length ? (
          <table>
            <thead>
              <tr><th>Review</th><th>Product</th><th>Rating</th><th>Status</th><th>Submitted</th><th /></tr>
            </thead>
            <tbody>
              {data.items.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="review-cell">
                      <b>{review.authorName}{review.country ? ` · ${review.country}` : ""}</b>
                      {review.title ? <strong>{review.title}</strong> : null}
                      <p>{review.body}</p>
                    </div>
                  </td>
                  <td>{review.product?.name ?? "—"}</td>
                  <td><StarRating value={review.rating} size={11} /></td>
                  <td><span className={`status-pill status-${review.status}`}>{review.status}</span></td>
                  <td>{formatDate(review.createdAt)}</td>
                  <td className="row-actions">
                    {review.status !== "approved" ? (
                      <button type="button" className="edit-btn" onClick={() => setStatus(review.id, "approved")}>
                        <Check size={13} /> Approve
                      </button>
                    ) : null}
                    {review.status !== "rejected" ? (
                      <button type="button" className="icon-btn" onClick={() => setStatus(review.id, "rejected")} aria-label="Reject">
                        <X size={13} />
                      </button>
                    ) : null}
                    <button type="button" className="icon-btn danger" onClick={() => setConfirm(review.id)} aria-label="Delete review">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminPanel>

      {confirm ? (
        <ConfirmDialog
          title="Delete this review?"
          message="The product rating is recalculated from the remaining approved reviews."
          confirmLabel="Delete"
          tone="danger"
          busy={remove.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            try {
              await remove.mutateAsync(confirm);
              toast("Review deleted");
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
