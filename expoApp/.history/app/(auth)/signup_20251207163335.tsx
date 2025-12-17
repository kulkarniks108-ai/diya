import useAuthStore from '@/store/authStore';
import React from 'react';
import { Text, View } from 'react-native';

export default function SignUp() {

  const { user,  } = useAuthStore();
  return (
    <View>
      <Text>the name of the user is {user?.name}</Text>
     </View>
  );
}
