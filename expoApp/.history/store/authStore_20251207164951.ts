import { create } from "zustand";

interface AuthState {
  user: { username: string, email: string} | null;
  login: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    // user: null,
    // fake user for demonstration
    user: { username: "John Doe", email: "john@gmail.com", },
    login: () => set({ user: { username: "John Doe", email: "john@gmail.com", } }),
    logout: () => set({ user: null }),
}));

export default useAuthStore;