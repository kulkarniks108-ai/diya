import { useAuthStore } from "@/store/auth";
import { useFamilyStore } from "@/store/familyStore";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FamilyProfile() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const { linkedBlindUserId, connectionStatus } = useFamilyStore();

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
      className="flex-1 bg-emerald-50/30" 
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Now inside ScrollView */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-emerald-950">Profile</Text>
          <Text className="text-emerald-700/70 text-base mt-1 font-medium">
            Manage your account and preferences.
          </Text>
        </View>
        
        {/* 1. Account Info Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-emerald-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="person" size={22} color="#059669" />
            </View>
            <Text className="text-lg font-bold text-gray-800">Account Info</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Email</Text>
            <Text className="text-gray-800 font-medium text-base mb-4">{user?.email}</Text>
            
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Role</Text>
            <View className="flex-row">
              <View className="bg-blue-100 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-700 text-xs font-bold uppercase">Family Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Linked User Status */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-purple-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="link" size={22} color="#9333ea" />
            </View>
            <Text className="text-lg font-bold text-gray-800">Connection Status</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500 font-medium">Status</Text>
              <View className={`px-3 py-1.5 rounded-lg ${
                !linkedBlindUserId ? 'bg-gray-200' :
                connectionStatus === 'connected' ? 'bg-green-100' : 
                connectionStatus === 'searching' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-bold uppercase ${
                  !linkedBlindUserId ? 'text-gray-600' :
                  connectionStatus === 'connected' ? 'text-green-700' : 
                  connectionStatus === 'searching' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {!linkedBlindUserId ? "NOT LINKED" : connectionStatus}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500 font-medium">Linked Account</Text>
              <Text className="text-gray-800 font-mono text-xs">
                {linkedBlindUserId ? `ID: ${linkedBlindUserId.slice(0, 8)}...` : "No account linked"}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Notification Settings (Mock UI) */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-orange-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="notifications" size={22} color="#ea580c" />
            </View>
            <Text className="text-lg font-bold text-gray-800">Notifications</Text>
          </View>

          <View className="space-y-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-gray-800 font-medium text-base">SOS Alerts</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Receive critical alerts immediately</Text>
              </View>
              <Switch 
                value={true} 
                trackColor={{ false: "#d1d5db", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View className="h-[1px] bg-gray-100" />

            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-gray-800 font-medium text-base">Location Updates</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Get notified when tracking starts</Text>
              </View>
              <Switch 
                value={true} 
                trackColor={{ false: "#d1d5db", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* 4. App Info & Support */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-6">
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <Text className="text-gray-700 font-medium text-base">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <View className="h-[1px] bg-gray-100 my-1" />
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <Text className="text-gray-700 font-medium text-base">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="mt-2 flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-2xl shadow-sm active:bg-red-50 mb-8"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2 text-base">
            Sign Out
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-emerald-800/30 text-xs font-medium pb-8">
          Version 1.0.0 • 2ndEye
        </Text>
      </ScrollView>
    </View>
  );
}
