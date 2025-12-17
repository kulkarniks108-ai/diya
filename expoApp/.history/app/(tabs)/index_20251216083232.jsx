import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function index() {
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
