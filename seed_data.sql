-- ============================================================================
-- VELARA/DERMDESK - SEED DATA (Test Verileri v2 - Fixed)
-- ============================================================================
-- Bu script, veritabanını test etmek için yapay veriler ekler.
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
    -- Multi-row insert yapıyoruz, RETURNING kullanmıyoruz çünkü hata veriyor.
    INSERT INTO services (clinic_id, name, description, duration_min, price, color)
    VALUES 
        (v_clinic_id, 'Botoks (Tüm Yüz)', 'Kırışıklık tedavisi', 30, 3500.00, 'blue'),
        (v_clinic_id, 'Dudak Dolgusu', '1ml Hyaluronik asit', 45, 6000.00, 'purple'),
        (v_clinic_id, 'Cilt Bakımı', 'Derinlemesine temizlik ve hydrafacial', 60, 1500.00, 'green'),
        (v_clinic_id, 'Ücretsiz Konsültasyon', 'İlk muayene ve planlama', 15, 0.00, 'gray');

    -- ID'leri isimlerle yakalayalım
    SELECT id INTO v_service_botox_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Botoks (Tüm Yüz)' LIMIT 1;
    SELECT id INTO v_service_filler_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Dudak Dolgusu' LIMIT 1;
    SELECT id INTO v_service_consult_id FROM services WHERE clinic_id = v_clinic_id AND name = 'Ücretsiz Konsültasyon' LIMIT 1;

    -- 3. MÜŞTERİLERİ EKLE (Clients)
    INSERT INTO clients (clinic_id, first_name, last_name, email, phone, status, notes)
    VALUES
        (v_clinic_id, 'Ayşe', 'Yılmaz', 'ayse@example.com', '905551112233', 'Active', 'Botoks takibi gerekiyor.'),
        (v_clinic_id, 'Mehmet', 'Demir', 'mehmet@example.com', '905552223344', 'Active', 'Cilt hassasiyeti var.'),
        (v_clinic_id, 'Zeynep', 'Kaya', 'zeynep@example.com', '905553334455', 'Active', 'Düzenli müşteri.'),
        (v_clinic_id, 'Can', 'Öztürk', 'can@example.com', '905554445566', 'Active', 'Yeni kayıt.');
    
    SELECT id INTO v_client1_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'ayse@example.com' LIMIT 1;
    SELECT id INTO v_client2_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'mehmet@example.com' LIMIT 1;
    SELECT id INTO v_client3_id FROM clients WHERE clinic_id = v_clinic_id AND email = 'zeynep@example.com' LIMIT 1;

    -- 4. ENVANTER EKLE (Inventory)
    INSERT INTO inventory (clinic_id, name, stock, min_stock_alert, price, cost_price, unit, category, status)
    VALUES
        (v_clinic_id, 'Botox Flakon 100iu', 12, 5, 0, 1200.00, 'Adet', 'İlaç', 'In Stock'),
        (v_clinic_id, 'Juvederm Dolgu 1ml', 8, 3, 0, 2500.00, 'Kutu', 'Medikal', 'In Stock'),
        (v_clinic_id, 'Cilt Temizleme Jeli', 25, 10, 450.00, 150.00, 'Şişe', 'Kozmetik', 'In Stock'),
        (v_clinic_id, 'Güneş Kremi SPF50', 5, 10, 600.00, 200.00, 'Tüp', 'Kozmetik', 'Low Stock');

    -- 5. RANDEVULARI EKLE (Appointments)
    -- Bugün (2 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    VALUES
        (v_clinic_id, v_client1_id, v_owner_id, v_service_botox_id, CURRENT_DATE, '10:00:00', 'Scheduled', 'Rötuş yapılacak'),
        (v_clinic_id, v_client2_id, v_staff_id, v_service_consult_id, CURRENT_DATE, '14:30:00', 'Confirmed', 'İlk görüşme');

    -- Yarın (1 Randevu)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status)
    VALUES
        (v_clinic_id, v_client3_id, v_owner_id, v_service_filler_id, CURRENT_DATE + 1, '11:00:00', 'Scheduled');

    -- Geçmiş (Tamamlanmış)
    INSERT INTO appointments (clinic_id, client_id, staff_id, service_id, date, time, status, notes)
    VALUES
        (v_clinic_id, v_client1_id, v_owner_id, v_service_consult_id, CURRENT_DATE - 5, '09:00:00', 'Completed', 'Hasta memnun kaldı.');

    -- 6. DİĞER VERİLER (Finansal Hareketler vb.)
    INSERT INTO transactions (clinic_id, type, amount, category, date, description, payment_method)
    VALUES
        (v_clinic_id, 'income', 3500.00, 'Hizmet', CURRENT_DATE - 5, 'Botoks Ödemesi - Ayşe Yılmaz', 'Kredi Kartı'),
        (v_clinic_id, 'expense', 12000.00, 'Stok', CURRENT_DATE - 2, 'İlaç Alımı', 'Havale');

    RAISE NOTICE 'Seed Data başarıyla eklendi!';
END $$;
