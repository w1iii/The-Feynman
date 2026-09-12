"use client";

import { useState, useEffect } from "react";
import { authFetch } from "../../../lib/api/client";

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  verified_at: string | null;
  reference_number: string | null;
  profiles?: { email: string } | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/payments?admin=true");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to load payments (${res.status})`);
      }
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      await fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt("Reason for rejection (optional):");
    setProcessingId(id);
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", notes }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      await fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (centavos: number) =>
    `₱${(centavos / 100).toLocaleString()}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const processedPayments = payments.filter((p) => p.status !== "pending");

  return (
    <div className="min-h-screen bg-[#f9f9f7] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-[28px] text-primary mb-2">
          Payment Review
        </h1>
        <p className="font-body text-[13px] text-on-surface-variant/60 mb-8">
          Manual GCash payments requiring verification
        </p>

        {error && (
          <div className="bg-error-container text-error p-3 rounded-lg mb-6 font-body text-[13px]">
            {error}
            <button onClick={() => setError("")} className="ml-2 opacity-60">
              ×
            </button>
          </div>
        )}

        {/* Pending Payments */}
        <section className="mb-8">
          <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">
            Pending ({pendingPayments.length})
          </h2>
          {loading ? (
            <div className="text-center py-8 font-body text-[13px] text-on-surface-variant/40">
              Loading...
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8 font-body text-[13px] text-on-surface-variant/40 italic">
              No pending payments
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-body text-[14px] text-on-background truncate">
                          {payment.profiles?.email || "Unknown"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-body text-[10px] uppercase">
                          {payment.status}
                        </span>
                      </div>
                      <div className="font-body text-[12px] text-on-surface-variant/50">
                        {formatAmount(payment.amount)} •{" "}
                        {formatDate(payment.created_at)}
                      </div>
                      {payment.reference_number && (
                        <div className="font-body text-[11px] text-on-surface-variant/40 mt-1">
                          Ref: {payment.reference_number}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(payment.id)}
                        disabled={processingId === payment.id}
                        className="px-4 py-2 rounded-lg font-body text-[11px] uppercase tracking-[0.1em] text-on-primary bg-primary hover:bg-[#0d3323] transition-colors disabled:opacity-40"
                      >
                        {processingId === payment.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(payment.id)}
                        disabled={processingId === payment.id}
                        className="px-4 py-2 rounded-lg font-body text-[11px] uppercase tracking-[0.1em] text-error border border-error/30 hover:bg-error/5 transition-colors disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Processed Payments */}
        <section>
          <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">
            Processed ({processedPayments.length})
          </h2>
          {processedPayments.length === 0 ? (
            <div className="text-center py-8 font-body text-[13px] text-on-surface-variant/40 italic">
              No processed payments yet
            </div>
          ) : (
            <div className="space-y-2">
              {processedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-surface-container-lowest/50 rounded-lg p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-[13px] text-on-background/70 truncate block">
                      {payment.profiles?.email || "Unknown"}
                    </span>
                    <span className="font-body text-[11px] text-on-surface-variant/40">
                      {formatAmount(payment.amount)} •{" "}
                      {formatDate(payment.created_at)}
                      {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-body text-[10px] uppercase ${
                      payment.status === "approved"
                        ? "bg-primary/10 text-primary"
                        : "bg-error-container text-error"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
