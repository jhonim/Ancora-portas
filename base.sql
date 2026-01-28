-- =====================================================================================
-- ARQUIVO BASE DE CONFIGURAÇÃO DO BACKEND (SUPABASE)
-- =====================================================================================
-- Este arquivo contém o script SQL para criar todas as tabelas, relacionamentos e
-- políticas de segurança necessárias para o aplicativo Âncora funcionar.

-- =====================================================================================
-- INSTRUÇÕES DE INTEGRAÇÃO E AUTENTICAÇÃO
-- =====================================================================================
-- 1. CRIAÇÃO DO PROJETO
--    a. Crie uma conta em https://supabase.com e um novo projeto.
--
-- 2. AUTENTICAÇÃO
--    a. O sistema agora EXIGE login.
--    b. No menu "Authentication" > "Providers", habilite "Email".
--    c. Para criar seu primeiro usuário, você pode:
--       - Usar a tela de "Cadastrar" no próprio aplicativo.
--       - OU ir em "Authentication" > "Users" > "Add User" no painel do Supabase.
--
-- 3. SQL & BANCO DE DADOS
--    a. Vá em "SQL Editor", cole este script inteiro e clique em "Run".
--    b. Isso criará as tabelas e aplicará regras de segurança onde APENAS usuários
--       logados podem ler ou escrever dados.

-- 4. CONEXÃO
--    a. Pegue a URL e a KEY em "Project Settings" > "API".
--    b. Coloque no seu arquivo .env ou diretamente no `services/supabaseService.ts`.

-- =====================================================================================
-- INÍCIO DO SCRIPT SQL
-- =====================================================================================

-- 1. Tabela de Perfis
create table public.tab_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price_per_m2 numeric not null,
  weight_per_m2 numeric not null
);

-- 2. Tabela de Motores
create table public.tab_motors (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  max_weight numeric not null,
  price numeric not null
);

-- 3. Tabela de Eixos
create table public.tab_axles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  max_width numeric not null,
  price numeric not null
);

-- 4. Tabela de Itens Opcionais
create table public.tab_optionals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price numeric not null,
  unit_type text check (unit_type in ('fixed', 'per_m2')) not null
);

-- 5. Tabela de Clientes
create table public.tab_clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text,
  phone text,
  address text
);

-- 6. Tabela de Orçamentos
create table public.tab_quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.tab_clients(id) not null,
  customer_name text,
  width numeric not null,
  height numeric not null,
  roll numeric not null,
  quantity integer not null,
  profile_id uuid references public.tab_profiles(id) not null,
  motor_id uuid references public.tab_motors(id),
  axle_id uuid references public.tab_axles(id),
  total_price numeric not null,
  status text default 'pending' not null
);

-- 7. Tabela de Junção Orçamento <-> Opcionais
create table public.tab_quote_optionals (
  quote_id uuid references public.tab_quotes(id) on delete cascade not null,
  optional_id uuid references public.tab_optionals(id) not null,
  primary key (quote_id, optional_id)
);

-- =====================================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS) - APENAS USUÁRIOS LOGADOS
-- =====================================================================================

alter table public.tab_profiles enable row level security;
alter table public.tab_motors enable row level security;
alter table public.tab_axles enable row level security;
alter table public.tab_optionals enable row level security;
alter table public.tab_clients enable row level security;
alter table public.tab_quotes enable row level security;
alter table public.tab_quote_optionals enable row level security;

-- AQUI ESTÁ A MUDANÇA PRINCIPAL: "auth.role() = 'authenticated'"
-- Isso significa que ninguém consegue ler ou escrever se não tiver feito login.

-- Políticas de Leitura (Para todos os usuários logados)
create policy "Usuários logados podem ver perfis" on public.tab_profiles for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver motores" on public.tab_motors for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver eixos" on public.tab_axles for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver opcionais" on public.tab_optionals for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver clientes" on public.tab_clients for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver orçamentos" on public.tab_quotes for select using (auth.role() = 'authenticated');
create policy "Usuários logados podem ver junção opcionais" on public.tab_quote_optionals for select using (auth.role() = 'authenticated');

-- Políticas de Escrita (Inserção/Atualização/Deleção) - Todos os logados
-- (Em um sistema maior, você poderia restringir Delete apenas para emails específicos, ex: admin@empresa.com)
create policy "Usuários logados gerenciam perfis" on public.tab_profiles for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam motores" on public.tab_motors for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam eixos" on public.tab_axles for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam opcionais" on public.tab_optionals for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam clientes" on public.tab_clients for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam orçamentos" on public.tab_quotes for all using (auth.role() = 'authenticated');
create policy "Usuários logados gerenciam junção opcionais" on public.tab_quote_optionals for all using (auth.role() = 'authenticated');

-- =====================================================================================
-- DADOS INICIAIS
-- =====================================================================================

insert into public.tab_profiles (name, price_per_m2, weight_per_m2) values
('Perfil Meia Cana Fechada', 250, 10),
('Perfil Transvision', 300, 8),
('Perfil Lâmina Vazada', 280, 9);

insert into public.tab_motors (name, max_weight, price) values
('Motor AC 200kg', 200, 1200),
('Motor AC 400kg', 400, 1800),
('Motor DC 600kg (Alto Fluxo)', 600, 2500),
('Motor Industrial 1000kg', 1000, 4000);

insert into public.tab_axles (name, max_width, price) values
('Eixo 4.5" (até 4m)', 4, 400),
('Eixo 6" (até 8m)', 8, 800),
('Eixo 8" Industrial (até 12m)', 12, 1500);

insert into public.tab_optionals (name, price, unit_type) values
('Pintura Eletrostática', 50, 'per_m2'),
('Controle Remoto Extra', 80, 'fixed'),
('Nobreak', 600, 'fixed'),
('Sensor de Barreira', 150, 'fixed');