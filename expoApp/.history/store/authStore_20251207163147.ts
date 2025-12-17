import { create } from "zustand";

interface AuthState {
  user: { id: string; name: string } | null;
  login: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    // user: null,
    // fake user for demonstration
    user: { id: "1", name: "John Doe" },
    login: () => set({ user: { id: "1", name: "John Doe" } }),
    logout: () => set({ user: null }),
}));

export default useAuthStore;