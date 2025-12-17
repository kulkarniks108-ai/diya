import SearchBar from "@/components/searchBar";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

export default function Index() {

  const router = useRouter();


  return (
    <View className="bg-primary flex-1"  >
      <Image source={images.bg} className="absolute w-full" />

      <ScrollView className="px-5  " showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }} >
        <Image source={icons.logo} className=" mx-auto mt-16 mb-12" />

        <SearchBar
          onPress={() => {
            router.push("/search");
          }}
          placeholder="Search for a movie"
        />

       <Text className="  " >Hiii</Text>
      </ScrollView>
    </View>
  );
}
