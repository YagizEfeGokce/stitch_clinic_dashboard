-- GEÇICI ÇÖZÜM: Email tabanlı admin yetkisi
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut RLS politikasını kaldır
DROP POLICY IF EXISTS "beta_invitations_admin_all" ON public.beta_invitations;
DROP POLICY IF EXISTS "beta_waitlist_admin_select" ON public.beta_waitlist;
DROP POLICY IF EXISTS "beta_waitlist_admin_all" ON public.beta_waitlist;

-- 2. Email tabanlı yeni politika ekle (profiles tablosuna ihtiyaç yok)
CREATE POLICY "beta_invitations_admin_email"
ON public.beta_invitations FOR ALL
USING (
    auth.email() IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com')
);

-- 3. Beta waitlist için de email tabanlı politika
CREATE POLICY "beta_waitlist_admin_email"
ON public.beta_waitlist FOR ALL
USING (
    auth.email() IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com')
);

-- 4. Herkes kendi davetini görebilsin (SELECT için)
CREATE POLICY "beta_invitations_view_own"
ON public.beta_invitations FOR SELECT
USING (email = auth.email());

-- 5. Test: Şu anki kullanıcı bilgisi
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    CASE 
        WHEN auth.email() IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com') 
        THEN 'Admin Access Granted ✅'
        ELSE 'Not Admin ❌'
    END as access_status;
