import AccountCard from "@/components/setup/AccountCard";
import FamilyAccessCard from "@/components/setup/FamilyAccessCard";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <View 
      className="flex-1 bg-background" 
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-6 py-4 bg-transparent mb-2">
        <Text className="text-3xl font-bold text-emerald-950">Setup</Text>
        <Text className="text-black/50 text-base mt-1 font-medium">
          Configuration for family members and caregivers.
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <AccountCard />
        <FamilyAccessCard />

        {/* Logout Button */}
         <Link href="/(auth)/logout" asChild>
               
            

        <TouchableOpacity 
        //   onPress={handleLogout}
          className="mt-8 flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-2xl shadow-sm active:bg-red-50"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2 text-base">
            Sign Out
          </Text>
        </TouchableOpacity>
          </Link>

        <Text className="text-center text-emerald-800/30 text-xs mt-8 font-medium">
          Version 1.0.0 • 2ndEye
        </Text>
      </ScrollView>
    </View>
  );
}
