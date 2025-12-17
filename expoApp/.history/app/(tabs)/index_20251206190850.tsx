import SearchBar from "@/components/SearchBar";
import { movies } from "@/constants/fakeData";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";
import { FlatList, Image, ScrollView, Text, View } from "react-native";

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

        <FlatList
          data={movies}
          renderItem={({ item }) => (<Text className="text-primary-foreground" >{item.title}</Text>)}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          // columnWrapperStyle={{ justifyContent: "space-between", marginTop: 20 }}
          contentContainerStyle={{ marginTop: 20, rowGap: 20 , backgroundColor:"red"}}
        />



      </ScrollView>
    </View>
  );
}
