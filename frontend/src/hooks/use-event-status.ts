import { useQuery } from "@tanstack/react-query";
import { apiDb } from "@/lib/api-client";
import { isKnownEventStatus } from "@/lib/nawo";

export function useEventStatus(id: string) {
  const query = useQuery({
    queryKey: ["event-admin", id],
    queryFn: async () => {
      const { data, error } = await apiDb.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isReadOnly = Boolean(
    query.data &&
    (query.data.is_read_only === true || !isKnownEventStatus(String(query.data.status))),
  );

  return { ...query, isReadOnly };
}
