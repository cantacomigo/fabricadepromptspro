-- ==========================================================
-- SCHEMA PARA FÁBRICA DE PROMPTS
-- Copie e cole este código no SQL Editor do seu Supabase
-- ==========================================================

-- 1. LIMPEZA (OPCIONAL - Cuidado pois deleta dados!)
-- DROP TABLE IF EXISTS purchases;
-- DROP TABLE IF EXISTS prompts;
-- DROP TABLE IF EXISTS profiles;

-- 2. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERIR CATEGORIAS INICIAIS
INSERT INTO categories (name) VALUES 
  ('Sci-Fi'), ('Fantasia'), ('Dark Fantasy'), ('Steampunk'), 
  ('Natureza'), ('Arquitetura'), ('Espaço')
ON CONFLICT (name) DO NOTHING;


-- 4. TABELA DE PROMPTS
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  sales_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE COMPRAS
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE CURTIDAS (LIKES)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 6. FUNÇÃO PARA CHECAR ADMIN (EVITA RECURSIVIDADE)
-- Esta função é marcada como 'SECURITY DEFINER' para ignorar o RLS dela mesma
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. POLÍTICAS DE ACESSO (RLS)

-- --- PROMPTS ---
DROP POLICY IF EXISTS "Prompts são públicos" ON prompts;
CREATE POLICY "Prompts são públicos" ON prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins gerenciam prompts" ON prompts;
CREATE POLICY "Admins gerenciam prompts" ON prompts FOR ALL 
  USING (public.is_admin());

-- --- PERFIS ---
DROP POLICY IF EXISTS "Ver próprio perfil" ON profiles;
CREATE POLICY "Ver próprio perfil" ON profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins veem todos os perfis" ON profiles;
CREATE POLICY "Admins veem todos os perfis" ON profiles FOR SELECT 
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins atualizam perfis" ON profiles;
CREATE POLICY "Admins atualizam perfis" ON profiles FOR UPDATE 
  USING (public.is_admin());

DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON profiles;
CREATE POLICY "Usuários atualizam próprio perfil" ON profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários cadastram próprio perfil" ON profiles;
CREATE POLICY "Usuários cadastram próprio perfil" ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- --- COMPRAS ---
DROP POLICY IF EXISTS "Ver próprias compras" ON purchases;
CREATE POLICY "Ver próprias compras" ON purchases FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins controlam compras" ON purchases;
CREATE POLICY "Admins controlam compras" ON purchases FOR ALL 
  USING (public.is_admin());

DROP POLICY IF EXISTS "Usuários criam próprias compras" ON purchases;
CREATE POLICY "Usuários criam próprias compras" ON purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- --- CATEGORIAS ---
DROP POLICY IF EXISTS "Categorias são públicas" ON categories;
CREATE POLICY "Categorias são públicas" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins gerenciam categorias" ON categories;
CREATE POLICY "Admins gerenciam categorias" ON categories FOR ALL 
  USING (public.is_admin());

-- --- CURTIDAS ---
DROP POLICY IF EXISTS "Curtidas são públicas" ON likes;
CREATE POLICY "Curtidas são públicas" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários curtem prompts" ON likes;
CREATE POLICY "Usuários curtem prompts" ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários descurtem prompts" ON likes;
CREATE POLICY "Usuários descurtem prompts" ON likes FOR DELETE 
  USING (auth.uid() = user_id);



-- 8. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE NO SIGNUP
-- Isso garante que toda vez que um usuário se cadastrar no Auth, um perfil será criado em 'profiles'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deletar se já existir para não dar erro ao rodar o script várias vezes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
