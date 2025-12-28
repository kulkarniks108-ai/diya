import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
// import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (user?.email) {
    //   await Clipboard.setStringAsync(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="bg-emerald-50 p-2.5 rounded-xl mr-3">
          <Ionicons name="shield-checkmark" size={22} color="#059669" />
        </View>
        <Text className="text-lg font-bold text-gray-800">
          Primary Account Email
        </Text>
      </View>

      <View className="bg-gray-50/50 rounded-xl p-1 pl-4 flex-row items-center justify-between border border-gray-100">
        <Text className="text-gray-600 text-base font-medium flex-1 mr-2" numberOfLines={1}>
          {user?.email || "No email found"}
        </Text>
        
        <TouchableOpacity 
          onPress={handleCopy}
          className="p-3 m-1 bg-white rounded-lg shadow-sm active:bg-gray-50 border border-gray-100"
          accessibilityLabel="Copy email"
        >
          <Ionicons 
            name={copied ? "checkmark" : "copy-outline"} 
            size={18} 
            color={copied ? "#10b981" : "#9ca3af"} 
          />
        </TouchableOpacity>
      </View>
      
      <Text className="text-gray-400 text-xs mt-3 ml-1 font-medium">
        Share this email with family members so they can link to this account.
      </Text>
    </View>
  );
}
