import { useEffect, useState } from "react";
import { apiAuth, type ApiUser } from "@/lib/api-client";

type Session = { user: ApiUser };

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiAuth.me().then((user) => {
      if (!active) return;
      setSession(user ? { user } : null);
      setLoading(false);
    });
    const unsubscribe = apiAuth.onChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useIsAdmin() {
  const { user } = useSession();
  return Boolean(user?.is_admin);
}
