import { auth } from '@/config/firebase';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function Page() {
  const [user, setUser] = useState<{ email: string } | null>(null);


  // Show basic user info from firebase auth

  useEffect(() => {
    try {

      const user = auth.currentUser;
      console.log('Current user:', user);
    } catch (error: any) {
      console.log('Error fetching user:', error.message);
    }
  }, []);

  return (
    <View>
      <Text>Index</Text>
      {/* // link to login page */}
      <Link href="/(auth)">
        <Text>Go to Login</Text>
      </Link>
    </View>
  );
}
