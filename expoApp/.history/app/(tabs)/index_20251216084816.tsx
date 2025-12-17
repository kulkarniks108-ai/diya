import { auth } from '@/config/firebase';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Page() {

  // Show basic user info from firebase auth

  useEffect(() => {
    const user = auth.currentUser;
    console.log('Current user:', user);
  }, []);

  return (
    <View>
      <Text>Index</Text>
      {/* // link to login page */}
      <Link href="/(auth)/">
        <Text>Go to Login</Text>
      </Link>
     </View>
  );
}
