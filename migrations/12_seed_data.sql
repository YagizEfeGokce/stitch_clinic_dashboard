-- ============================================================================
-- SEED DATA SCRIPT (Turkish)
-- ============================================================================
-- This script populates the database with realistic sample data for testing.
-- It automatically detects the first available clinic in the database and 
-- assigns the data to it.
--
-- HOW TO USE:
-- 1. Run this in the Supabase SQL Editor.
-- 2. Ensure you have at least one clinic (Sign up first if empty).
-- ============================================================================

DO $$
DECLARE
    target_clinic_id UUID;
    s_botox UUID;
    s_filler UUID;
    s_prp UUID;
    s_facial UUID;
    c_ayse UUID;
    c_mehmet UUID;
    c_zeynep UUID;
    c_can UUID;
    c_elif UUID;
BEGIN
    -- 1. Get the first clinic
    SELECT id INTO target_clinic_id FROM public.clinics LIMIT 1;

    IF target_clinic_id IS NULL THEN
        RAISE EXCEPTION '❌ HATA: Hiçbir klinik bulunamadı. Lütfen önce uygulamadan kayıt olun (Sign Up).';
    END IF;

    RAISE NOTICE '✅ Klinik Bulundu: %', target_clinic_id;

    -- 2. Clear existing demo data (Optional - helps avoid duplicates if run multiple times)
    -- DELETE FROM public.appointments WHERE clinic_id = target_clinic_id;
    -- DELETE FROM public.inventory WHERE clinic_id = target_clinic_id;
    -- DELETE FROM public.clients WHERE clinic_id = target_clinic_id;
    -- DELETE FROM public.services WHERE clinic_id = target_clinic_id;

    -- 3. Insert Services
    INSERT INTO public.services (clinic_id, name, description, duration_min, price, color)
    VALUES
        (target_clinic_id, 'Botoks (Alın & Göz Çevresi)', 'Kırışıklık ve ince çizgi tedavisi.', 15, 3500, '#8b5cf6') RETURNING id INTO s_botox;
        
    INSERT INTO public.services (clinic_id, name, description, duration_min, price, color)
    VALUES
        (target_clinic_id, 'Dudak Dolgusu (1ml)', 'Hyaluronik asit ile dudak şekillendirme.', 30, 6000, '#ec4899') RETURNING id INTO s_filler;
        
    INSERT INTO public.services (clinic_id, name, description, duration_min, price, color)
    VALUES
        (target_clinic_id, 'PRP Saç Tedavisi', 'Saç dökülmesine karşı plazma tedavisi.', 45, 2500, '#10b981') RETURNING id INTO s_prp;
        
    INSERT INTO public.services (clinic_id, name, description, duration_min, price, color)
    VALUES
        (target_clinic_id, 'Medikal Cilt Bakımı', 'Derinlemesine temizlik ve bakım.', 60, 1500, '#3b82f6') RETURNING id INTO s_facial;

    RAISE NOTICE '✅ Hizmetler eklendi.';

    -- 4. Insert Clients (Patients)
    INSERT INTO public.clients (clinic_id, first_name, last_name, phone, email, status, gender, birth_date, notes)
    VALUES
        (target_clinic_id, 'Ayşe', 'Yılmaz', '5551112233', 'ayse@example.com', 'Active', 'Female', '1990-05-15', 'Botoks takibi yapılacak.') RETURNING id INTO c_ayse;
        
    INSERT INTO public.clients (clinic_id, first_name, last_name, phone, email, status, gender, birth_date, notes)
    VALUES
        (target_clinic_id, 'Mehmet', 'Demir', '5552223344', 'mehmet@example.com', 'Active', 'Male', '1985-08-22', 'Saç dökülmesi şikayeti var.') RETURNING id INTO c_mehmet;
        
    INSERT INTO public.clients (clinic_id, first_name, last_name, phone, email, status, gender, birth_date, notes)
    VALUES
        (target_clinic_id, 'Zeynep', 'Kaya', '5553334455', 'zeynep@example.com', 'Lead', 'Female', '1995-02-10', 'Instagram üzerinden ulaştı.') RETURNING id INTO c_zeynep;

    INSERT INTO public.clients (clinic_id, first_name, last_name, phone, email, status, gender, birth_date, notes)
    VALUES
        (target_clinic_id, 'Can', 'Öztürk', '5554445566', 'can@example.com', 'Active', 'Male', '1988-11-30', 'Düzenli cilt bakımı hastası.') RETURNING id INTO c_can;
        
    INSERT INTO public.clients (clinic_id, first_name, last_name, phone, email, status, gender, birth_date, notes)
    VALUES
        (target_clinic_id, 'Elif', 'Çelik', '5555556677', 'elif@example.com', 'Inactive', 'Female', '1992-06-18', 'Şehir dışına taşındı.') RETURNING id INTO c_elif;

    RAISE NOTICE '✅ Müşteriler eklendi.';

    -- 5. Insert Inventory
    INSERT INTO public.inventory (clinic_id, name, stock, unit, min_stock, price)
    VALUES
        (target_clinic_id, 'Botox Flakon (100iu)', 5, 'kutu', 2, 4500),
        (target_clinic_id, 'Juvederm Volift', 8, 'adet', 3, 3200),
        (target_clinic_id, 'PRP Kiti', 25, 'adet', 10, 450),
        (target_clinic_id, 'Cilt Bakım Maskesi', 40, 'adet', 15, 120),
        (target_clinic_id, 'Anestezik Krem', 3, 'tüp', 1, 850);

    RAISE NOTICE '✅ Stoklar eklendi.';

    -- 6. Insert Appointments (Past & Future)
    -- Past
    INSERT INTO public.appointments (clinic_id, client_id, service_id, date, time, status, notes)
    VALUES
        (target_clinic_id, c_ayse, s_botox, CURRENT_DATE - 5, '14:00', 'completed', 'Sorunsuz geçti.');

    INSERT INTO public.appointments (clinic_id, client_id, service_id, date, time, status, notes)
    VALUES
        (target_clinic_id, c_mehmet, s_prp, CURRENT_DATE - 2, '10:30', 'completed', '3. seans tamamlandı.');

    -- Today
    INSERT INTO public.appointments (clinic_id, client_id, service_id, date, time, status, notes)
    VALUES
        (target_clinic_id, c_can, s_facial, CURRENT_DATE, '15:00', 'scheduled', 'Gecikebilir.');

    -- Future
    INSERT INTO public.appointments (clinic_id, client_id, service_id, date, time, status, notes)
    VALUES
        (target_clinic_id, c_zeynep, s_filler, CURRENT_DATE + 3, '11:00', 'scheduled', 'Dudak dolgusu ilk kez yapılacak.');

    INSERT INTO public.appointments (clinic_id, client_id, service_id, date, time, status, notes)
    VALUES
        (target_clinic_id, c_ayse, s_botox, CURRENT_DATE + 14, '14:00', 'scheduled', 'Kontrol randevusu.');

    RAISE NOTICE '✅ Randevular eklendi.';

    -- 7. Insert Transactions (Finance)
    -- Income (Completed appointments)
    INSERT INTO public.transactions (clinic_id, type, amount, category, description, date, client_id)
    VALUES
        (target_clinic_id, 'income', 3500, 'Hizmet Satışı', 'Botoks İşlemi (Ayşe Yılmaz)', CURRENT_DATE - 5, c_ayse),
        (target_clinic_id, 'income', 2500, 'Hizmet Satışı', 'PRP Tedavisi (Mehmet Demir)', CURRENT_DATE - 2, c_mehmet);

    -- Expenses (Rent, Supplies)
    INSERT INTO public.transactions (clinic_id, type, amount, category, description, date)
    VALUES
        (target_clinic_id, 'expense', 15000, 'Kira', 'Aylık Klinik Kirası', CURRENT_DATE - 15),
        (target_clinic_id, 'expense', 4500, 'Stok', 'Botox İlaç Alımı', CURRENT_DATE - 10),
        (target_clinic_id, 'expense', 1200, 'Fatura', 'Elektrik Faturası', CURRENT_DATE - 3);

    RAISE NOTICE '✅ Finans verileri eklendi.';
    RAISE NOTICE '🎉 DEMO VERİSİ BAŞARIYLA YÜKLENDİ!';

END $$;
