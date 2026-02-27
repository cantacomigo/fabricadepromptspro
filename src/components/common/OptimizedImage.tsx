import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
    const [error, setError] = useState(false)

    // Generate optimized URLs if it's Unsplash, otherwise use as-is
    const isUnsplash = src.includes('images.unsplash.com')

    // Main image - Absolute minimal quality for speed
    const mainSrc = isUnsplash
        ? `${src.split('?')[0]}?w=400&q=40&auto=format&fit=crop`
        : src

    // Low Quality Image Placeholder: tiny, low quality, blurred
    const placeholderSrc = isUnsplash
        ? `${src.split('?')[0]}?w=50&q=10&auto=format&fit=crop&blur=10`
        : null

    // Responsive srcset - simplified to avoid over-fetching
    const srcSet = isUnsplash ? `
        ${src.split('?')[0]}?w=400&q=40&auto=format&fit=crop 400w,
        ${src.split('?')[0]}?w=800&q=45&auto=format&fit=crop 800w
    ` : undefined

    // Reset state if src changes
    useEffect(() => {
        setIsLoaded(false)
        setError(false)
    }, [src])

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            ...style
        }}>
            {/* Blur-up Placeholder (Unsplash only) - Instant Display */}
            {!isLoaded && !error && placeholderSrc && (
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit,
                        filter: 'blur(10px)',
                        transform: 'scale(1.1)',
                        opacity: 0.7,
                        zIndex: 1
                    }}
                />
            )}

            {/* Skeleton CSS Shimmer */}
            {!isLoaded && !error && (
                <div className="shimmer" style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                }} />
            )}

            {/* Error State */}
            {error && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: 20,
                    zIndex: 3
                }}>
                    Erro ao carregar imagem
                </div>
            )}

            {/* Actual Image - No Framer Motion for instant start */}
            {!error && (
                <img
                    src={mainSrc}
                    srcSet={srcSet}
                    sizes={isUnsplash ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" : undefined}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding={priority ? "sync" : "async"}
                    {...(priority ? { "fetchpriority": "high" } : {})}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        display: 'block',
                        position: 'relative',
                        zIndex: isLoaded ? 4 : 0,
                        opacity: isLoaded ? 1 : 0,
                        transition: priority ? 'none' : 'opacity 0.2s ease-out'
                    }}
                />
            )}
        </div>
    )
}
