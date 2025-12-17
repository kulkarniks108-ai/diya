import { images } from "@/constants/images";
import { Image, Text, View } from "react-native";

export default function Index() {


  return (
   <View className="bg-primary flex-1"  >
    <Image source={images.bg} className="w-full"  />
    <Text>Hiii</Text>

   </View>
  );
}
