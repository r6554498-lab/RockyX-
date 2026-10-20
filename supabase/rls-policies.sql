-- ==========================================
-- ROCKYX DATABASE SECURITY
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS on all current application tables.
alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.follows enable row level security;
alter table public.music_tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.templates enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "Profiles are viewable by everyone"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- CREATOR PROFILES
create policy "Creator profiles are viewable"
on public.creator_profiles
for select
to anon, authenticated
using (true);

create policy "Users can create their own creator profile"
on public.creator_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own creator profile"
on public.creator_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- POSTS
create policy "Public posts are viewable"
on public.posts
for select
to anon, authenticated
using (
    visibility = 'public'
    or user_id = auth.uid()
);

create policy "Users can create their own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own posts"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);

-- COMMENTS
create policy "Comments are viewable"
on public.comments
for select
to anon, authenticated
using (true);

create policy "Authenticated users can create comments"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
on public.comments
for delete
to authenticated
using (auth.uid() = user_id);

-- POST LIKES
create policy "Likes are viewable"
on public.post_likes
for select
to anon, authenticated
using (true);

create policy "Users can like as themselves"
on public.post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
on public.post_likes
for delete
to authenticated
using (auth.uid() = user_id);

-- FOLLOWS
create policy "Follows are viewable"
on public.follows
for select
to anon, authenticated
using (true);

create policy "Users can follow as themselves"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

-- MUSIC TRACKS
create policy "Music tracks are viewable"
on public.music_tracks
for select
to anon, authenticated
using (true);

create policy "Artists can add tracks under their account"
on public.music_tracks
for insert
to authenticated
with check (auth.uid() = artist_id);

create policy "Artists can update their own tracks"
on public.music_tracks
for update
to authenticated
using (auth.uid() = artist_id)
with check (auth.uid() = artist_id);

create policy "Artists can delete their own tracks"
on public.music_tracks
for delete
to authenticated
using (auth.uid() = artist_id);

-- PLAYLISTS
create policy "Public playlists and owners can view playlists"
on public.playlists
for select
to anon, authenticated
using (is_public = true or user_id = auth.uid());

create policy "Users can create their own playlists"
on public.playlists
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own playlists"
on public.playlists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own playlists"
on public.playlists
for delete
to authenticated
using (auth.uid() = user_id);

-- PRODUCTS
create policy "Products are viewable"
on public.products
for select
to anon, authenticated
using (true);

create policy "Sellers can create their own products"
on public.products
for insert
to authenticated
with check (auth.uid() = seller_id);

create policy "Sellers can update their own products"
on public.products
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Sellers can delete their own products"
on public.products
for delete
to authenticated
using (auth.uid() = seller_id);

-- ORDERS
create policy "Buyers can view their own orders"
on public.orders
for select
to authenticated
using (auth.uid() = buyer_id);

create policy "Buyers can create their own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = buyer_id);

-- TEMPLATES
create policy "Approved templates are viewable"
on public.templates
for select
to anon, authenticated
using (
    approval_status = 'approved'
    or creator_id = auth.uid()
);

create policy "Creators can submit their own templates"
on public.templates
for insert
to authenticated
with check (auth.uid() = creator_id);

create policy "Creators can update their own templates"
on public.templates
for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "Creators can delete their own templates"
on public.templates
for delete
to authenticated
using (auth.uid() = creator_id);

-- NOTIFICATIONS
create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);