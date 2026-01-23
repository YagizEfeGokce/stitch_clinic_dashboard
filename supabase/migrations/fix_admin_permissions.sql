-- FIX 1: Önce profiles tablosundaki role constraint'ini kontrol et ve güncelle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Mevcut constraint'i kaldır (eğer super_admin'i desteklemiyorsa)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Yeni constraint ekle (super_admin dahil)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'admin', 'staff', 'doctor', 'receptionist', 'super_admin'));

-- 3. Admin kullanıcılarına super_admin rolü ver
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com')
);

-- 4. Eğer profil yoksa ekle
INSERT INTO public.profiles (id, clinic_id, role, full_name, created_at, updated_at)
SELECT 
    id,
    '11111111-1111-1111-1111-111111111111' as clinic_id,
    'super_admin' as role,
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User') as full_name,
    now() as created_at,
    now() as updated_at
FROM auth.users 
WHERE email IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com')
AND id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) 
DO UPDATE SET role = 'super_admin';

-- 5. Kontrol et
SELECT p.id, p.role, p.full_name, u.email 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com');
