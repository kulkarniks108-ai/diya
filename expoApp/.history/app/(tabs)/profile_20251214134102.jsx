import { Button, Text, View } from 'react-native';
import { speakText } from '../../utils/speech';


export default function Profile() {

  

  return (
    <View>
      <Text>Profile</Text>
      <Button title="Speak Profile" onPress={() => speakText("This is the profile screen.")} />
     </View>
  );
}
