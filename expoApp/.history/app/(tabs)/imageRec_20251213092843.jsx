// app/(tabs)/imageRec.jsx

import { useState } from "react";
import { ActivityIndicator, Alert, Button, Image, Text, View } from "react-native";
// Image Picker is used to let user choose an image from gallery
import * as ImagePicker from "expo-image-picker";
// Axios for HTTP calls
import axios from "axios";
/**
 * IMPORTANT: Expo SDK v54 deprecates legacy FileSystem methods (like readAsStringAsync)
 * when imported from "expo-file-system".
 * To keep current behavior, import the legacy API from "expo-file-system/legacy".
 * This avoids runtime deprecation errors while you plan migration to new File/Directory APIs.
 */
// New File/Directory API (v54+)
import * as FileSystem from "expo-file-system";
// If using named class import is preferred:
const { File } = FileSystem;

/**
 * ImageRec screen
 * - Lets user pick an image
 * - Converts it to base64 safely
 * - Sends it to Google Cloud Vision API for label detection
 * - Displays labels with confidence percentages
 *
 * Key fixes included:
 * 1) Import legacy FileSystem from "expo-file-system/legacy" to continue using readAsStringAsync.
 * 2) Use 'base64' as encoding string to avoid undefined EncodingType errors.
 * 3) Request media library permissions before launching the picker.
 * 4) Guard against canceled picker results and missing assets.
 * 5) Add loading state and better error parsing/handling.
 * 6) Validate API responses defensively to avoid undefined property access.
 * 7) Make API key usage explicit and safer (env/config guidance).
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
      // Request media library permissions first
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "We need access to your media library to select images.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        // base64 is not needed here; we'll read base64 via FileSystem from the URI for reliability
      });

      // Guard against cancel case (user closes picker)
      if (result?.canceled) {
        return;
      }

      // Ensure we have at least one asset with a valid URI
      const asset = result?.assets?.[0];
      if (!asset?.uri) {
        setErrorMessage("No valid image was selected.");
        return;
      }

      // Save the selected image URI
      setImageUri(asset.uri);
    } catch (err) {
      console.error("Error picking image:", err);
      setErrorMessage("Error picking image. Please try again.");
    }
  };

/**
 * Reads the selected image and sends it to Google Cloud Vision to get labels.
 * Uses Expo v54 File API instead of deprecated readAsStringAsync.
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
     * Use secure storage or a server-side proxy. For local testing, you can use
     * app.json/app.config.js + expo-constants to inject config safely.
     */
    const apiKey = "YOUR_GOOGLE_CLOUD_VISION_API_KEY"; // TODO: move to env/config
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    /**
     * Expo SDK v54: Use the new File API.
     * 1) Create a File from the picked image URI.
     * 2) Read the file contents with base64 encoding.
     *
     * Docs: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
     *
     * Note: In dev, asset URIs (e.g., content:// on Android) are supported.
     */
    const file = await FileSystem.File.fromUriAsync(imageUri);

    // Read file as base64; returns a string (no data: prefix)
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