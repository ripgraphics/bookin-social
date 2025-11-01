-- ============================================================================
-- SEED PROFILE CONTENT
-- ============================================================================
-- Seeds sample posts and photos for the admin user to populate the profile page
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID;
  placeholder_image_url TEXT := 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
BEGIN
  -- Get the first admin/super_admin user
  SELECT u.id INTO admin_user_id
  FROM public.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  JOIN public.roles r ON ur.role_id = r.id
  WHERE r.name IN ('admin', 'super_admin')
  LIMIT 1;

  -- If no admin found, get the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM public.users LIMIT 1;
  END IF;

  -- Only seed if we have a user
  IF admin_user_id IS NOT NULL THEN
    -- Insert sample posts
    INSERT INTO public.user_posts (user_id, post_type, content, image_urls, likes_count, comments_count, shares_count, created_at)
    VALUES
      (admin_user_id, 'post', 'Just launched my new project! So excited to share it with everyone. Building something amazing 🚀', ARRAY[]::TEXT[], 12, 5, 3, NOW() - INTERVAL '2 hours'),
      (admin_user_id, 'photo', 'Beautiful sunset from my recent trip. Nature never fails to amaze me 🌅', ARRAY[placeholder_image_url], 28, 8, 7, NOW() - INTERVAL '5 hours'),
      (admin_user_id, 'article', '10 Tips for Better Productivity

1. Start your day with a clear plan
2. Eliminate distractions
3. Take regular breaks
4. Stay hydrated
5. Exercise regularly
6. Get enough sleep
7. Prioritize your tasks
8. Learn to say no
9. Use productivity tools
10. Review and adjust your routine

What are your favorite productivity tips?', ARRAY[]::TEXT[], 45, 15, 12, NOW() - INTERVAL '1 day'),
      (admin_user_id, 'post', 'Had an amazing workshop today! Learning new technologies and meeting great people. #TechLife #Learning', ARRAY[]::TEXT[], 18, 6, 4, NOW() - INTERVAL '2 days'),
      (admin_user_id, 'photo', 'Coffee and code - the perfect morning combination ☕💻', ARRAY[placeholder_image_url], 35, 10, 8, NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

    -- Insert sample photos (9 photos for 3x3 grid)
    INSERT INTO public.user_photos (user_id, image_url, caption, album_name, created_at)
    VALUES
      (admin_user_id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', 'Mountain view', 'default', NOW() - INTERVAL '10 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop', 'Forest path', 'default', NOW() - INTERVAL '9 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=600&fit=crop', 'Ocean sunset', 'default', NOW() - INTERVAL '8 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', 'City lights', 'default', NOW() - INTERVAL '7 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop', 'Desert landscape', 'default', NOW() - INTERVAL '6 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', 'Snowy peaks', 'default', NOW() - INTERVAL '5 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1470071459604-3b3db73e3289?w=800&h=600&fit=crop', 'Misty morning', 'default', NOW() - INTERVAL '4 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', 'Autumn colors', 'default', NOW() - INTERVAL '3 days'),
      (admin_user_id, 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=600&fit=crop', 'Beach paradise', 'default', NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded profile content for user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No user found to seed content for';
  END IF;
END $$;
