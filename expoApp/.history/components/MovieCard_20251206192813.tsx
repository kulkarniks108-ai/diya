import { Link } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';

export default function MovieCard({ title, poster_path }: Movie) {
    return (

        <Link href={`/movies/${title}`} asChild>
            <TouchableOpacity className='w-[30%] ' >
                <Image source={{uri: poster_path}} className='w-full h-52 rounded-md ' resizeMode='cover' />
                <Text numberOfLines={3} className='text-white mt-2 text-sm font-medium' numberOfLines={2} >{title}</Text>
            </TouchableOpacity>
           
        </Link>

    );
}
