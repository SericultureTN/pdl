import axios from "axios";
import { env } from "@/app/env";
import { useAuthStore } from "@/stores/auth/auth.store";

const baseURL = env.VITE_API_URL ?? "http://localhost:4000/api";

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

