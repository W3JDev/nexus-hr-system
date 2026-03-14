import { QueryClient } from "@tanstack/react-query";

// In dev mode __PORT_5000__ is literal, so use empty string (relative URL)
// In production deploy it gets replaced with the actual proxy path
const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

export async function apiRequest(method: string, path: string, body?: unknown) {
  const token = (window as any).__hrms_token__;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    let message = `Request failed (${res.status})`;
    try { message = JSON.parse(text).error || message; } catch {}
    throw new Error(message);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [path, ...rest] = queryKey as string[];
        const url = rest.length ? `${path}/${rest.join("/")}` : path;
        return apiRequest("GET", url);
      },
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default queryClient;
