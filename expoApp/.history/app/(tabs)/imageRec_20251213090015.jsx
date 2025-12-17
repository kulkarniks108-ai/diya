import { useState } from "react";
import { Text, View } from "react-native";

export default function ImageRec() {
  const [imageUri, setImageUri] = useState(null);
  const [labels, setLabels] = useState([]);

  return (
    <View>
      <Text>Image recoc</Text>
    </View>
  );
}
