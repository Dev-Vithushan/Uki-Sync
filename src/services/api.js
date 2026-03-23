const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function apiRequest(path, { method = "GET", token, body, params } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    method,
    headers,
    body: payload
  });

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: payload }),
  me: (token) => apiRequest("/auth/me", { token })
};

export const usersApi = {
  list: (token, params) => apiRequest("/users", { token, params }),
  create: (token, payload) => apiRequest("/auth/register", { method: "POST", token, body: payload }),
  get: (token, id) => apiRequest(`/users/${id}`, { token }),
  update: (token, id, payload) => apiRequest(`/users/${id}`, { method: "PUT", token, body: payload }),
  remove: (token, id) => apiRequest(`/users/${id}`, { method: "DELETE", token })
};

export const boardsApi = {
  list: (token) => apiRequest("/boards", { token }),
  create: (token, payload) => apiRequest("/boards", { method: "POST", token, body: payload })
};

export const ticketsApi = {
  list: (token, params) => apiRequest("/tickets", { token, params }),
  create: (token, payload) => apiRequest("/tickets", { method: "POST", token, body: payload }),
  get: (token, id) => apiRequest(`/tickets/${id}`, { token }),
  update: (token, id, payload) => apiRequest(`/tickets/${id}`, { method: "PUT", token, body: payload }),
  remove: (token, id) => apiRequest(`/tickets/${id}`, { method: "DELETE", token }),
  comment: (token, id, payload) =>
    apiRequest(`/tickets/${id}/comments`, { method: "POST", token, body: payload })
};
