import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function MovieCard({ title }: Movie) {
    return (
        <View>

        <Link href={`/movies/${title}`} asChild>
            <TouchableOpacity>
                <Text className="text-primary-foreground">{title}</Text>
            </TouchableOpacity>
        </Link>

        </View>
    );
}
