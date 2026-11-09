import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import { useDeviceTier, useOnScreen, usePageVisible, useWebGLSupport } from '@/hooks/useDevice';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export interface SceneCanvasProps extends Omit<CanvasProps, 'children'> {
  children: ReactNode;
  /** Shown when WebGL is unavailable or the scene crashes. */
  fallback?: ReactNode;
  className?: string;
  label: string;
  /** Force a static single frame (used for reduced motion where continuous animation isn't needed). */
  staticFrame?: boolean;
}

/**
 * Wraps an R3F Canvas with the production concerns every scene needs:
 * WebGL detection + fallback, error boundary, rendering paused when off-screen or the tab is hidden,
 * capped/adaptive device pixel ratio and reduced-motion support.
 */
export function SceneCanvas({ children, fallback, className = 'relative', label, staticFrame, dpr, ...rest }: SceneCanvasProps) {
  const webgl = useWebGLSupport();
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  const wrapper = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrapper);
  const pageVisible = usePageVisible();
  const [degraded, setDegraded] = useState(false);

  const fallbackNode = fallback ?? <div className="css-starfield absolute inset-0" aria-hidden />;
  if (!webgl) return <div className={className}>{fallbackNode}</div>;

  const active = onScreen && pageVisible;
  const frameloop = !active ? 'never' : staticFrame || reduced ? 'demand' : 'always';
  const maxDpr = tier === 'low' || degraded ? 1.25 : 1.75;

  return (
    <div ref={wrapper} className={className} role="img" aria-label={label}>
      <ErrorBoundary label="3D scene" fallback={fallbackNode}>
        <Canvas
          frameloop={frameloop}
          dpr={dpr ?? [1, maxDpr]}
          gl={{ antialias: tier === 'high', powerPreference: 'high-performance', alpha: false }}
          {...rest}
        >
          <color attach="background" args={['#03040A']} />
          <PerformanceMonitor onDecline={() => setDegraded(true)} />
          <AdaptiveDpr pixelated={false} />
          {children}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
