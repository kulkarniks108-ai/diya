import { Tabs } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Tabs>

        <Tabs.Screen name="Home" options={{ title: 'Home' }} />
    </Tabs>
  );
}
