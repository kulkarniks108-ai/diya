import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import { movies } from "@/constants/fakeData";
import { Link, useRouter } from "expo-router";
import { FlatList, ScrollView, View } from "react-native";

export default function Index() {

  const router = useRouter();


  return (
    <View className="bg-bg flex-1"  >
      {/* <Image source={images.bg} className="absolute w-full" />. */}


      <ScrollView className="px-5  " showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }} >
        {/* <Image source={icons.logo} className=" mx-auto mt-16 mb-12" /> */}

        {/* //temp links */}
        <View className="flex-row justify-center gap-4 mt-10 text-primary-foreground ">
          <Link href="/(auth)" className="p-1 bg-primary text-white rounded-xl" >Login</Link>
          <Link href="/(auth)/signup" className="" >Signup</Link>
        </View>


        <SearchBar
          onPress={() => {
            router.push("/search");
          }}
          placeholder="Search for a movie"
        />

        <FlatList
          data={movies}
          renderItem={({ item }) => (<MovieCard {...item} />)}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          columnWrapperStyle={{
            justifyContent: "flex-start",
            gap: 20,
            paddingRight: 5,
            marginBottom: 10,
          }}
          className="mt-2 pb-32"
          contentContainerStyle={{ marginTop: 20 }}
          scrollEnabled={false}
        // ListHeaderComponent={<Text className="text-primary-foreground" >HIi</Text>}
        />



      </ScrollView>
    </View>
  );
}
