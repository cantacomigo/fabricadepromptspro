import { Wallet } from '@mercadopago/sdk-react'
import { motion } from 'framer-motion'
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface MercadoPagoCheckoutProps {
    preferenceId: string
    onReady?: () => void
    onError?: (error: any) => void
}

export default function MercadoPagoCheckout({ preferenceId, onReady, onError }: MercadoPagoCheckoutProps) {
    const [isReady, setIsReady] = useState(false)
    const [hasError, setHasError] = useState(false)

    const handleReady = () => {
        setIsReady(true)
        onReady?.()
    }

    const handleError = (error: any) => {
        console.error('Mercado Pago SDK Error:', error)
        setHasError(true)
        onError?.(error)
    }

    // Direct fallback link in case the component fails to render
    const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', marginTop: 20 }}
        >
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                alignItems: 'center',
                textAlign: 'center'
            }}>
                {!isReady && !hasError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.6)' }}>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Carregando checkout seguro...</span>
                    </div>
                )}

                {hasError && (
                    <div style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={20} />
                        <span>Ocorreu um erro ao carregar o botão oficial.</span>
                    </div>
                )}

                <div style={{
                    width: '100%',
                    display: isReady && !hasError ? 'block' : 'none',
                    minHeight: 48
                }}>
                    <Wallet
                        initialization={{ preferenceId }}
                        onReady={handleReady}
                        onError={handleError}
                        customization={{
                            valueProp: 'security_details',
                        }}
                    />
                </div>

                {/* Always show or show as fallback the direct link */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Se o botão acima não carregar, use o link direto:
                    </p>
                    <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            padding: '12px 20px',
                            background: '#009ee3',
                            color: 'white',
                            borderRadius: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                    >
                        Pagar com Mercado Pago <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </motion.div>
    )
}
