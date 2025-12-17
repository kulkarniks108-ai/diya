import { images } from '@/constants/images';
import { Tabs } from 'expo-router';
import React from 'react';
import { ImageBackground } from 'react-native';

export default function Layout() {
    return (
        <Tabs  >
            <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
            <Tabs.Screen name="save" options={{ title: 'Favorites', headerShown: false, tabBarIcon(props) {
                return <><ImageBackground src={images.rankingGradient} /></>;
            }, }}  />
            <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false }} />
        </Tabs>
    );
}
