import { useQuery } from "@tanstack/react-query";
import { organizerApi } from "@/lib/api-domain";
import { isKnownEventStatus } from "@/lib/nawo";

export function useEventStatus(id: string) {
  const query = useQuery({
    queryKey: ["event-admin", id],
    queryFn: async () => {
      return organizerApi.event(id);
    },
  });

  const isReadOnly = Boolean(
    query.data &&
    (query.data.is_read_only === true || !isKnownEventStatus(String(query.data.status))),
  );

  return { ...query, isReadOnly };
}
