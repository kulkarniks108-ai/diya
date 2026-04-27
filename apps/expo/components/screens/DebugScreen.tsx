import { useBleStore } from "@/store/ble";
import { useLiveStore } from "@/store/live";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DebugScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Live Store
  const {
    location,
    isTracking,
    sosActive,
    startLiveTracking,
    stopLiveTracking,
    triggerSOS,
    clearSOS,
  } = useLiveStore();

  // BLE Store
  const { connection } = useBleStore();

  // Handlers
  const handleToggleTracking = async () => {
    try {
      if (isTracking) {
        stopLiveTracking();
      } else {
        await startLiveTracking();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to toggle tracking");
    }
  };

  const handleToggleSOS = async () => {
    try {
      if (sosActive) {
        await clearSOS();
      } else {
        await triggerSOS();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to toggle SOS");
    }
  };

  const handleOpenBleDebug = () => {
    router.push("/(blind)/ble-debug");
  };

  return (
    <View 
      className="flex-1 bg-emerald-50/30" 
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-6 py-4 bg-transparent mb-2">
        <Text className="text-3xl font-bold text-emerald-950">Debug</Text>
        <Text className="text-emerald-700/70 text-base mt-1 font-medium">
          System status and manual controls.
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Live Location Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-emerald-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="location" size={22} color="#059669" />
            </View>
            <Text className="text-lg font-bold text-gray-800">Live Location</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 font-medium">Status</Text>
              <Text className={`font-bold ${isTracking ? "text-green-600" : "text-gray-400"}`}>
                {isTracking ? "Active" : "Inactive"}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 font-medium">Latitude</Text>
              <Text className="text-gray-800 font-mono">
                {location?.lat?.toFixed(6) ?? "--"}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 font-medium">Longitude</Text>
              <Text className="text-gray-800 font-mono">
                {location?.lng?.toFixed(6) ?? "--"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 font-medium">Last Update</Text>
              <Text className="text-gray-800 font-mono text-xs mt-0.5">
                {location?.updatedAt 
                  ? new Date(location.updatedAt).toLocaleTimeString() 
                  : "--"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleToggleTracking}
            className={`py-3 rounded-xl items-center ${
              isTracking ? "bg-red-50 border border-red-100" : "bg-emerald-600"
            }`}
          >
            <Text className={`font-bold ${isTracking ? "text-red-600" : "text-white"}`}>
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. SOS Debug Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-red-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="alert-circle" size={22} color="#dc2626" />
            </View>
            <Text className="text-lg font-bold text-gray-800">SOS System</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-500 font-medium">Current State</Text>
              <Text className={`font-bold ${sosActive ? "text-red-600" : "text-green-600"}`}>
                {sosActive ? "SOS ACTIVE" : "Normal"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleToggleSOS}
            className={`py-3 rounded-xl items-center ${
              sosActive ? "bg-green-50 border border-green-100" : "bg-red-600"
            }`}
          >
            <Text className={`font-bold ${sosActive ? "text-green-600" : "text-white"}`}>
              {sosActive ? "Clear SOS" : "Trigger SOS"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. BLE Debug Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-50 p-2.5 rounded-xl mr-3">
              <Ionicons name="bluetooth" size={22} color="#2563eb" />
            </View>
            <Text className="text-lg font-bold text-gray-800">BLE Hardware</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 font-medium">Connection</Text>
              <Text className={`font-bold ${
                connection.state === "connected" ? "text-green-600" : 
                connection.state === "error" ? "text-red-600" : "text-orange-500"
              }`}>
                {connection.state.toUpperCase()}
              </Text>
            </View>
            {connection.state === "connected" && (
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-medium">Device</Text>
                <Text className="text-gray-800 font-mono text-xs mt-0.5">
                  {connection.device?.name ?? "Unknown"}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleOpenBleDebug}
            className="py-3 rounded-xl items-center bg-blue-50 border border-blue-100"
          >
            <Text className="font-bold text-blue-600">
              Open BLE Debugger
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
