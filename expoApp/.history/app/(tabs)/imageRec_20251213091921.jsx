import { useState } from "react";
import { Button, Image, Text, View } from "react-native";
// import all from expo ing picker
import * as ImagePicker from 'expo-image-picker';
// axios for making api calls
import axios from 'axios';
// file system for reading image as base64
import * as FileSystem from 'expo-file-system';
// fs



export default function ImageRec() {
  const [imageUri, setImageUri] = useState(null);
  const [labels, setLabels] = useState([]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri); 
      }
      console.log(result);
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const analyzeImage = async () => {
    try {
      if (!imageUri) {
        alert('Please select an image first.');
        return;
      }

      // Replace 'YOUR_GOOGLE_CLOUD_VISION_API_KEY' with your actual API key
      const apiKey = 'AIzaSyDMGmNswA7eRxkFduYBcVNFmCJEvKUK9qI';
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      // Read the image file from local URI and convert it to base64
      const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: {
              content: base64ImageData,
            },
            features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
          },
        ],
      };

      const apiResponse = await axios.post(apiUrl, requestData);
      setLabels(apiResponse.data.responses[0].labelAnnotations);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Error analyzing image. Please try again later.');
    }
  };

  return (
    <View>
      <Text>Image recoc</Text>

      {
        imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />
        ) : (
          <Text>No image selected</Text>
        )
      }

      <Button title="Pick an image from gallery" onPress={pickImage} />

      <Button title="Analyze Image" onPress={analyzeImage} />

      {labels.length > 0 && (
        <View>
          <Text>Labels:</Text>
          {labels.map((label, index) => (
            
            <Text key={index}>{label.description} - {Math.round(label.score * 100)}%</Text>
          ))}
        </View>
      )}
    </View>
  );
}
