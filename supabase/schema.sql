-- ==========================================
-- ROCKYX DATABASE FOUNDATION
-- One World. One Platform.
-- ==========================================

create extension if not exists pgcrypto;

-- 1. USER PROFILES
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    display_name text,
    bio text default '',
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. CREATOR PROFILES
create table if not exists public.creator_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    creator_type text not null default 'social',
    bio text default '',
    verification_status text not null default 'unverified',
    created_at timestamptz not null default now()
);

-- 3. VIDEOS AND SOCIAL POSTS
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    caption text default '',
    media_url text,
    media_type text not null default 'video',
    visibility text not null default 'public',
    created_at timestamptz not null default now()
);

-- 4. COMMENTS
create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    parent_id uuid references public.comments(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);

-- 5. LIKES
create table if not exists public.post_likes (
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (post_id, user_id)
);

-- 6. FOLLOWING
create table if not exists public.follows (
    follower_id uuid not null references public.profiles(id) on delete cascade,
    followed_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, followed_id),
    check (follower_id <> followed_id)
);

-- 7. MUSIC TRACKS
create table if not exists public.music_tracks (
    id uuid primary key default gen_random_uuid(),
    artist_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    audio_url text,
    cover_url text,
    genre text,
    access_level text not null default 'free',
    created_at timestamptz not null default now()
);

-- 8. MUSIC PLAYLISTS
create table if not exists public.playlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text default '',
    is_public boolean not null default true,
    created_at timestamptz not null default now()
);

-- 9. MARKETPLACE PRODUCTS
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text default '',
    price_minor bigint not null check (price_minor >= 0),
    currency text not null default 'GHS',
    image_url text,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    created_at timestamptz not null default now()
);

-- 10. MARKETPLACE ORDERS
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    buyer_id uuid not null references public.profiles(id) on delete restrict,
    status text not null default 'pending',
    currency text not null default 'GHS',
    total_minor bigint not null check (total_minor >= 0),
    created_at timestamptz not null default now()
);

-- 11. TEMPLATES
create table if not exists public.templates (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text default '',
    access_level text not null default 'free',
    preview_url text,
    project_data jsonb not null default '{}'::jsonb,
    approval_status text not null default 'pending',
    created_at timestamptz not null default now()
);

-- 12. NOTIFICATIONS
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    body text default '',
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- 13. INDEXES
create index if not exists posts_user_created_idx
    on public.posts(user_id, created_at desc);

create index if not exists comments_post_created_idx
    on public.comments(post_id, created_at);

create index if not exists follows_followed_idx
    on public.follows(followed_id);

create index if not exists music_tracks_artist_idx
    on public.music_tracks(artist_id);

create index if not exists products_seller_idx
    on public.products(seller_id);

create index if not exists templates_creator_idx
    on public.templates(creator_id);

create index if not exists notifications_user_created_idx
    on public.notifications(user_id, created_at desc);