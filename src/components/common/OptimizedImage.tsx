import { useState, useEffect, useRef } from 'react'

interface OptimizedImageProps {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
    aspectRatio?: string
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
    priority?: boolean
}

export default function OptimizedImage({
    src,
    alt,
    style,
    aspectRatio = '4/5',
    objectFit = 'cover',
    priority = false
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    const isUnsplash = src.includes('images.unsplash.com')
    const mainSrc = isUnsplash
        ? `${src.split('?')[0]}?w=500&q=60&auto=format&fit=crop`
        : src
    const placeholderSrc = isUnsplash
        ? `${src.split('?')[0]}?w=50&q=20&auto=format&fit=crop&blur=15`
        : null
    const srcSet = isUnsplash ? [
        `${src.split('?')[0]}?w=400&q=50&auto=format&fit=crop 400w`,
        `${src.split('?')[0]}?w=800&q=60&auto=format&fit=crop 800w`
    ].join(', ') : undefined

    // Reset state when src changes
    useEffect(() => {
        setIsLoaded(false)
        setHasError(false)
    }, [src])

    // Check if image is already in browser cache on mount
    useEffect(() => {
        const img = imgRef.current
        if (!img) return
        if (img.complete && img.naturalWidth > 0) {
            setIsLoaded(true)
            return
        }
        // Safety fallback: force display after 4 seconds regardless
        const fallback = setTimeout(() => setIsLoaded(true), 4000)
        return () => clearTimeout(fallback)
    }, [src])

    const handleLoad = () => setIsLoaded(true)
    const handleError = () => setHasError(true)

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio,
            overflow: 'hidden',
            background: '#0f0f1a',
            ...style
        }}>
            {/* Blur placeholder (Unsplash only) */}
            {!hasError && placeholderSrc && (
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit,
                        filter: 'blur(10px)',
                        transform: 'scale(1.1)',
                        opacity: isLoaded ? 0 : 0.6,
                        transition: 'opacity 0.4s ease-out',
                        zIndex: 1,
                    }}
                />
            )}

            {/* Shimmer skeleton */}
            {!isLoaded && !hasError && (
                <div className="shimmer" style={{
                    position: 'absolute', inset: 0, zIndex: 2
                }} />
            )}

            {/* Error placeholder */}
            {hasError && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 3,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', padding: 20, gap: 8
                }}>
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    <span>Imagem indisponível</span>
                </div>
            )}

            {/* Main image — always eager to avoid lazy-load onLoad issues */}
            {!hasError && (
                <img
                    ref={imgRef}
                    src={mainSrc}
                    srcSet={srcSet}
                    sizes={isUnsplash ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" : undefined}
                    alt={alt}
                    loading="eager"
                    decoding="async"
                    fetchPriority={priority ? "high" : "auto"}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit,
                        display: 'block',
                        zIndex: 4,
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-out',
                    }}
                />
            )}
        </div>
    )
}
