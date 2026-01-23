-- DIAGNOSTIC: Kullanıcı profilini ve yetkilerini kontrol et
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Auth kullanıcıları listele
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com');

-- 2. Profiles tablosunu kontrol et (varsa)
SELECT p.id, p.role, p.full_name, p.clinic_id, u.email 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com');

-- 3. Profiles tablosunun yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Profiles tablosundaki role constraint'ini kontrol et
SELECT con.conname, pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles' 
AND con.contype = 'c'
AND con.conname LIKE '%role%';

-- 5. Beta invitations tablosunun RLS politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'beta_invitations';

-- 6. Şu anki kullanıcının ID'sini al (giriş yapmışsanız)
SELECT auth.uid() as current_user_id;

-- 7. Şu anki kullanıcının profil bilgisini al
SELECT * 
FROM public.profiles 
WHERE id = auth.uid();
