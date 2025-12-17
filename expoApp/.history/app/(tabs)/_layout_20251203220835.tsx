import { Tabs } from 'expo-router';
import React from 'react';

export default function Layout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
            <Tabs.Screen name="save" options={{ title: 'Favorites', headerShown: false, tabBarIcon(props) {
                return <>hi</>;
            }, }}  />
            <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false }} />
        </Tabs>
    );
}
