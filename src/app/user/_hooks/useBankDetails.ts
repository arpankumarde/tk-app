import { useState, useEffect, useCallback } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export type BankVerificationStatus = "verified" | "pending" | "rejected";

export interface StudentBankDetails {
  id: number;
  studentId: number;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  upiId?: string | null;
  panNumber: string;
  panCardImageBase64?: string;
  verificationStatus: BankVerificationStatus;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankDetailsInput {
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  upiId?: string;
  panNumber: string;
  panCardImageBase64: string;
}

export const useBankDetails = (token: string | null) => {
  const [bankDetails, setBankDetails] = useState<StudentBankDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBankDetails = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/_api/student/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const payload = data.json || data;
        setBankDetails(payload || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  const saveBankDetails = useCallback(
    async (
      input: BankDetailsInput,
    ): Promise<
      { ok: true; data: StudentBankDetails } | { ok: false; error: string }
    > => {
      if (!token) return { ok: false, error: "Not authenticated" };
      try {
        setSaving(true);
        const res = await fetch(`${BASE_URL}/_api/student/bank-details/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: input }),
        });
        const data = await res.json().catch(() => ({}));
        const payload = data.json || data;

        if (!res.ok || payload?.error) {
          const errMsg = Array.isArray(payload?.error)
            ? payload.error
                .map((e: { message: string }) => e.message)
                .join("\n")
            : payload?.error || "Failed to save bank details.";
          return { ok: false, error: errMsg };
        }

        setBankDetails(payload);
        return { ok: true, data: payload };
      } catch {
        return { ok: false, error: "Network error. Try again." };
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  return {
    bankDetails,
    loading,
    saving,
    refetch: fetchBankDetails,
    saveBankDetails,
  };
};

export default useBankDetails;
