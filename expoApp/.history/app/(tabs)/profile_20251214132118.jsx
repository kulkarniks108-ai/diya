import * as Speech from 'expo-speech';
import { Button, Text, View } from 'react-native';

export default function Profile() {

  function speakText(text) {
  if (!text || typeof text !== 'string') return;

  Speech.stop();

  Speech.speak(text, {
    language: 'en-IN',
    rate: 0.9,
    pitch: 1.0,
  });
}
  return (
    <View>
      <Text>Profile</Text>
      <Button title="Speak Profile" onPress={() => speakText("This is the profile screen.")} />
     </View>
  );
}
