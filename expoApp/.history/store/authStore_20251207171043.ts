import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { API_URL } from "../constants/api";

interface AuthState {
  user: { username: string; email: string } | null;
  isLoading: boolean;
  token: string | null;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const useAuthStore = create<AuthState>((set) => ({
  // user: null,
  // fake user for demonstration
  user: { username: "John Doe", email: "john@gmail.com" },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error: unknown) {
      set({ isLoading: false });
      if(error instanceof Error) {
        return { success: false,  error: error.message };
      }
    }
  },

  isLoading: false,
  token: null,
}));

export default useAuthStore;
