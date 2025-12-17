import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

import COLORS from "@/constants/colors";
import { icons } from "@/constants/icons";

function TabIcon({ focused, icon, title }: any) {
    if (focused) {
        return (
            <View
                className=" bg-accent w-24 h-12  mt-4  md:mt-0 justify-center items-center   rounded-full flex-row"
            >
                <Image source={icon} tintColor="#151312" className="size-5" />
                <Text className="text-secondary text-base font-semibold ml-2">
                    {title}
                </Text>
            </View>
        );
    }

    return (
        <View className="size-full justify-center items-center mt-4 md:mt-0 rounded-full">
            <Image source={icon} tintColor="#A8B5DB" className="size-5" />
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    // flex: 1,
                    // justifyContent: "center",
                    // alignItems: "center",
                    // borderColor:"green",
                    // borderWidth: 2

                },
                
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderRadius: 50,
                    marginHorizontal: 20,
                    // marginHorizontal: "auto",
                    marginBottom: 36,
                    height: 52,
                    maxWidth: 400,
                    position: "absolute",
                    // centre it
                    // left: 0,
                    // right: 0,
                    
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "transparent",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "index",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} title="Home" />
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.search} title="Search" />
                    ),
                }}
            />

            <Tabs.Screen
                name="save"
                options={{
                    title: "Save",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.save} title="Save" />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.person} title="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}