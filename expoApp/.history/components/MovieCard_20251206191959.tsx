import { Link } from 'expo-router';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

export default function MovieCard({ title, poster_path }: Movie) {
    return (
        <View>

        <Link href={`/movies/${title}`} asChild>
            <TouchableOpacity>
                <Image source={{uri: poster_path}} className="w-full h-52 rounded-lg"
          resizeMode="cover"/>
            </TouchableOpacity>
           
        </Link>

        </View>
    );
}
