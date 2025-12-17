import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {


  return (
    <View
    className="flex-1 justify-center items-center bg-green-500 p-2"
    >
      <Link href="/login" className="mb-4 p-4 bg-white rounded">
        <Text className=" font-bold">Go to Login</Text>
      </Link>

      <Link href="/movies/sairat" className="mb-4 p-4 bg-primary rounded">
        <Text className=" font-bold">Sairat</Text>
      </Link>
      <Text className="text-white text-xl border border-yellow-400 text-center" >Edit ghcghcapp/index.tsx to edddeit gygwthis screen.</Text>
    </View>
  );
}
