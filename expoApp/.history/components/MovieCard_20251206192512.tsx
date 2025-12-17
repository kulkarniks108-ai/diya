import { Link } from 'expo-router';
import React from 'react';
import { Image, TouchableOpacity } from 'react-native';

export default function MovieCard({ title, poster_path }: Movie) {
    return (

        <Link href={`/movies/${title}`} asChild>
            <TouchableOpacity className='w-[30%] bg-red-400' >
                <Image source={{uri: poster_path}} className='w-full h-52' resizeMode='cover' />l
            </TouchableOpacity>
           
        </Link>

    );
}
