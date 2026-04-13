export const STATUS_OPTIONS = [
  "Not Started",
  "Applied",
  "Contacted",
  "Coding Assessment",
  "Next Round Confirmed",
  "Interview Scheduled",
  "Interviewed",
  "Wait Next Round",
  "No Offer",
  "Rejected",
  "No Reply",
  "Accepted",
];

export function orderStatusEntries<T>(entries: [string, T][]) {
  return [...entries].sort(([a], [b]) => {
    const aIndex = STATUS_OPTIONS.indexOf(a);
    const bIndex = STATUS_OPTIONS.indexOf(b);

    if (aIndex !== -1 || bIndex !== -1) {
      return (
        (aIndex !== -1 ? aIndex : Number.MAX_SAFE_INTEGER) -
        (bIndex !== -1 ? bIndex : Number.MAX_SAFE_INTEGER)
      );
    }

    return a.localeCompare(b);
  });
}

export const TYPE_OPTIONS = ["Full-Time", "Contract"];

export const DEFAULT_STATUS_TEXT = "Not Started";

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  "Not Started": { bg: "bg-gray-100", color: "#4b5563" },
  Applied: { bg: "bg-blue-100", color: "#1e40af" },
  "Coding Assessment": { bg: "bg-purple-100", color: "#6b21a8" },
  Contacted: { bg: "bg-cyan-100", color: "#0f766e" },
  "Interview Scheduled": { bg: "bg-sky-100", color: "#0c4a6e" },
  "Wait Next Round": { bg: "bg-yellow-100", color: "#854d0e" },
  "Next Round Confirmed": { bg: "bg-teal-100", color: "#134e4a" },
  Interviewed: { bg: "bg-orange-100", color: "#7c2d12" },
  "No Offer": { bg: "bg-rose-100", color: "#9d174d" },
  Accepted: { bg: "bg-green-100", color: "#14532d" },
  Rejected: { bg: "bg-red-100", color: "#7f1d1d" },
  "No Reply": { bg: "bg-gray-100", color: "#374151" },
};

const DEFAULT_STATUS = { bg: "bg-gray-100", color: "#4b5563" };

export function getStatusStyle(status: string) {
  return STATUS_MAP[status] ?? DEFAULT_STATUS;
}
