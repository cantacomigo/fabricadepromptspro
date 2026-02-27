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

    // Main image - Balanced quality for reliability (higher than q=40)
    const mainSrc = isUnsplash
        ? `${src.split('?')[0]}?w=500&q=60&auto=format&fit=crop`
        : src

    // Low Quality Image Placeholder: tiny, low quality, blurred
    const placeholderSrc = isUnsplash
        ? `${src.split('?')[0]}?w=50&q=20&auto=format&fit=crop&blur=15`
        : null

    // Responsive srcset - updated to match new base quality
    const srcSet = isUnsplash ? `
        ${src.split('?')[0]}?w=400&q=50&auto=format&fit=crop 400w,
        ${src.split('?')[0]}?w=800&q=60&auto=format&fit=crop 800w
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
            background: 'rgba(255,255,255,0.03)', // Faint background to avoid "pure black"
            ...style
        }}>
            {/* Blur-up Placeholder (Unsplash only) - Layered behind */}
            {!error && placeholderSrc && (
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
                        opacity: isLoaded ? 0 : 0.7,
                        zIndex: 1,
                        transition: 'opacity 0.4s ease-out'
                    }}
                />
            )}

            {/* Skeleton Shimmer - Only visible before image starts loading */}
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

            {/* Actual Image - Resilient layering */}
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
                        zIndex: 4,
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-out'
                    }}
                />
            )}
        </div>
    )
}
