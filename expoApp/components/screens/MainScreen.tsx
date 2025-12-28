import { assist } from "@/core/assist";
import { speak } from "@/services/speech";
import { useHardwareStore } from "@/store/hardware";
import { useLiveStore } from "@/store/live";
import { Camera, CameraView } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  // Stores
  const setCaptureFn = useHardwareStore((s) => s.setCaptureFn);
  const {
    isTracking,
    sosActive,
    startLiveTracking,
    stopLiveTracking,
    triggerSOS,
    clearSOS,
  } = useLiveStore();

  // --- Camera & Permissions ---
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  const captureWithCamera = async (): Promise<string> => {
    if (!hasCameraPermission) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") throw new Error("Camera permission denied");
      setHasCameraPermission(true);
    }
    if (!cameraRef.current) throw new Error("Camera not ready");

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (!photo?.uri) throw new Error("Capture failed");
    return photo.uri;
  };

  // Register capture function for hardware triggers
  useEffect(() => {
    setCaptureFn(captureWithCamera);
    return () => setCaptureFn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission]);

  // --- Actions ---

  const handleDescribe = async () => {
    try {
      setLoading(true);
      speak("Capturing image");
      const uri = await captureWithCamera();
      
      speak("Analyzing surroundings");
      await assist({
        imageUri: uri,
        prompt: "Describe the surroundings and warn about obstacles",
        language: "en",
      });
    } catch (err: any) {
      console.error(err);
      speak("Error analyzing image");
      Alert.alert("Error", err.message || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleLiveTracking = async () => {
    try {
      if (isTracking) {
        stopLiveTracking();
        speak("Live tracking stopped");
      } else {
        speak("Starting live tracking");
        await startLiveTracking();
        speak("Live tracking started");
      }
    } catch (err: any) {
      console.error(err);
      speak("Error toggling live tracking");
      Alert.alert("Error", err.message);
    }
  };

  const handleSOS = async () => {
    try {
      if (sosActive) {
        await clearSOS();
        speak("SOS cleared");
      } else {
        speak("Sending SOS");
        await triggerSOS();
        speak("SOS sent");
      }
    } catch (err: any) {
      console.error(err);
      speak("Error toggling SOS");
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View 
      className="flex-1 bg-white px-4" 
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Hidden Camera View */}
      {hasCameraPermission && (
        <View className="h-1 w-1 overflow-hidden opacity-0 absolute top-0 left-0">
          <CameraView
            ref={cameraRef}
            style={{ width: 100, height: 100 }}
            ratio="4:3"
          />
        </View>
      )}

      <View className="flex-1 justify-evenly py-4 gap-4">
        
        {/* 1. Describe Surroundings */}
        <TouchableOpacity
          onPress={handleDescribe}
          disabled={loading}
          accessibilityLabel="Describe surroundings"
          accessibilityHint="Takes a photo and tells you what is around you"
          accessibilityRole="button"
          className={`flex-1 justify-center items-center rounded-3xl ${
            loading ? "bg-gray-400" : "bg-blue-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text className="text-white text-3xl font-bold text-center">
              Describe Surroundings
            </Text>
          )}
        </TouchableOpacity>

        {/* 2. Live Tracking */}
        <TouchableOpacity
          onPress={handleLiveTracking}
          accessibilityLabel={isTracking ? "Stop live tracking" : "Start live tracking"}
          accessibilityHint="Shares your live location with family"
          accessibilityRole="togglebutton"
          accessibilityState={{ checked: isTracking }}
          className={`flex-1 justify-center items-center rounded-3xl ${
            isTracking ? "bg-green-600" : "bg-gray-800"
          }`}
        >
          <Text className="text-white text-3xl font-bold text-center">
            {isTracking ? "Stop Live Tracking" : "Start Live Tracking"}
          </Text>
        </TouchableOpacity>

        {/* 3. SOS */}
        <TouchableOpacity
          onPress={handleSOS}
          accessibilityLabel={sosActive ? "Clear SOS" : "Send SOS"}
          accessibilityHint="Alerts family members immediately"
          accessibilityRole="togglebutton"
          accessibilityState={{ checked: sosActive }}
          className={`flex-1 justify-center items-center rounded-3xl ${
            sosActive ? "bg-red-800" : "bg-red-600"
          }`}
        >
          <Text className="text-white text-4xl font-black text-center">
            {sosActive ? "CLEAR SOS" : "SOS"}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}
