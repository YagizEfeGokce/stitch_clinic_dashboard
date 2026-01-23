-- RLS POLİTİKALARINI KONTROL ET
-- Bu SQL'i çalıştırıp politikaların doğru olduğunu doğrulayın

-- 1. Beta invitations için mevcut politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'beta_invitations'
ORDER BY policyname;

-- 2. Beta waitlist için mevcut politikaları listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'beta_waitlist'
ORDER BY policyname;

-- 3. Şu anki kullanıcının bilgilerini kontrol et
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    CASE 
        WHEN auth.email() IN ('yagiz.gokce19@gmail.com', 'relre434@gmail.com') 
        THEN 'Admin Access ✅'
        ELSE 'Not Admin ❌'
    END as access_status;

-- 4. Manuel olarak insert testi yap
-- Eğer bu başarılı olursa, RLS politikası çalışıyor demektir
INSERT INTO public.beta_invitations (email, waitlist_id)
VALUES ('test@example.com', NULL)
RETURNING id, code, email;

-- Son eklenen test kaydını sil
DELETE FROM public.beta_invitations 
WHERE email = 'test@example.com';
