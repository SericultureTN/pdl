import { create } from "zustand";
import type { MeUser } from "@/app/types";

type AuthState = {
  accessToken: string | null;
  user: MeUser | null;
  setAuth: (args: { accessToken: string; user: MeUser }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
}));

