import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import styles from "../../assets/styles/signup.styles";
import COLORS from "../../constants/colors";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("blind");


  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();

  const signUp = async () => {
    await register(email.trim(), password, role);
    // If no error after register, go to tabs
    const hasError = useAuthStore.getState().error;
    if (!hasError) {
      // Route through root: it redirects based on user.role
      router.replace('/');
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join to continue</Text>
          </View>

          <View style={styles.formContainer}>

            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="johndoe@gmail.com"
                  value={email}
                  placeholderTextColor={COLORS.placeholderText}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="******"
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ROLE SELECTION */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ selected: role === 'blind' }}
                  style={[styles.button, { flex: 1, backgroundColor: role === 'blind' ? COLORS.primary : COLORS.inputBackground }]}
                  onPress={() => setRole('blind')}
                >
                  <Text style={{ color: role === 'blind' ? COLORS.white : COLORS.textPrimary, fontWeight: '600' }}>Blind User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ selected: role === 'family' }}
                  style={[styles.button, { flex: 1, backgroundColor: role === 'family' ? COLORS.primary : COLORS.inputBackground }]}
                  onPress={() => setRole('family')}
                >
                  <Text style={{ color: role === 'family' ? COLORS.white : COLORS.textPrimary, fontWeight: '600' }}>Family Member</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SIGNUP BUTTON */}
            <TouchableOpacity style={styles.button} onPress={signUp} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* ERROR MESSAGE */}
            {error ? (
              <View style={{ marginTop: 12, backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 10 }}>
                <Text style={{ color: COLORS.textPrimary, textAlign: 'center' }}>{error}</Text>
              </View>
            ) : null}

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
