import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'

interface Props {
    imageUrl: string | null
    onClose: () => void
}

export default function ImageLightbox({ imageUrl, onClose }: Props) {
    return (
        <AnimatePresence>
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 2000,
                        background: 'rgba(0,0,0,0.92)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 40, cursor: 'zoom-out'
                    }}
                >
                    {/* Header Controls */}
                    <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 10 }}>
                        <motion.button
                            onClick={onClose}
                            style={{
                                width: 50, height: 50, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(10px)'
                            }}
                            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X size={24} />
                        </motion.button>
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <img
                            src={
                                imageUrl.includes('supabase.co/storage')
                                    ? imageUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/').split('?')[0] + '?width=1200&quality=90'
                                    : imageUrl
                            }
                            alt="Visualização"
                            style={{
                                maxWidth: '100vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 12,
                                boxShadow: '0 30px 100px rgba(0,0,0,0.8)'
                            }}
                        />

                        {/* Hint */}
                        <div style={{
                            position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
                            color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
                        }}>
                            <ZoomIn size={14} /> Clique fora para fechar
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
