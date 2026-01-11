-- ============================================================================
-- VELARA/DERMDESK - SEED DATA (Test Verileri v3 - Idempotent)
-- ============================================================================
-- Bu script, veritabanını test etmek için yapay veriler ekler.
-- EĞER VERİ ZATEN VARSA TEKRAR EKLEMEZ (Idempotent).
-- NOT: Sadece mevcut giriş yapmış kullanıcının kliniğine veri ekler.
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
BEGIN
    -- 1. Kliniği ve Sahibini Bul (İlk 'owner' kullanıcısını baz alır)
    SELECT clinic_id, id INTO v_clinic_id, v_owner_id
    FROM profiles
    WHERE role = 'owner'
    LIMIT 1;

    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'Klinik veya Owner bulunamadı. Lütfen önce bir hesap oluşturun.';
        RETURN;
    END IF;

    RAISE NOTICE 'Veriler ekleniyor... Klinik ID: %, Owner ID: %', v_clinic_id, v_owner_id;

    -- Ekstra personel varsa onu al, yoksa owner'ı kullan
    SELECT id INTO v_staff_id FROM profiles WHERE clinic_id = v_clinic_id AND id != v_owner_id LIMIT 1;
    IF v_staff_id IS NULL THEN
        v_staff_id := v_owner_id;
    END IF;

    -- 2. HİZMETLERİ EKLE (Services)
    -- Varsa ekleme, yoksa ekle (name + clinic_id unique kabul ediyoruz mantıken)
    
    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Botoks (Tüm Yüz)', 'Kırışıklık tedavisi', 30, 3500.00, 'blue'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Botoks (Tüm Yüz)');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Dudak Dolgusu', '1ml Hyaluronik asit', 45, 6000.00, 'purple'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Dudak Dolgusu');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Cilt Bakımı', 'Derinlemesine temizlik ve hydrafacial', 60, 1500.00, 'green'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Cilt Bakımı');

    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    SELECT v_clinic_id, 'Ücretsiz Konsültasyon', 'İlk muayene ve planlama', 15, 0.00, 'gray'
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE clinic_id = v_clinic_id AND name = 'Ücretsiz Konsültasyon');

    -- ID'leri yakalayalım
    SELECT id INTO v_service_botox_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Botoks (Tüm Yüz)' LIMIT 1;
    SELECT id INTO v_service_filler_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Dudak Dolgusu' LIMIT 1;
    SELECT id INTO v_service_consult_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Ücretsiz Konsültasyon' LIMIT 1;

    -- 3. MÜŞTERİLERİ EKLE (Clients)
    -- Email kontrolü ile tekrarı önle
    
    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes)
    SELECT v_clinic_id, 'Ayşe', 'Yılmaz', 'ayse@example.com', '905551112233', 'Active', 'Botoks takibi gerekiyor. VIP'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'ayse@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes)
    SELECT v_clinic_id, 'Mehmet', 'Demir', 'mehmet@example.com', '905552223344', 'Active', 'Cilt hassasiyeti var.'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'mehmet@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes)
    SELECT v_clinic_id, 'Zeynep', 'Kaya', 'zeynep@example.com', '905553334455', 'Active', 'Düzenli müşteri.'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'zeynep@example.com');

    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes)
    SELECT v_clinic_id, 'Can', 'Öztürk', 'can@example.com', '905554445566', 'Active', 'Yeni kayıt.'
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE clinic_id = v_clinic_id AND email = 'can@example.com');
    
    SELECT id INTO v_client1_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'ayse@example.com' LIMIT 1;
    SELECT id INTO v_client2_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'mehmet@example.com' LIMIT 1;
    SELECT id INTO v_client3_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'zeynep@example.com' LIMIT 1;

    -- 4. ENVANTER EKLE (Inventory)
    INSERT INTO inventory (clinic_id, name, stock, min_stock_alert, price, cost_price, unit, category, status)
    SELECT v_clinic_id, 'Botox Flakon 100iu', 12, 5, 0, 1200.00, 'Adet', 'İlaç', 'In Stock'
    WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE clinic_id = v_clinic_id AND name = 'Botox Flakon 100iu');

    -- 5. RANDEVULARI EKLE (Appointments)
    -- NOT: Randevularda tarih/saat + staff çakışması kontrol edilebilir ama demo için basitçe 
    -- o gün o saatte o personele randevu yoksa ekle diyelim.
    
    -- Bugün (2 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    SELECT v_clinic_id, v_client1_id, v_owner_id, v_service_botox_id, CURRENT_DATE, '10:00:00', 'Scheduled', 'Rötuş yapılacak'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_owner_id AND date = CURRENT_DATE AND time = '10:00:00');

    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    SELECT v_clinic_id, v_client2_id, v_staff_id, v_service_consult_id, CURRENT_DATE, '14:30:00', 'Confirmed', 'ilk görüşme'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_staff_id AND date = CURRENT_DATE AND time = '14:30:00');

    -- Yarın (1 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    SELECT v_clinic_id, v_client3_id, v_owner_id, v_service_filler_id, CURRENT_DATE + 1, '11:00:00', 'Scheduled', 'Yeni dolgu randevusu'
    WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE staff_id = v_owner_id AND date = (CURRENT_DATE + 1) AND time = '11:00:00');

    RAISE NOTICE 'Seed Data (Idempotent) başarıyla eklendi/güncellendi!';
END $$;
