import { images } from "@/constants/images";
import { Image, View } from "react-native";

export default function Index() {


  return (
   <View className="bg-primary"  >
    <Image source={images.bg} />

   </View>
  );
}
