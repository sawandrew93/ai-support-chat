-- sql/supabase_schema.sql

-- 1) Extensions
create extension if not exists vector;

-- 2) Core tables
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists agent_status (
  agent_id uuid references agents(id) on delete cascade,
  is_online boolean default false,
  last_seen_at timestamptz default now(),
  primary key (agent_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,               -- anonymous id or authenticated user id
  status text not null default 'active',   -- active, queued, assigned, closed
  assigned_agent_id uuid references agents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null,                      -- 'user' | 'assistant' | 'agent' | 'system'
  content text not null,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mime_type text not null,
  file_path text,                          -- optional if storing raw file elsewhere
  created_at timestamptz default now()
);

-- For embeddings we store chunk text + vector
-- Adjust dimension to your model (default 768 for text-embedding-004)
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null
);

-- Feedback
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- 3) Indexes
create index if not exists idx_conv_status on conversations(status);
create index if not exists idx_doc_chunks_doc on document_chunks(document_id);
create index if not exists idx_messages_conv on messages(conversation_id);

-- Vector index (IVFFLAT) for fast similarity search
-- You must set lists based on data scale (e.g., 100)
create index if not exists idx_chunk_embedding on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4) RPC for similarity search
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 5,
  min_similarity float default 0.75
)
returns table(
  document_id uuid,
  chunk_id uuid,
  content text,
  similarity float
)
language sql stable as $$
  select
    dc.document_id,
    dc.id as chunk_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) >= min_similarity
  order by dc.embedding <=> query_embedding asc
  limit match_count;
$$;

