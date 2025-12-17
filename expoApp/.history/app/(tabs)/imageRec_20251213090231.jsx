import { useState } from "react";
import { Text, View } from "react-native";
// import all from expo ing picker
import * as ImagePicker from 'expo-image-picker';
// axios for making api calls
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

  return (
    <View>
      <Text>Image recoc</Text>
    </View>
  );
}
