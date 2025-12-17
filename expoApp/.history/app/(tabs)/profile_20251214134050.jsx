import { Button, Text, View } from 'react-native';
import { speakText } from '../../utils/speech';


export default function Profile() {

  

  return (
    <View>
      <Text>Profile</Text>
      <Button onPress={() => speakText("This is the profile screen.")} >
        Speech
      </Button>
     </View>
  );
}
