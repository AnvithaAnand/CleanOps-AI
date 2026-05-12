import { useQuery } from "@tanstack/react-query";
import { listJobs, getJob } from "../api/jobs";

export function useJobs(params) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => listJobs(params).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.some((j) => j.status === "pending" || j.status === "running")) return 3000;
      return false;
    },
  });
}

export function useJob(jobId) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId).then((r) => r.data),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ["pending", "running"].includes(data.status)) return 2000;
      return false;
    },
  });
}
