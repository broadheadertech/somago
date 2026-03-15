import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  size = "sm",
  showValue = false,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half = !filled && rating > i && rating < i + 1;
    return { filled, half };
  });

  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star, i) => (
        <svg
          key={i}
          className={cn(
            sizeClass,
            star.filled
              ? "text-accent-yellow"
              : star.half
                ? "text-accent-yellow"
                : "text-neutral-300"
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {star.half ? (
            <>
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="#D6D3D1" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#half-${i})`}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </>
          ) : (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          )}
        </svg>
      ))}
      {showValue && (
        <span className="ml-1 text-xs text-neutral-500">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
