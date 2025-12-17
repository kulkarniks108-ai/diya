import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function MovieCard({ title }: Movie) {
    return (
        <View>

        <Link href={`/movies/${title}`} >
            <Text className="text-primary-foreground" >{title}</Text>
        </Link>

        </View>
    );
}
