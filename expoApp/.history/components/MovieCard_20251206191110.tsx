import React from 'react';
import { Text, View } from 'react-native';

export default function MovieCard({title}:Movie) {
  return (
    <View>
      <Text>this is:{title}</Text>
     </View>
  );
}
