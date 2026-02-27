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

    // Generate optimized Unsplash URLs
    // Main image: format, good quality, specific width
    const mainSrc = `${src.split('?')[0]}?w=800&q=75&auto=format&fit=crop`

    // Low Quality Image Placeholder: tiny, low quality, blurred
    const placeholderSrc = `${src.split('?')[0]}?w=50&q=10&auto=format&fit=crop&blur=10`

    // Responsive srcset for retina displays
    const srcSet = `
        ${src.split('?')[0]}?w=400&q=70&auto=format&fit=crop 400w,
        ${src.split('?')[0]}?w=800&q=75&auto=format&fit=crop 800w,
        ${src.split('?')[0]}?w=1200&q=70&auto=format&fit=crop 1200w
    `

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
            {/* Blur-up Placeholder */}
            {!isLoaded && !error && (
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
                        transform: 'scale(1.1)', // Prevent white edges from blur
                        opacity: 0.7,
                        zIndex: 1
                    }}
                />
            )}

            {/* Skeleton / Pulse Overlay */}
            <AnimatePresence>
                {!isLoaded && !error && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 2,
                            background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)',
                            backgroundSize: '200% 100%',
                        }}
                        animate={{
                            backgroundPosition: ['200% 0', '-200% 0'],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                )}
            </AnimatePresence>

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

            {/* Actual Image */}
            {!error && (
                <motion.img
                    src={mainSrc}
                    srcSet={srcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding={priority ? "sync" : "async"}
                    {...(priority ? { fetchpriority: "high" } : {})}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        display: 'block',
                        position: 'relative',
                        zIndex: isLoaded ? 4 : 0
                    }}
                />
            )}
        </div>
    )
}
