// src/api/apiFetch.js — SafePay API კლიენტი
const API_URL = "https://safepay-backend-27671206048.europe-west1.run.app/api";

export { API_URL };

export async function apiFetch(path, options = {}, token = null) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body || undefined,
  });

  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
