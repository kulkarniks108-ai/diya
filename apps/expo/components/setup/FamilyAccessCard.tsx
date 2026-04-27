import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

type FamilyMember = { uid: string; email: string };

export default function FamilyAccessCard() {
  const [email, setEmail] = useState<string>("");
  
  const familyMembers = useAuthStore((s) => s.familyMembers);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  // Start listener on mount
  const startedRef = useRef<boolean>(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    useAuthStore.getState().listenToFamilyMembers();
  }, []);

  const handleAdd = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      await useAuthStore.getState().addFamilyMemberByEmail(trimmed);
      setEmail("");
    } catch (e) {
      // Error is handled by store state usually, but we catch here just in case
    }
  }, [email]);

  const handleRemove = useCallback(async (uid: string) => {
    Alert.alert(
      "Remove Access",
      "Are you sure you want to remove this family member?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            await useAuthStore.getState().removeFamilyMember(uid);
          }
        }
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FamilyMember }) => (
      <View className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="bg-emerald-50 p-2 rounded-full mr-3">
            <Ionicons name="person" size={16} color="#1571fc" />
          </View>
          <Text className="text-gray-700 font-medium" numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => handleRemove(item.uid)}
          className="bg-red-50 px-3 py-1.5 rounded-lg"
        >
          <Text className="text-red-500 text-xs font-bold">Remove</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleRemove]
  );

  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50">
      <View className="flex-row items-center mb-4">
        <View className="bg-emerald-50 p-2.5 rounded-xl mr-3">
          <Ionicons name="people" size={22} color="#1571fc" />
        </View>
        <Text className="text-lg font-bold text-gray-800">
          Family Access
        </Text>
      </View>

      <Text className="text-gray-500 text-sm mb-6 leading-5">
        Grant access to family members so they can track location and receive SOS alerts.
      </Text>

      {/* Add Member Form */}
      <View className="mb-6">
        <Text className="text-xs font-bold text-black/50 uppercase mb-2 ml-1 tracking-wider">
          Add New Member
        </Text>
        <View className="flex-row gap-3">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            placeholder="family@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            onPress={handleAdd}
            disabled={isLoading || !email.trim()}
            className={`justify-center px-5 rounded-xl shadow-sm ${
              isLoading || !email.trim() ? "bg-gray-200" : "bg-emerald-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="add" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
        {error ? (
          <Text className="text-red-500 text-xs mt-2 ml-1 font-medium">{error}</Text>
        ) : null}
      </View>

      {/* List */}
      <View>
        <Text className="text-xs font-bold text-black/50 uppercase mb-2 ml-1 tracking-wider">
          Authorized Members
        </Text>
        <View className="bg-gray-50/50 rounded-xl border border-gray-100 px-1">
          <FlatList
            data={familyMembers}
            keyExtractor={(m) => m.uid}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <View className="py-8 items-center">
                <Text className="text-gray-400 text-sm font-medium">
                  No family members added yet.
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}
