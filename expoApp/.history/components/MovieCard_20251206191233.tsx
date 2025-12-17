import React from 'react';
import { Text, View } from 'react-native';

export default function MovieCard({title}:Movie) {
  return (
    <View>
      <Text className='text-primary-foreground' >this is:{title}</Text>
     </View>
  );
}
