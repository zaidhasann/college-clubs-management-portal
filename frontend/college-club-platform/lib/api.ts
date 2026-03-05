const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper to get token from localStorage
const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Helper to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
) {
  const url = `${API_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const token = getToken();
  if (token) {
    Object.assign(headers, { Authorization: `Bearer ${token}` });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (name: string, email: string, password: string, registerAs: "member" | "admin", reason?: string) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, registerAs, reason: reason || "" }),
    }),

  login: (email: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiRequest("/auth/me"),
};

// Clubs API
export const clubsAPI = {
  getAll: () => apiRequest("/clubs"),
  getById: (id: string) => apiRequest(`/clubs/${id}`),
  getMyClub: () => apiRequest("/clubs/my-club"),
  create: (name: string, description: string) =>
    apiRequest("/clubs", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  update: (id: string, data: any) =>
    apiRequest(`/clubs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`/clubs/${id}`, {
      method: "DELETE",
    }),
  join: (id: string) =>
    apiRequest(`/clubs/${id}/join`, {
      method: "POST",
    }),
  addPhoto: (id: string, photoUrl: string) =>
    apiRequest(`/clubs/${id}/photos`, {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
  setMainPhoto: (id: string, photoUrl: string) =>
    apiRequest(`/clubs/${id}/set-main-photo`, {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
  removePhoto: (id: string, photoUrl: string) =>
    apiRequest(`/clubs/${id}/photos`, {
      method: "DELETE",
      body: JSON.stringify({ photoUrl }),
    }),
};

// Events API
export const eventsAPI = {
  getAll: () => apiRequest("/events"),
  getMyEvents: () => apiRequest("/events/my-events"),
  getById: (id: string) => apiRequest(`/events/${id}`),
  create: (title: string, description: string, date: string, deadline: string, isPaid: boolean, price?: number) =>
    apiRequest("/events", {
      method: "POST",
      body: JSON.stringify({ title, description, date, deadline, isPaid, price: isPaid ? price : 0 }),
    }),
  update: (id: string, data: any) =>
    apiRequest(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`/events/${id}`, {
      method: "DELETE",
    }),
  register: (id: string) =>
    apiRequest(`/events/${id}/register`, {
      method: "POST",
    }),
  getUserRegistrations: () => apiRequest("/events/user/registrations"),
  addPhoto: (id: string, photoUrl: string) =>
    apiRequest(`/events/${id}/photos`, {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
  setMainPhoto: (id: string, photoUrl: string) =>
    apiRequest(`/events/${id}/set-main-photo`, {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
  removePhoto: (id: string, photoUrl: string) =>
    apiRequest(`/events/${id}/photos`, {
      method: "DELETE",
      body: JSON.stringify({ photoUrl }),
    }),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: () => apiRequest("/users"),
  promoteToAdmin: (userId: string) =>
    apiRequest(`/users/${userId}/promote`, {
      method: "POST",
    }),
  demoteToMember: (userId: string) =>
    apiRequest(`/users/${userId}/demote`, {
      method: "POST",
    }),
  delete: (userId: string) =>
    apiRequest(`/users/${userId}`, {
      method: "DELETE",
    }),
};

// Admin Requests API
export const adminRequestsAPI = {
  getPending: () => apiRequest("/admin-requests/pending"),
  getAll: () => apiRequest("/admin-requests"),
  approve: (requestId: string) =>
    apiRequest(`/admin-requests/${requestId}/approve`, {
      method: "POST",
    }),
  reject: (requestId: string) =>
    apiRequest(`/admin-requests/${requestId}/reject`, {
      method: "POST",
    }),
};

// Club Join Requests API
export const clubJoinRequestAPI = {
  getPending: (clubId: string) =>
    apiRequest(`/clubs/${clubId}/join-requests/pending`),
  getAll: (clubId: string) =>
    apiRequest(`/clubs/${clubId}/join-requests`),
  approve: (clubId: string, requestId: string) =>
    apiRequest(`/clubs/${clubId}/join-requests/${requestId}/approve`, {
      method: "POST",
    }),
  reject: (clubId: string, requestId: string) =>
    apiRequest(`/clubs/${clubId}/join-requests/${requestId}/reject`, {
      method: "POST",
    }),
};

// Payment API (Razorpay)
export const paymentAPI = {
  createOrder: (eventId: string) =>
    apiRequest(`/payments/order/${eventId}`, {
      method: "POST",
    }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    apiRequest("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
