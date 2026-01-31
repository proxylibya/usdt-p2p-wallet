import React, { useEffect, useState, useRef, ReactNode, CSSProperties } from 'react';

// ============================================
// Animation Types
// ============================================
type AnimationType = 
  | 'fade-in' | 'fade-out' | 'fade-in-up' | 'fade-in-down' | 'fade-in-left' | 'fade-in-right'
  | 'scale-in' | 'scale-out' | 'scale-in-center' | 'pop-in'
  | 'slide-in-left' | 'slide-in-right' | 'slide-in-up' | 'slide-in-down'
  | 'slide-out-left' | 'slide-out-right'
  | 'bounce-in' | 'bounce-soft'
  | 'flip-in-x' | 'flip-in-y'
  | 'modal-in' | 'modal-out';


interface BaseAnimationProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  onAnimationEnd?: () => void;
}

// ============================================
// Fade In Component
// ============================================
interface FadeInProps extends BaseAnimationProps {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  direction = 'none',
  delay = 0,
  duration,
  className = '',
  style = {},
  onAnimationEnd,
}) => {
  const animationClass = direction === 'none' 
    ? 'animate-fade-in' 
    : `animate-fade-in-${direction}`;

  return (
    <div
      className={`${animationClass} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration && { animationDuration: `${duration}ms` }),
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// Slide In Component
// ============================================
interface SlideInProps extends BaseAnimationProps {
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  delay = 0,
  duration,
  className = '',
  style = {},
  onAnimationEnd,
}) => {
  return (
    <div
      className={`animate-slide-in-${direction} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration && { animationDuration: `${duration}ms` }),
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// Scale In Component
// ============================================
interface ScaleInProps extends BaseAnimationProps {
  type?: 'normal' | 'center' | 'pop';
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  type = 'normal',
  delay = 0,
  duration,
  className = '',
  style = {},
  onAnimationEnd,
}) => {
  const animationClass = type === 'normal' 
    ? 'animate-scale-in' 
    : type === 'center' 
    ? 'animate-scale-in-center' 
    : 'animate-pop-in';

  return (
    <div
      className={`${animationClass} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration && { animationDuration: `${duration}ms` }),
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// Bounce In Component
// ============================================
export const BounceIn: React.FC<BaseAnimationProps> = ({
  children,
  delay = 0,
  duration,
  className = '',
  style = {},
  onAnimationEnd,
}) => {
  return (
    <div
      className={`animate-bounce-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration && { animationDuration: `${duration}ms` }),
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// Flip In Component
// ============================================
interface FlipInProps extends BaseAnimationProps {
  axis?: 'x' | 'y';
}

export const FlipIn: React.FC<FlipInProps> = ({
  children,
  axis = 'x',
  delay = 0,
  duration,
  className = '',
  style = {},
  onAnimationEnd,
}) => {
  return (
    <div
      className={`animate-flip-in-${axis} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration && { animationDuration: `${duration}ms` }),
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// ============================================
// Staggered Children Component
// ============================================
interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  animation?: AnimationType;
  className?: string;
  itemClassName?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 50,
  animation = 'fade-in-up',
  className = '',
  itemClassName = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={`animate-${animation} opacity-0 ${itemClassName}`}
          style={{ animationDelay: `${index * staggerDelay}ms`, animationFillMode: 'forwards' }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// ============================================
// Page Transition Component
// ============================================
interface PageTransitionProps extends BaseAnimationProps {
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'pop';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  animation = 'fade',
  className = '',
  style = {},
}) => {
  const animationMap = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-fade-in-up',
    'slide-left': 'animate-fade-in-left',
    scale: 'animate-scale-in',
    pop: 'animate-pop-in',
  };

  return (
    <div className={`${animationMap[animation]} ${className}`} style={style}>
      {children}
    </div>
  );
};

// ============================================
// Animated Card Component
// ============================================
interface AnimatedCardProps extends BaseAnimationProps {
  hover?: boolean;
  glow?: boolean;
  glowColor?: 'yellow' | 'success' | 'error';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  hover = true,
  glow = false,
  glowColor = 'yellow',
  className = '',
  style = {},
}) => {
  const glowClass = glow 
    ? glowColor === 'yellow' 
      ? 'animate-glow' 
      : glowColor === 'success' 
      ? 'animate-glow-success' 
      : 'animate-glow-error'
    : '';

  const hoverClass = hover 
    ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-yellow/10 hover:border-brand-yellow/50' 
    : '';

  return (
    <div
      className={`animate-fade-in-up transition-all duration-300 ease-out ${hoverClass} ${glowClass} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
};

// ============================================
// Animated Modal Component
// ============================================
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`fixed inset-0 bg-black/60 ${isClosing ? 'animate-fade-out' : 'animate-backdrop-in'}`}
        onClick={onClose}
      />
      <div
        className={`relative z-10 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================
// Animated Drawer Component
// ============================================
interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

export const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const slideIn = position === 'left' ? 'animate-drawer-left' : 'animate-drawer-right';
  const slideOut = position === 'left' ? 'animate-slide-out-left' : 'animate-slide-out-right';

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`fixed inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-backdrop-in'}`}
        onClick={onClose}
      />
      <div
        className={`fixed ${position}-0 top-0 h-full ${isClosing ? slideOut : slideIn} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================
// Animated Counter Component
// ============================================
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    previousValue.current = value;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        startTime.current = null;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <span className={`animate-count-up ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

// ============================================
// Skeleton Loader Component
// ============================================
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  rounded = 'md',
  className = '',
}) => {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-gradient-to-r from-background-tertiary via-background-secondary to-background-tertiary bg-[length:200%_100%] animate-shimmer ${roundedClass[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

// ============================================
// Skeleton Card Component
// ============================================
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-background-secondary p-6 rounded-xl border border-border-divider ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1">
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={100} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton width="30%" height={32} />
        <Skeleton width="30%" height={32} />
      </div>
    </div>
  );
};

// ============================================
// Skeleton Table Component
// ============================================
export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
  rows = 5, 
  cols = 4,
  className = '' 
}) => {
  return (
    <div className={`bg-background-secondary rounded-xl border border-border-divider overflow-hidden ${className}`}>
      <div className="bg-background-tertiary p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100 / cols}%`} height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4 border-t border-border-divider">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================
// Ripple Button Component
// ============================================
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples([...ripples, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
  };

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${variantClasses[variant]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </button>
  );
};

// ============================================
// Animated Progress Bar Component
// ============================================
interface AnimatedProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: 'yellow' | 'success' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  indeterminate?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  color = 'yellow',
  size = 'md',
  className = '',
  indeterminate = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    yellow: 'bg-brand-yellow',
    success: 'bg-status-success',
    error: 'bg-status-error',
    info: 'bg-status-info',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-background-tertiary rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {indeterminate ? (
          <div className={`h-full w-1/4 ${colorClasses[color]} animate-progress-indeterminate`} />
        ) : (
          <div
            className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      {showLabel && !indeterminate && (
        <span className="text-xs text-text-secondary mt-1">{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

// ============================================
// Pulse Indicator Component
// ============================================
interface PulseIndicatorProps {
  color?: 'yellow' | 'success' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  color = 'success',
  size = 'md',
  className = '',
}) => {
  const colorClasses = {
    yellow: 'bg-brand-yellow',
    success: 'bg-status-success',
    error: 'bg-status-error',
    info: 'bg-status-info',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <span className={`relative flex ${sizeClasses[size]} ${className}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} />
    </span>
  );
};

// ============================================
// Animated Badge Component
// ============================================
interface AnimatedBadgeProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  pulse?: boolean;
  className?: string;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = 'info',
  pulse = false,
  className = '',
}) => {
  const variantClasses = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${pulse ? 'animate-pulse-soft' : ''} ${className}`}>
      {children}
    </span>
  );
};

// ============================================
// Intersection Observer Hook for Scroll Animations
// ============================================
export const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// ============================================
// Scroll Animated Component
// ============================================
interface ScrollAnimatedProps extends BaseAnimationProps {
  animation?: AnimationType;
  threshold?: number;
}

export const ScrollAnimated: React.FC<ScrollAnimatedProps> = ({
  children,
  animation = 'fade-in-up',
  threshold = 0.1,
  delay = 0,
  className = '',
  style = {},
}) => {
  const { ref, isVisible } = useScrollAnimation(threshold);

  return (
    <div
      ref={ref}
      className={`${isVisible ? `animate-${animation}` : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
};

// ============================================
// Animated Tooltip Component
// ============================================
interface AnimatedTooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  children,
  content,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 px-3 py-2 text-sm text-text-primary bg-background-tertiary border border-border-divider rounded-lg shadow-lg whitespace-nowrap animate-fade-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ============================================
// Loading Spinner Component
// ============================================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'yellow' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'yellow',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    yellow: 'border-brand-yellow border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-text-secondary border-t-transparent',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

// ============================================
// Page Loading Component
// ============================================
export const PageLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-text-secondary animate-pulse-soft">Loading...</p>
    </div>
  );
};

// Export all
export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  FlipIn,
  StaggeredList,
  PageTransition,
  AnimatedCard,
  AnimatedModal,
  AnimatedDrawer,
  AnimatedCounter,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  RippleButton,
  AnimatedProgress,
  PulseIndicator,
  AnimatedBadge,
  ScrollAnimated,
  AnimatedTooltip,
  LoadingSpinner,
  PageLoading,
  useScrollAnimation,
};
