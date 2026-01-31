
import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "skeleton-shimmer overflow-hidden";
  
  let variantClasses = "rounded-lg";
  if (variant === 'circular') variantClasses = "rounded-full";
  if (variant === 'text') variantClasses = "rounded-md h-4";

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}></div>
  );
};
