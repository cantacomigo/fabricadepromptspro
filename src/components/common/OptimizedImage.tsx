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

/**
 * Converts a Supabase Storage public URL to a transformation URL.
 * e.g. .../storage/v1/object/public/bucket/img.jpg
 *   -> .../storage/v1/render/image/public/bucket/img.jpg?width=W&quality=Q
 *
 * Supabase automatically serves WebP when the browser supports it.
 * This is only available on Pro Plan and above.
 */
function getSupabaseTransformUrl(src: string, width: number, quality = 75): string {
    // Only transform Supabase storage URLs
    if (!src.includes('supabase.co/storage')) return src

    try {
        // Replace /object/ with /render/image/ in the path
        const transformed = src
            .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
            .split('?')[0] // strip any existing query params
        return `${transformed}?width=${width}&quality=${quality}`
    } catch {
        return src
    }
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
    const isSupabase = src.includes('supabase.co/storage')

    // Compute the optimized src
    let mainSrc = src
    let srcSet: string | undefined = undefined
    let placeholderSrc: string | null = null

    if (isUnsplash) {
        const base = src.split('?')[0]
        mainSrc = `${base}?w=500&q=70&auto=format&fit=crop`
        placeholderSrc = `${base}?w=30&q=10&auto=format&fit=crop&blur=15`
        srcSet = `${base}?w=400&q=65&auto=format&fit=crop 400w, ${base}?w=800&q=75&auto=format&fit=crop 800w`
    } else if (isSupabase) {
        // Use Supabase Image Transformation — serves WebP automatically!
        mainSrc = getSupabaseTransformUrl(src, 500, 75)
        srcSet = [
            `${getSupabaseTransformUrl(src, 400, 70)} 400w`,
            `${getSupabaseTransformUrl(src, 800, 80)} 800w`,
        ].join(', ')
    }

    // Reset state when src changes
    useEffect(() => {
        setIsLoaded(false)
        setHasError(false)
    }, [src])

    // Check if already cached on mount
    useEffect(() => {
        const img = imgRef.current
        if (!img) return
        if (img.complete && img.naturalWidth > 0) {
            setIsLoaded(true)
            return
        }
        // Safety fallback after 6s — never leave the user staring at black
        const fallback = setTimeout(() => setIsLoaded(true), 6000)
        return () => clearTimeout(fallback)
    }, [src])

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

            {/* Error state */}
            {hasError && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 3,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 12, textAlign: 'center', padding: 20, gap: 8
                }}>
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    <span>Imagem indisponível</span>
                </div>
            )}

            {/* Main image */}
            {!hasError && (
                <img
                    ref={imgRef}
                    src={mainSrc}
                    srcSet={srcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                    alt={alt}
                    loading="eager"
                    decoding="async"
                    fetchPriority={priority ? "high" : "auto"}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        // If transform URL fails, try original URL as fallback
                        if (isSupabase && imgRef.current && imgRef.current.src !== src) {
                            imgRef.current.src = src
                        } else {
                            setHasError(true)
                        }
                    }}
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
