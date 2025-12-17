import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Text } from 'react-native';

export default function Layout() {
    return (
        <Tabs  >
            <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
            <Tabs.Screen name="save" options={{
                title: 'Favorites', headerShown: false, tabBarIcon(props) {
                    return <>
                        <ImageBackground className='border border-red-700 p-1  w-9'  source={images.highlight} >
                            <Image source={icons.home} />
                           <Text>Fav</Text>
                        </ImageBackground>
                    </>;
                },
            }} />
            <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false }} />
        </Tabs>
    );
}
