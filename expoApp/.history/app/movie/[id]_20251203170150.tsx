import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Movie() {

    const { id } = useLocalSearchParams();
    return (
        <View>
            <Text>the id is {id}</Text>
        </View>
    );
}
