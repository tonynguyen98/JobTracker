export const STATUS_OPTIONS = [
  "Not Started",
  "Applied",
  "Coding Assessment",
  "Interview Scheduled",
  "Wait Next Round",
  "Next Round Confirmed",
  "Interviewed",
  "Accepted",
  "Rejected",
  "No Reply",
];

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Not Started": { bg: "bg-gray-100", text: "text-gray-600" },
  Applied: { bg: "bg-blue-100", text: "text-blue-800" },
  "Coding Assessment": { bg: "bg-purple-100", text: "text-purple-800" },
  "Interview Scheduled": { bg: "bg-sky-100", text: "text-sky-800" },
  "Wait Next Round": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "Next Round Confirmed": { bg: "bg-teal-100", text: "text-teal-800" },
  Interviewed: { bg: "bg-orange-100", text: "text-orange-800" },
  Accepted: { bg: "bg-green-100", text: "text-green-800" },
  Rejected: { bg: "bg-red-100", text: "text-red-800" },
  "No Reply": { bg: "bg-gray-100", text: "text-gray-500" },
  default: { bg: "bg-gray-100", text: "text-gray-600" },
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
}
