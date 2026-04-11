"use client";

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rectangular', width, height }: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-red-950/20 via-red-900/30 to-red-950/20 bg-[length:200%_100%] animate-shimmer';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '100%')
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-red-900/20 bg-black/40 p-4 clip-bottom-right space-y-3">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4 border border-red-900/20 bg-black/40 clip-angled">
      <Skeleton variant="circular" width="48px" height="48px" />
      <Skeleton variant="text" width="80px" className="mt-3" />
      <Skeleton variant="text" width="60px" className="mt-2" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width="32px" height="32px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </div>
      </div>
    </div>
  );
}

export function TopologySkeleton() {
  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={className}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-red-900/30"
        />
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-[#ff1a1a]"
        />
      </svg>
    </motion.div>
  );
}

export function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/10 to-transparent animate-shimmer pointer-events-none" />
  );
}
