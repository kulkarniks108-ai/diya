import { images } from "@/constants/images";
import { Image, View } from "react-native";

export default function Index() {


  return (
   <View className="bg-primary flex-1 w-full  border border-yellow-300"  >
    <Image source={images.bg} className="w-full"  />

   </View>
  );
}
