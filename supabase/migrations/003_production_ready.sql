-- Production Ready Features
-- Adds image_url to loyalty_rewards and sets up Supabase Storage bucket policies

-- Add image_url to loyalty_rewards table
ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for shop images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-images', 'shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shop images
-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for shop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own shop's images
CREATE POLICY IF NOT EXISTS "Users can update their shop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shop-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'shop-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own shop's images
CREATE POLICY IF NOT EXISTS "Users can delete their shop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-images'
  AND auth.role() = 'authenticated'
);

-- Comments
COMMENT ON COLUMN loyalty_rewards.image_url IS 'URL to reward image in Supabase Storage';
