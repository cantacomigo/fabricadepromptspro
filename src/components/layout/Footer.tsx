import { Link } from 'react-router-dom'
import { Sparkles, Heart } from 'lucide-react'

export default function Footer() {
    return (
        <footer style={{
            background: '#0a0a12',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '40px 24px 30px'
        }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, marginBottom: 32 }}>
                    {/* Brand */}
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <img
                                src="/logo.png"
                                alt="Fábrica de Prompts"
                                style={{
                                    height: 50,
                                    width: 'auto',
                                    filter: 'drop-shadow(0 0 10px rgba(147,51,234,0.3))'
                                }}
                            />
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, maxWidth: 260, lineHeight: 1.6, margin: 0 }}>
                            A maior plataforma de prompts premium para ChatGPT do Brasil. Gere imagens extraordinárias com o poder da IA.
                        </p>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' }}>
                        <FooterCol title="Plataforma" links={[
                            { label: 'Galeria', to: '/' },
                            { label: 'Como funciona', to: '/#como-funciona' },
                            { label: 'Preços', to: '/' },
                        ]} />
                        <FooterCol title="Conta" links={[
                            { label: 'Entrar', to: '/auth' },
                            { label: 'Criar conta', to: '/auth' },
                            { label: 'Meus prompts', to: '/dashboard' },
                        ]} />
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 24,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
                        © 2025 Fábrica de Prompts. Todos os direitos reservados.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        Feito com <Heart size={13} color="#ec4899" fill="#ec4899" /> no Brasil
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterCol({ title, links }: { title: string, links: { label: string, to: string }[] }) {
    return (
        <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>{title}</div>
            {links.map(l => (
                <Link key={l.label} to={l.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                    {l.label}
                </Link>
            ))}
        </div>
    )
}
