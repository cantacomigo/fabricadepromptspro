export interface Prompt {
    id: string
    title: string
    description: string
    prompt: string
    price: number
    category: string
    imageUrl: string
    salesCount: number
    likesCount: number
    rating: number
    ratingCount: number
    createdAt: number
    tags: string[]
}

export interface Purchase {
    id: string
    userId: string
    promptId: string
    amount: number
    status: 'pending' | 'confirmed'
    pixCode: string
    createdAt: number
    confirmedAt?: number
    customerName?: string
    customerEmail?: string
    mp_preference_id?: string | null
}

export interface User {
    uid: string
    email: string
    displayName?: string
    isAdmin?: boolean
    purchasedPromptIds: string[]
}

// Demo prompts data using Unsplash images
export const DEMO_PROMPTS: Omit<Prompt, 'id'>[] = [
    {
        title: "Cidade Cyberpunk Neon",
        description: "Uma metrópole futurista banhada em luzes neon, com arranha-céus e chuva ácida",
        prompt: "A sprawling cyberpunk metropolis at night, neon signs in Japanese and Portuguese reflecting off rain-slicked streets, holographic advertisements floating between massive brutalist skyscrapers, flying vehicles weaving through dense fog, volumetric lighting, cinematic atmosphere, 8K ultra-detailed, blade runner aesthetic, deep purple and cyan color palette, photorealistic rendering",
        price: 4.90,
        category: "Sci-Fi",
        imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
        salesCount: 47,
        likesCount: 12,
        rating: 4.8,
        ratingCount: 23,
        createdAt: Date.now() - 86400000 * 5,
        tags: ["cyberpunk", "neon", "cidade", "sci-fi"]
    },
    {
        title: "Retrato Fantasia Élfica",
        description: "Guerreira élfica com armadura dourada em floresta mágica encantada",
        prompt: "Ethereal elven warrior queen, intricate golden filigree armor with emerald gemstones, long silver hair flowing in magical wind, ancient enchanted forest background, bioluminescent plants, mystical golden light rays, hyper-detailed face, fantasy art style, dramatic lighting, 8K resolution, digital painting, epic composition, pre-raphaelite influence",
        price: 6.90,
        category: "Fantasia",
        imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
        salesCount: 89,
        likesCount: 24,
        rating: 4.9,
        ratingCount: 45,
        createdAt: Date.now() - 86400000 * 10,
        tags: ["fantasia", "elfo", "guerreira", "retrato"]
    },
    {
        title: "Paisagem Alienígena Surreal",
        description: "Planeta alienígena com céu dourado e cristais gigantes emergindo do solo",
        prompt: "Alien landscape with twin moons visible in golden amber sky, enormous crystal formations jutting from rust-colored terrain, exotic bioluminescent flora, a lone astronaut silhouette for scale, cinematic wide angle shot, god rays piercing atmospheric haze, ultra-detailed alien ecosystem, award-winning landscape photography style, otherworldly color palette of orange, teal and violet",
        price: 5.90,
        category: "Sci-Fi",
        imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
        salesCount: 31,
        likesCount: 8,
        rating: 4.7,
        ratingCount: 18,
        createdAt: Date.now() - 86400000 * 3,
        tags: ["alienígena", "planeta", "sci-fi", "paisagem"]
    },
    {
        title: "Dragão de Cristal",
        description: "Majestoso dragão translúcido pousado sobre montanhas geladas ao pôr do sol",
        prompt: "Majestic crystal ice dragon perched atop a frozen mountain peak, translucent crystalline scales refracting rainbow light, sunset in background painting sky in shades of crimson and gold, detailed dragon anatomy, photorealistic scales, epic fantasy atmosphere, snow particles in air, breath misting in cold air, massive wingspan, 8K fantasy artwork, by Gregory Manchess and Donato Giancola",
        price: 7.90,
        category: "Fantasia",
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        salesCount: 124,
        likesCount: 45,
        rating: 5.0,
        ratingCount: 67,
        createdAt: Date.now() - 86400000 * 20,
        tags: ["dragão", "cristal", "fantasia", "épico"]
    },
    {
        title: "Retrato Steampunk Vitoriano",
        description: "Inventor steampunk com óculos de latão e engrenagens em laboratório vitoriano",
        prompt: "Victorian steampunk inventor portrait, ornate brass goggles with multiple lenses, elaborate clockwork mechanical arm, leather coat with copper buttons, background of steam pipes and gears, dramatic side lighting, workshop filled with inventions, warm amber tones, bokeh background, photorealistic oil painting aesthetic, hyper-detailed textures, cinematic portrait photography",
        price: 4.90,
        category: "Steampunk",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        salesCount: 56,
        likesCount: 15,
        rating: 4.6,
        ratingCount: 29,
        createdAt: Date.now() - 86400000 * 7,
        tags: ["steampunk", "vitoriano", "retrato", "invenção"]
    },
    {
        title: "Templo Subaquático Perdido",
        description: "Ruínas antigas de um templo afundado habitado por vida marinha exótica",
        prompt: "Ancient sunken temple ruins underwater, shafts of crystal-clear turquoise light breaking through the surface above, colorful tropical fish and sea turtles swimming through stone archways, coral-covered statues, kelp forests swaying, mysterious treasure chests, photorealistic underwater photography, ultra-clear water, golden hour caustics on the seafloor, incredible detail, National Geographic quality",
        price: 5.90,
        category: "Natureza",
        imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80",
        salesCount: 43,
        likesCount: 9,
        rating: 4.8,
        ratingCount: 21,
        createdAt: Date.now() - 86400000 * 14,
        tags: ["subaquático", "templo", "ruínas", "oceano"]
    },
    {
        title: "Aurora Borealis Mística",
        description: "Cabana de madeira refletindo as luzes da aurora boreal em lago congelado",
        prompt: "Breathtaking aurora borealis display over a frozen Nordic lake, dancing ribbons of green, purple and pink light reflected perfectly in the ice surface, cozy wooden cabin with warm glowing windows, silhouette of pine trees, billions of stars visible in the dark sky, long exposure photography style, magical atmosphere, extreme dynamic range, ultra-sharp details, award-winning landscape photography",
        price: 4.90,
        category: "Natureza",
        imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        salesCount: 78,
        likesCount: 21,
        rating: 4.9,
        ratingCount: 38,
        createdAt: Date.now() - 86400000 * 12,
        tags: ["aurora", "natureza", "inverno", "noite"]
    },
    {
        title: "Robô Samurai Feudal",
        description: "Guerreiro robótico com armadura de samurai em jardim japonês durante cerejeiras",
        prompt: "Mechanical samurai warrior robot with ornate feudal Japanese armor incorporating traditional lacquer and chrome elements, standing in a Japanese garden during cherry blossom season, sakura petals falling, traditional red torii gate in background, dramatic lighting with shafts of golden light, hyper-detailed mecha design, concept art quality, cinematic composition, 8K resolution, blend of traditional and futuristic aesthetics",
        price: 6.90,
        category: "Sci-Fi",
        imageUrl: "https://images.unsplash.com/photo-1614743987817-cc8d4a1e3ab9?w=800&q=80",
        salesCount: 95,
        likesCount: 32,
        rating: 4.9,
        ratingCount: 52,
        createdAt: Date.now() - 86400000 * 8,
        tags: ["robô", "samurai", "japão", "mecha"]
    },
    {
        title: "Floresta Encantada Moonlit",
        description: "Floresta mágica banhada por luz lunar com fadas e cogumelos luminescentes",
        prompt: "Enchanted moonlit forest clearing, gigantic glowing mushrooms in shades of blue and violet, delicate fairy lights woven through ancient twisted oak branches, moonbeams creating ethereal shafts of silver light, magical fireflies and tiny fairies visible, carpet of luminescent moss, dewdrops on spider webs catching light, dreamlike atmosphere, fantasy illustration style, ultra-detailed nature, cinematic 8K render",
        price: 4.90,
        category: "Fantasia",
        imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
        salesCount: 61,
        likesCount: 18,
        rating: 4.7,
        ratingCount: 33,
        createdAt: Date.now() - 86400000 * 6,
        tags: ["floresta", "fadas", "lua", "magia"]
    },
    {
        title: "Arquitetura Futurista Branca",
        description: "Museu futurista com arquitetura orgânica branca em cidade costeira",
        prompt: "Futuristic white organic architecture museum by the coast, inspired by Zaha Hadid, flowing curved surfaces and asymmetric forms, interior visible through floor-to-ceiling glass walls, minimalist luxury aesthetic, people in modern attire for scale, golden hour lighting casting long shadows, crystal clear reflective pool in foreground, lush subtropical landscaping, drone perspective, architectural visualization quality, extremely photorealistic",
        price: 5.90,
        category: "Arquitetura",
        imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
        salesCount: 38,
        likesCount: 11,
        rating: 4.6,
        ratingCount: 19,
        createdAt: Date.now() - 86400000 * 9,
        tags: ["arquitetura", "futurista", "branco", "minimalista"]
    },
    {
        title: "Guerreira Dark Fantasy",
        description: "Guerreira sombria com espada flamejante em castelo em ruínas sob tempestade",
        prompt: "Dark fantasy female warrior standing atop crumbling castle ramparts during a thunderstorm, tattered dark armor with mystical runes glowing red, massive flaming sword held aloft attracting lightning, rain-soaked dramatic scene, storm clouds illuminated from within by lightning, dynamic pose, epic battle aftermath visible below, deep shadows with dramatic highlights, hyper-detailed, Artgerm and Luis Royo style, cinematic dark fantasy",
        price: 7.90,
        category: "Dark Fantasy",
        imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        salesCount: 112,
        likesCount: 38,
        rating: 5.0,
        ratingCount: 58,
        createdAt: Date.now() - 86400000 * 15,
        tags: ["guerreira", "dark fantasy", "espada", "tempestade"]
    },
    {
        title: "Galáxia Espiral em Close",
        description: "Vista privilegiada de uma galáxia espiral com nebulosas coloridas",
        prompt: "Breathtaking close-up view of a spiral galaxy, incredibly detailed star clusters and nebulae in vibrant shades of deep blue, violet, gold and rose, thousands of individual stars visible, dust lanes and spiral arms with incredible clarity, two smaller satellite galaxies visible, cosmic dust clouds backlit by young stars, Hubble-quality astrophotography style, scientifically accurate yet artistic, infinite depth of field, 16K ultra-detail",
        price: 4.90,
        category: "Espaço",
        imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
        salesCount: 67,
        likesCount: 14,
        rating: 4.8,
        ratingCount: 34,
        createdAt: Date.now() - 86400000 * 11,
        tags: ["galáxia", "espaço", "cosmos", "estrelas"]
    }
]
