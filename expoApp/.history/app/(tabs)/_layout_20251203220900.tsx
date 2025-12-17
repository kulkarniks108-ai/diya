import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function Layout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
            <Tabs.Screen name="save" options={{ title: 'Favorites', headerShown: false, tabBarIcon(props) {
                return <><Text>HI</Text></>;
            }, }}  />
            <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false }} />
        </Tabs>
    );
}
