'use client';

import Link from 'next/link';
import { Category } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl = getImageUrl(category.image);

  return (
    <Link href={`/menu?category=${category.category_slug}`} className="group">
      <div className="relative rounded-xl overflow-hidden h-40 bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.category_name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
            <span className="text-white text-4xl font-bold">
              {category.category_name.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg">{category.category_name}</h3>
          {category.description && (
            <p className="text-white/80 text-sm line-clamp-1">{category.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
