import { Link } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function Page() {
  const [user, setUser] = useState<{ email: string } | null>(null);


  // Show basic user info from firebase auth

  useEffect(() => {

    const setUserFromAuth = async () => {
      try {
        const auth = getAuth()


        onAuthStateChanged(auth, (user) => {
          if (user) {
            setUser({ email: user.email || '' });
          } else {
            setUser(null);
          }
        })
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    }

    setUserFromAuth();

  }, []);

  return (
    <View>
      <Text>Hi nigga your email is: {user?.email}</Text>
      {/* // link to login page */}
      <Link href="/(auth)">
        <Text>Go to Login</Text>
      </Link>

      {/* Logout */}
        <Link href="/(auth)/logout">
        <Text>Go to Logout</Text>
      </Link>
    </View>
  );
}
