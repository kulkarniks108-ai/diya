// app/(tabs)/imageRec.tsx
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, Text, View } from "react-native";
import { Camera, CameraType as CameraDeviceType } from "expo-camera";
import type { Camera as CameraRef } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { assist } from "../../core/assist";
import { speak } from "../../services/speech";

/**
 * ImageRec screen
 * - Lets user pick an image
 * - Converts it to base64 using Expo v54 File API (not legacy)
 * - Sends it to Google Cloud Vision API for label detection
 * - Displays labels with confidence percentages
 *
 * Why these choices:
 * - readAsStringAsync is deprecated in v54; use File API instead.
 * - Use 'base64' encoding for Vision API compatibility.
 * - Request media permissions before picker.
 * - Defensive parsing and user-friendly error feedback.
 * - Comments guide future env-key migration.
 */

export default function ImageRec() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<CameraRef | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  /**
   * Requests permission and opens the media library to pick an image.
   */
  const pickImage = async () => {
    setErrorMessage("");

    try {
      // Request media library permissions first (required by ImagePicker)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "We need access to your media library to select images.");
        return;
      }

      // Launch image picker (we'll read base64 via File API, not via picker)
      const result = await ImagePicker.launchImageLibraryAsync({
        // Use the new mediaTypes API: array of strings per Expo docs
        // Valid values include 'images' and 'videos'
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Guard against cancel case (user closes picker)
      if (result?.canceled) return;

      // Ensure we have an asset with valid URI
      const asset = result?.assets?.[0];
      if (!asset?.uri) {
        setErrorMessage("No valid image was selected.");
        return;
      }

      setImageUri(asset.uri);
    } catch (err) {
      console.error("Error picking image:", err);
      setErrorMessage("Error picking image. Please try again.");
    }
  };

  // Note: Gallery → Vision code path intentionally deferred for later.

  const onAssistPress = async () => {
    try {
      setErrorMessage("");
      setLoading(true);

      // Ensure permission
      if (!hasCameraPermission) {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== "granted") {
          speak("Camera permission denied");
          setLoading(false);
          return;
        }
        setHasCameraPermission(true);
      }

      // Programmatic capture via expo-camera
      if (!cameraRef.current) {
        speak("Camera not ready");
        setLoading(false);
        return;
      }

      speak("Capturing image");
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const capturedUri = photo?.uri;
      if (!capturedUri) {
        speak("Capture failed");
        setLoading(false);
        return;
      }
      setImageUri(capturedUri);

      // Analyze via core orchestrator
      await assist({
        imageUri: capturedUri,
        prompt: "Describe the surroundings and warn about obstacles",
        language: "en",
      });
    } catch (err) {
      console.error("Assist failed:", err);
      const apiErrorMessage = err?.message || "Error analyzing image. Please try again later.";
      setErrorMessage(apiErrorMessage);
      Alert.alert("Analysis Error", apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Image Recognition</Text>

      {/* Small camera preview for programmatic capture */}
      {hasCameraPermission ? (
        <Camera
          ref={cameraRef}
          style={{ width: 240, height: 180, borderRadius: 8 }}
          type={CameraDeviceType.back}
          ratio="4:3"
        />
      ) : (
        <Text style={{ color: "#666" }}>Camera permission not granted</Text>
      )}

      {/* Preview the selected image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: 240,
            height: 180,
            borderRadius: 8,
            borderColor: "#ddd",
            borderWidth: 1,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ color: "#666" }}>No image selected</Text>
      )}

      {/* Picker Button */}
      <Button title="Pick an image from gallery" onPress={pickImage} />

      {/* Assist Button with loading guard */}
      <Button title={loading ? "Analyzing..." : "Tell me about the surroundings"} onPress={onAssistPress} disabled={loading} />

      {/* Loading Indicator */}
      {loading && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" />
          <Text>Analyzing image…</Text>
        </View>
      )}

      {/* Error message display */}
      {errorMessage ? <Text style={{ color: "red" }}>{errorMessage}</Text> : null}

      {/* Labels list (reserved for future gallery/vision flow) */}
    </View>
  );
}