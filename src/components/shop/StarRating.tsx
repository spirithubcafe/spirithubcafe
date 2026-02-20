import { Star } from 'lucide-react';

interface Props {
  rating: number;
  count?: number;
}

export const StarRating = ({ rating, count: _count }: Props) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-amber-600">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => {
          const isFilled = index < fullStars;
          const isHalf = index === fullStars && hasHalf;
          return (
            <Star
              key={`star-${index}`}
              className={`h-4 w-4 ${isFilled || isHalf ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`}
            />
          );
        })}
      </div>

    </div>
  );
};
