import { images } from "@/constants/images";
import { Image, View } from "react-native";

export default function Index() {


  return (
   <View className="bg-primary flex-1 w-full absolute  "  >
    <Image source={images.bg} />

   </View>
  );
}
