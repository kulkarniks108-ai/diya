// import React from 'react';
// import { Text, View } from 'react-native';

// export default function Safety() {
//   return (
//     <View>
//       <Text>Safety</Text>
//      </View>
//   );
// }


import { GoogleMaps } from 'expo-maps';
import { Platform, Text } from 'react-native';

export default function App() {
  if (Platform.OS === 'android') {
    return <GoogleMaps.View style={{ flex: 1 }} />;

  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}