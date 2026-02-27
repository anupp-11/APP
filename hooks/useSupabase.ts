"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchQuickTransactionData,
  submitTransaction,
  fetchTodaySummary,
  type QuickTransactionData,
  type TodaySummary,
  type TransactionResponse,
  type TransactionDirection,
  type SourceType,
  type WithdrawSubtype,
} from "@/lib/supabase";

// ============================================
// Hook: useQuickTransactionData
// Fetches all data needed for the quick transaction form
// ============================================

export function useQuickTransactionData() {
  const [data, setData] = useState<QuickTransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchQuickTransactionData();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================
// Hook: useSubmitTransaction
// Handles transaction submission with loading state
// ============================================

export function useSubmitTransaction() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);

  const submit = useCallback(
    async (params: {
      direction: TransactionDirection;
      amount: number;
      sourceType: SourceType;
      chimeAccountId?: string;
      paymentPlatformId?: string;
      gameId?: string;
      withdrawSubtype?: WithdrawSubtype;
      notes?: string;
    }) => {
      setLoading(true);
      setResult(null);

      const response = await submitTransaction(params);

      setResult(response);
      setLoading(false);

      return response;
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { submit, loading, result, reset };
}

// ============================================
// Hook: useTodaySummary
// Fetches today's transaction summary
// ============================================

export function useTodaySummary() {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchTodaySummary();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
