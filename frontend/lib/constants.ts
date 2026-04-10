export const STATUS_OPTIONS = [
  "Not Started",
  "Applied",
  "Coding Assessment",
  "Contacted",
  "Interview Scheduled",
  "Wait Next Round",
  "Next Round Confirmed",
  "Interviewed",
  "Interviewed - No Offer",
  "Accepted",
  "Rejected",
  "No Reply",
];

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
  "Interviewed - No Offer": { bg: "bg-rose-100", color: "#9d174d" },
  Accepted: { bg: "bg-green-100", color: "#14532d" },
  Rejected: { bg: "bg-red-100", color: "#7f1d1d" },
  "No Reply": { bg: "bg-gray-100", color: "#374151" },
};

const DEFAULT_STATUS = { bg: "bg-gray-100", color: "#4b5563" };

export function getStatusStyle(status: string) {
  return STATUS_MAP[status] ?? DEFAULT_STATUS;
}
