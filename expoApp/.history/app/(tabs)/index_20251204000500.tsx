import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Image, ScrollView, View } from "react-native";

export default function Index() {


  return (
    <View className="bg-primary flex-1"  >
      <Image source={images.bg} className="absolute w-full" />
      
      <ScrollView>
        <Image source={icons.logo} className=" mx-auto mt-16 mb-12" />
      </ScrollView>
    </View>
  );
}
