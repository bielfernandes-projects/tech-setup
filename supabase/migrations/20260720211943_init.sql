-- Tech Setup — Schema Inicial
-- Categorias, Tags, Artigos + RLS

-- ENUM: status do artigo
create type article_status as enum ('draft', 'in_review', 'scheduled', 'published');

-- Tabela: categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- Tabela: tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- Tabela: articles
create table articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  hero_image_url text,
  status article_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela: article_tags (M:N)
create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Trigger: updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_updated_at
  before update on articles
  for each row
  execute function update_updated_at();

-- RLS: habilitar em todas as tabelas
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;

-- RLS: SELECT público apenas em articles published
create policy "Categories are public"
  on categories for select
  to anon
  using (true);

create policy "Tags are public"
  on tags for select
  to anon
  using (true);

create policy "Only published articles are visible"
  on articles for select
  to anon
  using (status = 'published');

create policy "Article_tags for published articles"
  on article_tags for select
  to anon
  using (
    exists (
      select 1 from articles
      where articles.id = article_id
      and articles.status = 'published'
    )
  );

-- Índices
create index idx_articles_status on articles(status);
create index idx_articles_published_at on articles(published_at desc);
create index idx_articles_slug on articles(slug);
create index idx_article_tags_article on article_tags(article_id);
create index idx_article_tags_tag on article_tags(tag_id);
