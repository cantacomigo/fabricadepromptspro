import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OptimizedImageProps {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
    aspectRatio?: string
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

export default function OptimizedImage({
    src,
    alt,
    style,
    aspectRatio = '4/5',
    objectFit = 'cover'
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(false)

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
            {/* Skeleton / Placeholder */}
            <AnimatePresence>
                {!isLoaded && !error && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
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
                    padding: 20
                }}>
                    Erro ao carregar imagem
                </div>
            )}

            {/* Actual Image */}
            {!error && (
                <motion.img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        display: 'block',
                    }}
                />
            )}
        </div>
    )
}
