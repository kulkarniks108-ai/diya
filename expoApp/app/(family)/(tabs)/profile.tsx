import { useAuthStore } from "@/store/auth";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function FamilyProfile() {
  const user = useAuthStore((s) => s.user);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Family Profile</Text>
      <Text>Email: {user?.email ?? ""}</Text>

      <Link href="/(auth)/logout" asChild>
        <Text style={{ textDecorationLine: "underline" }}>Logout</Text>
      </Link>
    </View>
  );
}
