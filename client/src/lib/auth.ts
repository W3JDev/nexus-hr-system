import { apiRequest } from "./queryClient";

export function getToken(): string | null {
  return (window as any).__hrms_token__ || null;
}

export function setToken(token: string) {
  (window as any).__hrms_token__ = token;
}

export function clearToken() {
  delete (window as any).__hrms_token__;
}

export async function login(email: string, password: string) {
  const data = await apiRequest("POST", "/api/auth/login", { email, password });
  setToken(data.token);
  return data.user;
}

export async function register(name: string, email: string, password: string) {
  const data = await apiRequest("POST", "/api/auth/register", { name, email, password });
  setToken(data.token);
  return data.user;
}

export async function logout() {
  await apiRequest("POST", "/api/auth/logout").catch(() => {});
  clearToken();
}

export async function getCurrentUser() {
  return apiRequest("GET", "/api/auth/me");
}
