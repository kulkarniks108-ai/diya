import { useBleStore } from "@/store/ble";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BleDebugScreen() {
  const insets = useSafeAreaInsets();
  const {
    connection,
    devices,
    scanning,
    lastEvent,
    lastEventRawHex,
    error,
    autoConnect,
    disconnect,
    startScan,
    stopScan,
    connect,
  } = useBleStore();

  useEffect(() => {
    void autoConnect();
  }, [autoConnect]);

  return (
    <View className="flex-1 bg-emerald-50/30" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 bg-transparent mb-2">
        <Text className="text-2xl font-bold text-emerald-950">ESP32 BLE Debug</Text>
        <Text className="text-emerald-700/70 text-sm mt-1 font-medium">
          Hardware connection and event logs.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Status Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
          <View className="flex-row items-center mb-4">
             <View className="bg-blue-50 p-2 rounded-xl mr-3">
              <Ionicons name="bluetooth" size={20} color="#2563eb" />
            </View>
            <Text className="text-lg font-bold text-gray-800">Connection Status</Text>
          </View>

          <View className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 mb-4 space-y-2">
             <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 font-medium">State</Text>
                <Text className={`font-bold uppercase ${
                    connection.state === 'connected' ? 'text-green-600' : 
                    connection.state === 'error' ? 'text-red-600' : 'text-orange-500'
                }`}>{connection.state}</Text>
             </View>

             {connection.state === "connected" && (
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500 font-medium">Device</Text>
                    <Text className="text-gray-800 font-mono text-xs mt-0.5 text-right max-w-[150px]">
                        {connection.device?.name ?? "(no name)"}
                        {"\n"}
                        <Text className="text-gray-400">{connection.device?.id}</Text>
                    </Text>
                </View>
             )}
             
             {connection.state === "connecting" && (
                 <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500 font-medium">Target</Text>
                    <Text className="text-gray-800 font-mono text-xs">{connection.target}</Text>
                 </View>
             )}

             {connection.state === "error" && (
                 <View className="mt-2 bg-red-50 p-2 rounded-lg">
                    <Text className="text-red-600 text-xs">{connection.message}</Text>
                 </View>
             )}
             
             {error ? (
                 <View className="mt-2 bg-red-50 p-2 rounded-lg">
                    <Text className="text-red-600 text-xs">{error}</Text>
                 </View>
             ) : null}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity 
                onPress={() => void autoConnect()}
                className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
            >
                <Text className="text-white font-bold">Auto Connect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => void disconnect()}
                className="flex-1 bg-red-50 border border-red-100 py-3 rounded-xl items-center"
            >
                <Text className="text-red-600 font-bold">Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scanner Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
           <View className="flex-row items-center justify-between mb-4">
             <View className="flex-row items-center">
                <View className="bg-purple-50 p-2 rounded-xl mr-3">
                    <Ionicons name="radio-outline" size={20} color="#9333ea" />
                </View>
                <Text className="text-lg font-bold text-gray-800">Scanner</Text>
             </View>
             {scanning && <ActivityIndicator size="small" color="#9333ea" />}
           </View>

           <TouchableOpacity 
                onPress={() => (scanning ? stopScan() : void startScan())}
                className={`py-3 rounded-xl items-center mb-4 ${
                    scanning ? "bg-gray-100" : "bg-purple-600"
                }`}
            >
                <Text className={`font-bold ${scanning ? "text-gray-600" : "text-white"}`}>
                    {scanning ? "Stop Scan" : "Start Scan"}
                </Text>
            </TouchableOpacity>

            <View className="gap-2">
                {devices.map((d) => (
                    <View key={d.id} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <View className="flex-1 mr-2">
                            <Text className="font-medium text-gray-800">{d.name || "Unknown"}</Text>
                            <Text className="text-xs text-gray-400 font-mono">{d.id}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => void connect(d.id)}
                            className="bg-blue-50 px-3 py-1.5 rounded-lg"
                        >
                            <Text className="text-blue-600 text-xs font-bold">Connect</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {devices.length === 0 && (
                    <Text className="text-center text-gray-400 italic py-2">No devices found yet.</Text>
                )}
            </View>
        </View>

        {/* Logs Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50 mb-4">
            <View className="flex-row items-center mb-4">
                <View className="bg-gray-100 p-2 rounded-xl mr-3">
                    <Ionicons name="terminal-outline" size={20} color="#4b5563" />
                </View>
                <Text className="text-lg font-bold text-gray-800">Last Event</Text>
            </View>

            <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-gray-400 text-xs font-mono mb-1">TYPE</Text>
                <Text className="text-green-400 font-mono mb-3">{lastEvent?.type ?? "None"}</Text>
                
                <Text className="text-gray-400 text-xs font-mono mb-1">DATA</Text>
                <Text className="text-white font-mono text-xs mb-3">
                    {JSON.stringify(lastEvent?.data ?? {}, null, 2)}
                </Text>

                <Text className="text-gray-400 text-xs font-mono mb-1">RAW HEX</Text>
                <Text className="text-yellow-500 font-mono text-xs break-all">
                    {lastEventRawHex ?? "None"}
                </Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}
