import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { loadAccount, type Account } from "./supabase";

// Loads the signed-in user's restaurant/subscription; redirects to /login when signed out.
export function useAccount() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const a = await loadAccount();
    if (!a) {
      navigate({ to: "/login" });
      return null;
    }
    setAccount(a);
    setLoading(false);
    return a;
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { account, loading, refresh };
}
