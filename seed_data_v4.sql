-- ============================================================================
-- DERMDESK - SEED DATA (Test Verileri v4)
-- ============================================================================
-- NASIL KULLANILIR?
-- 1. Önce uygulamadan bir kullanıcı oluşturun ve giriş yapın.
-- 2. Supabase SQL Editor'e gidin.
-- 3. Bu scripti kopyalayıp çalıştırın.
-- 4. Script, otomatik olarak bir 'owner' kullanıcısı bulur ve onun kliniğine verileri ekler.
-- ============================================================================

DO $$
DECLARE
    v_clinic_id UUID;
    v_owner_id UUID;
    v_staff_id UUID;
    v_service_botox_id UUID;
    v_service_filler_id UUID;
    v_service_consult_id UUID;
    v_client1_id UUID;
    v_client2_id UUID;
    v_client3_id UUID;
    v_client4_id UUID;
    v_client5_id UUID;
BEGIN
    -- 1. Kliniği ve Sahibini Bul (İlk 'owner' kullanıcısını baz alır)
    SELECT clinic_id, id INTO v_clinic_id, v_owner_id
    FROM profiles
    WHERE role = 'owner'
    LIMIT 1;

    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'Klinik veya Owner bulunamadı. Lütfen önce uygulamadan bir hesap oluşturun.';
        RETURN;
    END IF;

    RAISE NOTICE 'Veriler ekleniyor... Klinik ID: %, Owner ID: %', v_clinic_id, v_owner_id;

    -- Ekstra personel varsa onu al, yoksa owner'ı kullan
    SELECT id INTO v_staff_id FROM profiles WHERE clinic_id = v_clinic_id AND id != v_owner_id LIMIT 1;
    IF v_staff_id IS NULL THEN
        v_staff_id := v_owner_id;
    END IF;

    -- 2. HİZMETLERİ EKLE (Services)
    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Botoks (Tüm Yüz)', 'Kırışıklık tedavisi', 30, 3500.00, 'blue'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Botoks (Tüm Yüz)');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Dudak Dolgusu (1ml)', 'Juvederm/Teosyal Dolgu', 45, 6000.00, 'purple'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Dudak Dolgusu (1ml)');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Hydrafacial Cilt Bakımı', 'Derinlemesine temizlik ve nemlendirme', 60, 2000.00, 'green'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Hydrafacial Cilt Bakımı');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Ücretsiz Konsültasyon', 'İlk muayene ve planlama', 15, 0.00, 'gray'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Ücretsiz Konsültasyon');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Mezoterapi (Yüz)', 'Vitamin ve mineral enjeksiyonu', 30, 2500.00, 'yellow'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Mezoterapi (Yüz)');

    -- ID'leri yakalayalım
    SELECT id INTO v_service_botox_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Botoks (Tüm Yüz)' LIMIT 1;
    SELECT id INTO v_service_filler_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Dudak Dolgusu (1ml)' LIMIT 1;
    SELECT id INTO v_service_consult_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Ücretsiz Konsültasyon' LIMIT 1;

    -- 3. MÜŞTERİLERİ EKLE (Clients)
    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes, gender)
    SELECT v_clinic_id, 'Ayşe', 'Yılmaz', 'ayse@example.com', '5551112233', 'Active', 'Botoks takibi gerekiyor. VIP Müşteri.', 'Kadin'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'ayse@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes, gender)
    SELECT v_clinic_id, 'Mehmet', 'Demir', 'mehmet@example.com', '5552223344', 'Active', 'Cilt hassasiyeti var, lidokain alerjisi olabilir.', 'Erkek'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'mehmet@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes, gender)
    SELECT v_clinic_id, 'Zeynep', 'Kaya', 'zeynep@example.com', '5553334455', 'Active', 'Düzenli müşteri, kampanya bekliyor.', 'Kadin'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'zeynep@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes, gender)
    SELECT v_clinic_id, 'Can', 'Öztürk', 'can@example.com', '5554445566', 'Active', 'Yeni kayıt, referans ile geldi.', 'Erkek'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'can@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes, gender)
    SELECT v_clinic_id, 'Elif', 'Şahin', 'elif@example.com', '5556667788', 'Lead', 'Instagram üzerinden fiyat sordu.', 'Kadin'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'elif@example.com');
    
    SELECT id INTO v_client1_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'ayse@example.com' LIMIT 1;
    SELECT id INTO v_client2_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'mehmet@example.com' LIMIT 1;
    SELECT id INTO v_client3_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'zeynep@example.com' LIMIT 1;
    SELECT id INTO v_client4_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'can@example.com' LIMIT 1;
    SELECT id INTO v_client5_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'elif@example.com' LIMIT 1;

    -- 4. ENVANTER EKLE (Inventory)
    INSERT INTO inventory (clinic_id, name, stock, min_stock_alert, price, cost_price, unit, category, status)
    SELECT v_clinic_id, 'Botox Flakon 100iu', 12, 5, 0, 1200.00, 'Adet', 'İlaç', 'In Stock'
    WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE clinic_id = v_clinic_id AND name = 'Botox Flakon 100iu');

    INSERT INTO inventory (clinic_id, name, stock, min_stock_alert, price, cost_price, unit, category, status)
    SELECT v_clinic_id, 'Juvederm Voluma 1ml', 8, 3, 0, 2500.00, 'Kutu', 'Dolgu', 'In Stock'
    WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE clinic_id = v_clinic_id AND name = 'Juvederm Voluma 1ml');

    INSERT INTO inventory (clinic_id, name, stock, min_stock_alert, price, cost_price, unit, category, status)
    SELECT v_clinic_id, 'Enjektör (İnce Uç)', 500, 100, 0, 2.50, 'Adet', 'Sarf Malzeme', 'In Stock'
    WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE clinic_id = v_clinic_id AND name = 'Enjektör (İnce Uç)');

    -- 5. RANDEVULARI EKLE (Appointments) & GELİR/GİDER
    -- Bugün (3 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes, payment_status)
    SELECT v_clinic_id, v_client1_id, v_owner_id, v_service_botox_id, CURRENT_DATE, '10:00:00', 'Completed', 'İşlem başarılı geçti.', 'Paid'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_owner_id AND date = CURRENT_DATE AND time = '10:00:00');

    -- İşlem geliri ekle (Transaction)
    INSERT INTO transactions (clinic_id, type, amount, category, date, description, payment_method)
    SELECT v_clinic_id, 'income', 3500.00, 'Hizmet Satışı', CURRENT_DATE, 'Botoks İşlemi (Ayşe Yılmaz)', 'Kredi Kartı'
    WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE clinic_id = v_clinic_id AND description = 'Botoks İşlemi (Ayşe Yılmaz)');


    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes, payment_status)
    SELECT v_clinic_id, v_client2_id, v_staff_id, v_service_consult_id, CURRENT_DATE, '14:30:00', 'Confirmed', 'İlk görüşme, form doldurulacak.', 'Unpaid'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_staff_id AND date = CURRENT_DATE AND time = '14:30:00');

    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes, payment_status)
    SELECT v_clinic_id, v_client4_id, v_owner_id, v_service_filler_id, CURRENT_DATE, '16:00:00', 'Scheduled', 'Dudak dolgusu isteği var.', 'Unpaid'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_owner_id AND date = CURRENT_DATE AND time = '16:00:00');

    -- Yarın (2 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    SELECT v_clinic_id, v_client3_id, v_owner_id, v_service_filler_id, CURRENT_DATE + 1, '11:00:00', 'Scheduled', 'Kontrol randevusu'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_owner_id AND date = (CURRENT_DATE + 1) AND time = '11:00:00');

    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    SELECT v_clinic_id, v_client5_id, v_staff_id, v_service_consult_id, CURRENT_DATE + 1, '13:00:00', 'Scheduled', 'Lazer epilasyon görüşmesi'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_staff_id AND date = (CURRENT_DATE + 1) AND time = '13:00:00');

    RAISE NOTICE 'Dermdesk v4 Test Verileri Başarıyla Eklendi!';
    RAISE NOTICE 'Eklenen Müşteri Sayısı: 5';
    RAISE NOTICE 'Eklenen Hizmet Sayısı: 5';
    RAISE NOTICE 'Eklenen Randevu Sayısı: 5';
END $$;
