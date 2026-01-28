-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS - ÂNCORA
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para criar todas as tabelas
-- necessárias e configurar as políticas de segurança.

-- 1. Tabela de Perfis (Lâminas)
create table public.tab_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price_per_m2 numeric not null, -- Preço por metro quadrado
  weight_per_m2 numeric not null -- Peso por metro quadrado (kg)
);

-- 2. Tabela de Motores
create table public.tab_motors (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  max_weight numeric not null, -- Capacidade máxima de peso (kg)
  price numeric not null
);

-- 3. Tabela de Eixos
create table public.tab_axles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  max_width numeric not null, -- Largura máxima suportada (metros)
  price numeric not null
);

-- 4. Tabela de Itens Opcionais
create table public.tab_optionals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price numeric not null,
  unit_type text check (unit_type in ('fixed', 'per_m2')) not null -- 'fixed' (unitário) ou 'per_m2' (por metro)
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

-- 6. Tabela de Orçamentos (Salva o estado do cálculo)
create table public.tab_quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.tab_clients(id) not null,
  width numeric not null,
  height numeric not null,
  roll numeric not null,
  quantity integer not null,
  profile_id uuid references public.tab_profiles(id) not null,
  motor_id uuid references public.tab_motors(id),
  axle_id uuid references public.tab_axles(id),
  total_price numeric not null,
  status text default 'pending' -- 'pending' | 'approved'
);

-- 7. Tabela de Junção Orçamento <-> Opcionais
create table public.tab_quote_optionals (
  quote_id uuid references public.tab_quotes(id) on delete cascade not null,
  optional_id uuid references public.tab_optionals(id) not null,
  primary key (quote_id, optional_id)
);

-- ==============================================================================
-- SEGURANÇA (Row Level Security - RLS)
-- ==============================================================================
-- Por padrão, habilitamos o RLS para que o acesso seja controlado.
-- Regras definidas:
-- 1. LEITURA (SELECT): Permitida para todos (público ou logado), para que o app funcione.
-- 2. ESCRITA (INSERT/UPDATE/DELETE):
--    - Tabelas de Configuração (Profiles, Motors...): Apenas Admin.
--    - Tabelas de Negócio (Clients, Quotes): Permitir inserção pública (para o app salvar) ou apenas autenticado dependendo da regra.
--      Neste caso, vamos permitir inserção pública para que o app funcione sem login forçado, 
--      mas idealmente seria apenas autenticado.

-- Habilitar RLS
alter table public.tab_profiles enable row level security;
alter table public.tab_motors enable row level security;
alter table public.tab_axles enable row level security;
alter table public.tab_optionals enable row level security;
alter table public.tab_clients enable row level security;
alter table public.tab_quotes enable row level security;
alter table public.tab_quote_optionals enable row level security;

-- Políticas para Perfis
create policy "Leitura pública de perfis" on public.tab_profiles for select using (true);
create policy "Admin pode inserir perfis" on public.tab_profiles for insert with check (auth.role() = 'authenticated');
create policy "Admin pode atualizar perfis" on public.tab_profiles for update using (auth.role() = 'authenticated');
create policy "Admin pode deletar perfis" on public.tab_profiles for delete using (auth.role() = 'authenticated');

-- Políticas para Motores
create policy "Leitura pública de motores" on public.tab_motors for select using (true);
create policy "Admin pode inserir motores" on public.tab_motors for insert with check (auth.role() = 'authenticated');
create policy "Admin pode atualizar motores" on public.tab_motors for update using (auth.role() = 'authenticated');
create policy "Admin pode deletar motores" on public.tab_motors for delete using (auth.role() = 'authenticated');

-- Políticas para Eixos
create policy "Leitura pública de eixos" on public.tab_axles for select using (true);
create policy "Admin pode inserir eixos" on public.tab_axles for insert with check (auth.role() = 'authenticated');
create policy "Admin pode atualizar eixos" on public.tab_axles for update using (auth.role() = 'authenticated');
create policy "Admin pode deletar eixos" on public.tab_axles for delete using (auth.role() = 'authenticated');

-- Políticas para Opcionais
create policy "Leitura pública de opcionais" on public.tab_optionals for select using (true);
create policy "Admin pode inserir opcionais" on public.tab_optionals for insert with check (auth.role() = 'authenticated');
create policy "Admin pode atualizar opcionais" on public.tab_optionals for update using (auth.role() = 'authenticated');
create policy "Admin pode deletar opcionais" on public.tab_optionals for delete using (auth.role() = 'authenticated');

-- Políticas para Clientes, Orçamentos e Relacionamentos
-- Permitir leitura pública (para ver histórico no admin simples) e inserção pública (para salvar orçamento)
create policy "Acesso total clientes" on public.tab_clients for all using (true) with check (true);
create policy "Acesso total orçamentos" on public.tab_quotes for all using (true) with check (true);
create policy "Acesso total orcamento_opcionais" on public.tab_quote_optionals for all using (true) with check (true);

-- ==============================================================================
-- DADOS INICIAIS (Opcional - Para popular o banco)
-- ==============================================================================

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