import api from "@/lib/api";

export const rentalApi = {
  list: (params?: Record<string, any>) =>
    api.get("/v1/rentals/accounts/", { params }),

  get: (id: number | string) =>
    api.get(`/v1/rentals/accounts/${id}/`),

  create: (data: any) =>
    api.post("/v1/rentals/accounts/", data),

  update: (id: number | string, data: any) =>
    api.put(`/v1/rentals/accounts/${id}/`, data),

  partialUpdate: (id: number | string, data: any) =>
    api.patch(`/v1/rentals/accounts/${id}/`, data),

  delete: (id: number | string) =>
    api.delete(`/v1/rentals/accounts/${id}/`),

  invoices: (params?: Record<string, any>) =>
    api.get("/v1/rentals/invoices/", { params }),

  payments: (params?: Record<string, any>) =>
    api.get("/v1/rentals/payments/", { params }),

  adjustments: (params?: Record<string, any>) =>
    api.get("/v1/rentals/adjustments/", { params }),

  deposits: (params?: Record<string, any>) =>
    api.get("/v1/rentals/deposits/", { params }),
};