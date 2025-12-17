// app/(tabs)/imageRec.jsx

import { useState } from "react";
import { ActivityIndicator, Alert, Button, Image, Text, View } from "react-native";
// Expo Image Picker for selecting from gallery (latest API)
import * as ImagePicker from "expo-image-picker";
// Axios for HTTP calls
import axios from "axios";
// Expo FileSystem v54+ (new File/Directory API)
import * as FileSystem from "expo-file-system";

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
  // Local image URI returned by Expo ImagePicker
  const [imageUri, setImageUri] = useState(null);
  // Labels returned from Google Cloud Vision API
  const [labels, setLabels] = useState([]);
  // Loading state for network/IO work
  const [loading, setLoading] = useState(false);
  // Optional error message to show to user
  const [errorMessage, setErrorMessage] = useState("");

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  /**
   * Reads the selected image and sends it to Google Cloud Vision to get labels.
   * Uses Expo v54 File API instead of deprecated legacy methods.
   */
  const analyzeImage = async () => {
    setErrorMessage("");
    setLabels([]);
    setLoading(true);

    try {
      // Ensure an image is selected
      if (!imageUri) {
        Alert.alert("No image", "Please select an image first.");
        setLoading(false);
        return;
      }

      /**
       * IMPORTANT: Do not hardcode API keys in source code for production apps.
       * Safer options:
       * - app.json/app.config.js -> `extra` -> access with `expo-constants`.
       * - server-side proxy that holds the key.
       * For now, keep inline for testing, but migrate before release.
       */
      const apiKey = "YOUR_GOOGLE_CLOUD_VISION_API_KEY"; // TODO: move to env/config
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      /**
       * Expo SDK v54 File API:
       * 1) Create a File from the picked image URI.
       * 2) Read file contents with base64 encoding.
       * Docs: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
       *
       * Note: Dev asset URIs (e.g., content:// on Android) are supported.
       */
      const file = await FileSystem.File.fromUriAsync(imageUri);

      // Read file as base64 string (without data: prefix)
      const base64ImageData = await file.readAsync({ encoding: "base64" });

      // Prepare request payload for LABEL_DETECTION
      const requestData = {
        requests: [
          {
            image: { content: base64ImageData },
            features: [{ type: "LABEL_DETECTION", maxResults: 5 }],
          },
        ],
      };

      // Make API request
      const apiResponse = await axios.post(apiUrl, requestData);

      // Defensive parsing: ensure responses array exists
      const responses = apiResponse?.data?.responses;
      if (!Array.isArray(responses) || responses.length === 0) {
        setErrorMessage("No response from Vision API.");
        setLoading(false);
        return;
      }

      // Extract label annotations safely
      const annotations = responses[0]?.labelAnnotations ?? [];
      setLabels(annotations);
    } catch (err) {
      // Extract a human-readable error
      console.error("Error analyzing image:", err);

      const apiErrorMessage =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Error analyzing image. Please try again later.";

      setErrorMessage(apiErrorMessage);
      Alert.alert("Vision API Error", apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Image Recognition</Text>

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

      {/* Analyze Button with loading guard */}
      <Button title={loading ? "Analyzing..." : "Analyze Image"} onPress={analyzeImage} disabled={loading} />

      {/* Loading Indicator */}
      {loading && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" />
          <Text>Analyzing image…</Text>
        </View>
      )}

      {/* Error message display */}
      {errorMessage ? <Text style={{ color: "red" }}>{errorMessage}</Text> : null}

      {/* Labels list */}
      {labels.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: "600" }}>Labels:</Text>
          {labels.map((label, index) => {
            const scorePct = label?.score != null ? Math.round(label.score * 100) : null;
            return (
              <Text key={`${label?.description ?? "label"}-${index}`}>
                {label?.description ?? "Unknown"}{scorePct != null ? ` - ${scorePct}%` : ""}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}