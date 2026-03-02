import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, List, ShoppingBag, Trash2, Edit3, Check, X, Upload, DollarSign, TrendingUp, Package, CheckCircle2, Clock, Star } from 'lucide-react'
import { usePrompts } from '../contexts/PromptsContext'
import { useAuth } from '../contexts/AuthContext'
import type { Prompt } from '../lib/data'

type Tab = 'add' | 'manage' | 'categories' | 'sales' | 'settings'

export default function Admin() {
    const { prompts, categories, addPrompt, updatePrompt, deletePrompt, addCategory, deleteCategory, uploadImage, migrateImagesToStorage } = usePrompts()
    const { purchases, confirmPurchase, user, updateProfile, updatePassword } = useAuth()
    const [tab, setTab] = useState<Tab>('add')
    const [isMigrating, setIsMigrating] = useState(false)
    const [migrationResult, setMigrationResult] = useState<{ total: number, migrated: number, errors: number } | null>(null)
    const [uploading, setUploading] = useState(false)

    // Settings state
    const [newName, setNewName] = useState(user?.displayName || '')
    const [newPass, setNewPass] = useState('')
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const [loadingSettings, setLoadingSettings] = useState(false)

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingSettings(true)
        setSaveStatus(null)
        try {
            await updateProfile(newName)
            setSaveStatus({ type: 'success', msg: 'Perfil atualizado com sucesso!' })
        } catch (err: any) {
            setSaveStatus({ type: 'error', msg: err.message || 'Erro ao atualizar perfil' })
        } finally {
            setLoadingSettings(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPass.length < 6) return setSaveStatus({ type: 'error', msg: 'A senha deve ter pelo menos 6 caracteres' })
        setLoadingSettings(true)
        setSaveStatus(null)
        try {
            await updatePassword(newPass)
            setSaveStatus({ type: 'success', msg: 'Senha alterada com sucesso!' })
            setNewPass('')
        } catch (err: any) {
            setSaveStatus({ type: 'error', msg: err.message || 'Erro ao alterar senha' })
        } finally {
            setLoadingSettings(false)
        }
    }
    const [editId, setEditId] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [newCat, setNewCat] = useState('')
    const [form, setForm] = useState<{
        title: string; description: string; prompt: string;
        price: string; category: string; imageUrl: string; tags: string
    }>({ title: '', description: '', prompt: '', price: '4.90', category: categories[0] || '', imageUrl: '', tags: '' })
    const [saved, setSaved] = useState(false)

    // Filter duplicate purchases from the same checkout (multiple attempts)
    const uniquePurchases = purchases.reduce((acc: any[], current) => {
        // If it doesn't have a preference ID, it's a legacy or failed entry, keep it for now
        if (!current.mp_preference_id) {
            acc.push(current);
            return acc;
        }
        // If we already have this preference ID, skip it
        const x = acc.find(item => item.mp_preference_id === current.mp_preference_id);
        if (!x) {
            acc.push(current);
        }
        return acc;
    }, []);

    const pendingPurchases = uniquePurchases.filter(p => p.status === 'pending')
    const confirmedPurchases = uniquePurchases.filter(p => p.status === 'confirmed')
    const totalRevenue = confirmedPurchases.reduce((a, p) => a + p.amount, 0)

    const resetForm = () => {
        setForm({ title: '', description: '', prompt: '', price: '4.90', category: categories[0] || '', imageUrl: '', tags: '' })
        setEditId(null)
    }

    const startEdit = (p: Prompt) => {
        setForm({
            title: p.title, description: p.description, prompt: p.prompt,
            price: p.price.toString(), category: p.category, imageUrl: p.imageUrl,
            tags: p.tags.join(', ')
        })
        setEditId(p.id)
        setTab('add')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const data = {
            title: form.title, description: form.description, prompt: form.prompt,
            price: parseFloat(form.price), category: form.category, imageUrl: form.imageUrl,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            likesCount: 0
        }
        if (editId) {
            updatePrompt(editId, data)
        } else {
            addPrompt(data)
        }
        setSaved(true)
        setTimeout(() => { setSaved(false); resetForm() }, 1500)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const publicUrl = await uploadImage(file)
            setForm(prev => ({ ...prev, imageUrl: publicUrl }))
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Falha no upload da imagem. Certifique-se de que o bucket "prompts" existe no Supabase.')
        } finally {
            setUploading(false)
        }
    }

    const handleMigration = async () => {
        if (!confirm('Isso irá mover todas as imagens em base64 do banco de dados para o Supabase Storage. Deseja continuar?')) return
        setIsMigrating(true)
        setMigrationResult(null)
        try {
            const result = await migrateImagesToStorage()
            setMigrationResult(result)
        } catch (err) {
            console.error('Migration failed:', err)
        } finally {
            setIsMigrating(false)
        }
    }

    const handleConfirm = (purchaseId: string) => {
        confirmPurchase(purchaseId)
    }

    const prompts4Sale = (purchaseId: string) => purchases.find(p => p.id === purchaseId)

    const getPromptTitle = (promptId: string) => prompts.find(p => p.id === promptId)?.title || 'Prompt'

    const tabs: [Tab, string, React.ReactNode, number?][] = [
        ['add', editId ? 'Editar Prompt' : 'Adicionar Prompt', <Plus size={15} key="a" />],
        ['manage', 'Gerenciar', <List size={15} key="b" />, prompts.length],
        ['categories', 'Categorias', <Package size={15} key="d" />, categories.length],
        ['sales', 'Vendas', <ShoppingBag size={15} key="c" />, pendingPurchases.length || undefined],
        ['settings', 'Configurações', <Star size={15} key="e" />],
    ]

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
            {/* Header */}
            <div style={{ marginBottom: 36 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9333ea' }} />
                    <span style={{ fontSize: 12, color: '#9333ea', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Painel Administrativo</span>
                </div>
                <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'white' }}>Admin Dashboard</h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Gerencie prompts, preços e confirme pagamentos</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                    { icon: <Package size={18} color="#9333ea" />, value: prompts.length, label: 'Prompts', color: '#9333ea' },
                    { icon: <CheckCircle2 size={18} color="#10b981" />, value: confirmedPurchases.length, label: 'Vendas', color: '#10b981' },
                    { icon: <Clock size={18} color="#f59e0b" />, value: pendingPurchases.length, label: 'Pendentes', color: '#f59e0b' },
                    { icon: <TrendingUp size={18} color="#3b82f6" />, value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, label: 'Receita', color: '#3b82f6' },
                ].map(stat => (
                    <div key={stat.label} style={{ padding: '18px 20px', borderRadius: 14, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {stat.icon}
                        <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, margin: '8px 0 4px' }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 28, flexWrap: 'wrap' }}>
                {tabs.map(([t, label, icon, badge]) => (
                    <motion.button key={t} onClick={() => setTab(t)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: '1',
                            background: tab === t ? 'rgba(147,51,234,0.25)' : 'transparent',
                            border: tab === t ? '1px solid rgba(147,51,234,0.4)' : '1px solid transparent',
                            color: tab === t ? 'white' : 'rgba(255,255,255,0.5)', position: 'relative'
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {icon} {label}
                        {badge !== undefined && badge > 0 && (
                            <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 10, background: '#f59e0b', color: '#000', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                                {badge}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ADD / EDIT */}
                {tab === 'add' && (
                    <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ padding: 32, borderRadius: 20, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: 'white' }}>
                                {editId ? '✏️ Editar Prompt' : '➕ Novo Prompt'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <FormField label="Título" required>
                                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                            placeholder="Ex: Cidade Cyberpunk Neon" required style={inputSt} />
                                    </FormField>
                                    <FormField label="Categoria">
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputSt}>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </FormField>
                                </div>

                                <FormField label="Descrição" mt>
                                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="Breve descrição da imagem/estilo" style={inputSt} />
                                </FormField>

                                <FormField label="Prompt Completo" mt required>
                                    <textarea value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })}
                                        placeholder="Cole aqui o prompt completo..." required rows={5}
                                        style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }} />
                                </FormField>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                                    <FormField label={<><DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />Preço (R$)</>} required>
                                        <input type="number" step="0.01" min="0.01" value={form.price}
                                            onChange={e => setForm({ ...form, price: e.target.value })}
                                            placeholder="4.90" required style={inputSt} />
                                    </FormField>
                                    <FormField label="Tags (separe por vírgula)">
                                        <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                                            placeholder="cyberpunk, neon, cidade" style={inputSt} />
                                    </FormField>
                                </div>

                                <FormField label={<><Upload size={12} style={{ display: 'inline', marginRight: 4 }} />Imagem do Prompt</>} mt required>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                            />
                                            <div style={{ ...inputSt, textAlign: 'center', pointerEvents: 'none', borderStyle: 'dashed', borderColor: 'rgba(147,51,234,0.4)', background: 'rgba(147,51,234,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                {uploading ? 'Enviando...' : <><Upload size={14} /> Upload Arquivo</>}
                                            </div>
                                        </div>
                                        <input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                            placeholder="Ou cole a URL aqui..." style={inputSt} />
                                    </div>

                                    {form.imageUrl && (
                                        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                                <button type="button" onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                                                    style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </FormField>

                                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                                    <motion.button type="submit"
                                        style={{
                                            flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                                            background: saved ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                            border: saved ? '1px solid rgba(16,185,129,0.5)' : 'none',
                                            color: saved ? '#10b981' : 'white', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        {saved ? <><Check size={16} /> Salvo com sucesso!</> : <>{editId ? <><Edit3 size={16} /> Salvar alterações</> : <><Plus size={16} /> Publicar prompt</>}</>}
                                    </motion.button>
                                    {editId && (
                                        <motion.button type="button" onClick={resetForm}
                                            style={{ padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                                            whileHover={{ color: 'white' }} whileTap={{ scale: 0.98 }}
                                        >
                                            <X size={16} />
                                        </motion.button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* MANAGE */}
                {tab === 'manage' && (
                    <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {prompts.map(p => (
                                <div key={p.id} style={{ padding: '16px 20px', borderRadius: 14, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <img src={p.imageUrl} alt={p.title} style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 4 }}>{p.title}</div>
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                            <span>🏷️ {p.category}</span>
                                            <span>💰 R$ {p.price.toFixed(2).replace('.', ',')}</span>
                                            <span>🔥 {p.salesCount} vendas</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <motion.button onClick={() => startEdit(p)}
                                            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Edit3 size={12} /> Editar
                                        </motion.button>
                                        {deleteConfirm === p.id ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <motion.button onClick={() => { deletePrompt(p.id); setDeleteConfirm(null) }}
                                                    style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                                                    whileTap={{ scale: 0.95 }}>Confirmar</motion.button>
                                                <motion.button onClick={() => setDeleteConfirm(null)}
                                                    style={{ padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                                                    whileTap={{ scale: 0.95 }}><X size={13} /></motion.button>
                                            </div>
                                        ) : (
                                            <motion.button onClick={() => setDeleteConfirm(p.id)}
                                                style={{ padding: '7px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer' }}
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Trash2 size={14} />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* CATEGORIES */}
                {tab === 'categories' && (
                    <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ padding: 32, borderRadius: 20, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
                            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: 'white' }}>➕ Adicionar Categoria</h2>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <input
                                    value={newCat}
                                    onChange={e => setNewCat(e.target.value)}
                                    placeholder="Nome da categoria..."
                                    style={inputSt}
                                />
                                <motion.button
                                    onClick={() => {
                                        if (newCat.trim()) {
                                            addCategory(newCat.trim())
                                            setNewCat('')
                                        }
                                    }}
                                    style={{
                                        padding: '0 24px', borderRadius: 10, background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                                        border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer'
                                    }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                >
                                    Adicionar
                                </motion.button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {categories.map(cat => (
                                <div key={cat} style={{ padding: '14px 20px', borderRadius: 12, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'white' }}>{cat}</span>
                                    <motion.button
                                        onClick={() => deleteCategory(cat)}
                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                                        whileHover={{ scale: 1.2 }}
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* SALES */}
                {tab === 'sales' && (
                    <motion.div key="sales" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {pendingPurchases.length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={16} /> Pendentes de confirmação ({pendingPurchases.length})
                                </h3>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {pendingPurchases.map(purchase => (
                                        <div key={purchase.id} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: 'white', marginBottom: 3 }}>{getPromptTitle(purchase.promptId)}</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span>👤 {purchase.customerName || 'Cliente'} ({purchase.customerEmail || purchase.userId})</span>
                                                    <span>📅 {new Date(purchase.createdAt).toLocaleString('pt-BR')}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>R$ {purchase.amount.toFixed(2).replace('.', ',')}</div>
                                                <motion.button onClick={() => handleConfirm(purchase.id)}
                                                    style={{
                                                        padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                                        border: 'none', color: 'white', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}
                                                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    <Check size={15} /> Confirmar Pagamento
                                                </motion.button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={16} color="#10b981" /> Vendas confirmadas ({confirmedPurchases.length})
                        </h3>
                        {confirmedPurchases.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Nenhuma venda confirmada ainda</div>
                        ) : (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {confirmedPurchases.map(purchase => (
                                    <div key={purchase.id} style={{ padding: '14px 20px', borderRadius: 12, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'white', marginBottom: 3 }}>{getPromptTitle(purchase.promptId)}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <span>👤 {purchase.customerName || 'Cliente'} ({purchase.customerEmail || purchase.userId})</span>
                                                <span>📅 {new Date(purchase.createdAt).toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ fontWeight: 700, color: 'white' }}>R$ {purchase.amount.toFixed(2).replace('.', ',')}</div>
                                            <div style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Pago</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* SETTINGS */}
                {tab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ maxWidth: 500 }}
                    >
                        <div style={{ background: '#0f0f1a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', padding: 32 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 24 }}>Minhas Configurações</h2>

                            {saveStatus && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 14,
                                        background: saveStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                        color: saveStatus.type === 'success' ? '#10b981' : '#ef4444'
                                    }}
                                >
                                    {saveStatus.msg}
                                </motion.div>
                            )}

                            <form onSubmit={handleUpdateProfile} style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Nome Administrativo</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input value={newName} onChange={e => setNewName(e.target.value)}
                                        style={inputSt} />
                                    <motion.button type="submit" disabled={loadingSettings}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #9333ea, #3b82f6)', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: loadingSettings ? 'not-allowed' : 'pointer' }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        {loadingSettings ? '...' : 'Salvar'}
                                    </motion.button>
                                </div>
                            </form>

                            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />

                            <form onSubmit={handleUpdatePassword}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Alterar Senha de Admin</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)"
                                        style={inputSt} />
                                    <motion.button type="submit" disabled={loadingSettings}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 700, cursor: loadingSettings ? 'not-allowed' : 'pointer' }}
                                        whileHover={{ background: 'rgba(255,255,255,0.12)' }} whileTap={{ scale: 0.98 }}
                                    >
                                        {loadingSettings ? '...' : 'Atualizar'}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '32px 0' }} />

                        <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                🚀 Otimização de Imagens
                            </h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                                Migre as imagens atuais do banco de dados para o Storage para um carregamento instantâneo.
                            </p>

                            {migrationResult ? (
                                <div style={{ fontSize: 13, color: '#10b981', marginBottom: 16, padding: '10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)' }}>
                                    ✅ Migração concluída: {migrationResult.migrated} de {migrationResult.total} imagens processadas.
                                    {migrationResult.errors > 0 && ` (${migrationResult.errors} erros)`}
                                </div>
                            ) : null}

                            <motion.button
                                onClick={handleMigration}
                                disabled={isMigrating}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: 10,
                                    background: isMigrating ? 'rgba(255,255,255,0.1)' : '#9333ea',
                                    color: 'white', fontSize: 14, fontWeight: 700, border: 'none',
                                    cursor: isMigrating ? 'not-allowed' : 'pointer'
                                }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            >
                                {isMigrating ? 'Migrando...' : 'Iniciar Migração para Storage'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function FormField({ label, children, required = false, mt = false }: {
    label: React.ReactNode; children: React.ReactNode; required?: boolean; mt?: boolean
}) {
    return (
        <div style={{ marginTop: mt ? 20 : 0 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                {label}{required && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
            </label>
            {children}
        </div>
    )
}

const inputSt: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box'
}
