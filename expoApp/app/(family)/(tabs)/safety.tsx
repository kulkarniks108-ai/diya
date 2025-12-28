import { useFamilyStore } from "@/store/familyStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafetyScreen() {
  const {
    findLinkedBlindUser,
    blindUserLocation,
    connectionStatus,
    linkedBlindUserId,
    unsubscribeLiveStatus,
  } = useFamilyStore();

  useEffect(() => {
    findLinkedBlindUser();
    return () => {
      unsubscribeLiveStatus();
    };
  }, []);

  // Helper to format timestamp
  const getLastUpdatedText = () => {
    if (!blindUserLocation?.updatedAt) return "Waiting for updates...";
    
    // Handle Firestore Timestamp or JS Date/Number
    const date = blindUserLocation.updatedAt.toDate 
      ? blindUserLocation.updatedAt.toDate() 
      : new Date(blindUserLocation.updatedAt);

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Updated just now";
    return `Updated ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  };

  const isSOS = blindUserLocation?.sos || false;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4">
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Safety Monitor</Text>
          <TouchableOpacity onPress={() => findLinkedBlindUser()}>
             <Ionicons name="refresh" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Connection Status (Debug/Info) */}
        {connectionStatus === "searching" && (
          <Text className="text-center text-gray-500 mb-4">Finding linked user...</Text>
        )}
        {connectionStatus === "no-link" && (
          <View className="bg-yellow-100 p-4 rounded-xl mb-4">
            <Text className="text-yellow-800">
              You are not linked to any blind user yet. Ask them to add your email in their settings.
            </Text>
          </View>
        )}

        {/* 1. Safety Status Card */}
        <View className="bg-white p-5 rounded-3xl shadow-sm mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className={`w-12 h-12 rounded-full items-center justify-center ${isSOS ? 'bg-red-100' : 'bg-green-100'}`}>
                <Ionicons 
                  name={isSOS ? "warning" : "shield-checkmark"} 
                  size={24} 
                  color={isSOS ? "#DC2626" : "#16A34A"} 
                />
              </View>
              <View>
                <Text className="text-lg font-semibold text-gray-800">
                  Safety Status
                </Text>
                <Text className={`text-sm ${isSOS ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                  {isSOS ? "SOS TRIGGERED" : "No active emergency"}
                </Text>
              </View>
            </View>
            {isSOS && (
               <View className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
                 <Text className="text-xs text-red-600 font-medium">ALERT</Text>
               </View>
            )}
          </View>
          <Text className="text-gray-400 text-xs mt-3 ml-1">
            {getLastUpdatedText()}
          </Text>
        </View>

        {/* 2. Map Placeholder (Coords) */}
        <View className="bg-white rounded-3xl shadow-sm overflow-hidden mb-4 h-80 relative">
          {/* Background decoration to look like a map placeholder */}
          <View className="absolute inset-0 bg-blue-50 opacity-50" />
          
          <View className="flex-1 items-center justify-center p-6">
            {blindUserLocation ? (
              <View className="items-center">
                <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mb-4 shadow-lg border-4 border-white">
                  <Ionicons name="location" size={32} color="white" />
                </View>
                <Text className="text-gray-500 text-sm font-medium mb-1">CURRENT COORDINATES</Text>
                <Text className="text-2xl font-bold text-gray-800 mb-1">
                  {blindUserLocation.lat}
                </Text>
                <Text className="text-2xl font-bold text-gray-800">
                  {blindUserLocation.lng}
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="location-outline" size={48} color="#CBD5E1" />
                <Text className="text-gray-400 mt-2 text-center">
                  {connectionStatus === 'connected' 
                    ? "Waiting for location data..." 
                    : "Location unavailable"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Location Details Card */}
        <View className="bg-white p-5 rounded-3xl shadow-sm mb-8">
          <View className="flex-row items-start gap-3">
            <Ionicons name="navigate-circle" size={24} color="#4B5563" />
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold text-base mb-1">
                Current Location
              </Text>
              <Text className="text-gray-500 leading-5">
                {blindUserLocation 
                  ? `Lat: ${blindUserLocation.lat}, Lng: ${blindUserLocation.lng}`
                  : "Location details will appear here when available."}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm">
              {getLastUpdatedText()}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}