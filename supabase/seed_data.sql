-- ============================================================================
-- DERMDESK COMPREHENSIVE SEED DATA (EXPANDED)
-- Realistic Turkish Aesthetic Clinic Data
-- ============================================================================
-- This script safely populates:
-- 1. Demo Clinic
-- 2. Services (Treatments)
-- 3. Clients (~150 Turkish profiles)
-- 4. Inventory (Products & Stock)
-- 5. Appointments (Historical & Future)
-- 6. Transactions (Financial Records)
-- 7. Reviews
-- 8. User Linking (yagizefegokce2416@gmail.com)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE DEMO CLINIC
-- ============================================================================

INSERT INTO public.clinics (
    id,
    name,
    branding_config,
    settings_config,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Güzellik Merkezi - Nişantaşı',
    '{
        "logo_url": null,
        "primary_color": "#14b8a6",
        "secondary_color": "#0f766e"
    }'::jsonb,
    '{
        "address": "Teşvikiye Mah. Valikonağı Cad. No:45/7, Nişantaşı, Şişli/İstanbul",
        "phone": "+90 212 555 1234",
        "email": "info@guzellikmerkezi.com",
        "website": "www.guzellikmerkezi.com",
        "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "working_start_hour": "09:00",
        "working_end_hour": "19:00"
    }'::jsonb,
    now() - interval '2 years'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    branding_config = EXCLUDED.branding_config,
    settings_config = EXCLUDED.settings_config;

-- ============================================================================
-- 2. CREATE SERVICES
-- ============================================================================

INSERT INTO public.services (id, clinic_id, name, description, duration_min, price, color, active, created_at) VALUES
-- Yüz Bakımı
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Hydrafacial', 'Derin temizlik ve nemlendirme tedavisi', 60, 1500.00, '#3b82f6', true, now() - interval '2 years'),
('a0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Medikal Cilt Bakımı', 'Kişiye özel cilt analizi ve bakım', 45, 800.00, '#06b6d4', true, now() - interval '2 years'),
('a0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Altın Yüz Bakımı', 'Premium altın içerikli anti-aging bakım', 90, 2500.00, '#f59e0b', true, now() - interval '2 years'),
('a0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Dermapen', 'Mikro iğneleme ile cilt yenileme', 45, 1200.00, '#ef4444', true, now() - interval '2 years'),
('a0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Kimyasal Peeling', 'Leke ve iz tedavisi için soyma işlemi', 30, 900.00, '#8b5cf6', true, now() - interval '2 years'),

-- Enjeksiyonlar
('a0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Botox (Tüm Yüz)', 'Alın, kaş arası ve göz çevresi', 30, 3500.00, '#8b5cf6', true, now() - interval '2 years'),
('a0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Dudak Dolgusu', '1ml Hyalüronik asit dolgu', 30, 4500.00, '#ec4899', true, now() - interval '2 years'),
('a0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Çene Dolgusu', 'Jawline hattı belirginleştirme', 45, 5000.00, '#f97316', true, now() - interval '2 years'),
('a0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Göz Altı Işık Dolgusu', 'Göz altı morlukları için tedavi', 45, 4000.00, '#10b981', true, now() - interval '2 years'),
('a0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'PRP Yüz', 'Kendi kanınızla cilt gençleştirme', 60, 2000.00, '#14b8a6', true, now() - interval '2 years'),
('a0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Mezoterapi (Gençlik Aşısı)', 'Vitamin ve mineral kokteyli', 45, 2500.00, '#06b6d4', true, now() - interval '2 years'),
('a0000016-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'Saç Mezoterapisi', 'Saç dökülmesine karşı tedavi', 45, 1500.00, '#a855f7', true, now() - interval '2 years'),

-- Lazer & Vücut
('a0000020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Lazer Epilasyon (Tüm Vücut)', 'Alexandra/Diode hibrit lazer', 90, 1500.00, '#ef4444', true, now() - interval '2 years'),
('a0000021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'Bölgesel Zayıflama (G5)', 'Selülit masajı', 45, 600.00, '#f59e0b', true, now() - interval '2 years'),
('a0000022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'Soğuk Lipoliz', 'Yağ dondurma işlemi', 60, 2000.00, '#3b82f6', true, now() - interval '2 years')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE CLIENTS (~150 Profiles)
-- ============================================================================

DO $$
DECLARE
    v_first_names_female TEXT[] := ARRAY['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Gamze', 'Esra', 'Özlem', 'Sema', 'Derya', 'Aylin', 'Selin', 'Ece', 'Melis', 'Buse', 'İrem', 'Gizem', 'Kübra', 'Büşra', 'Tuğba', 'Sibel', 'Filiz', 'Yasemin', 'Nuray', 'Sevim', 'Gülşah', 'Pınar', 'Demet', 'Arzu', 'Didem', 'Aslı', 'Banu', 'Ceren', 'Deniz', 'Duygu', 'Ebru', 'Funda', 'Gonca', 'Hande', 'Işıl', 'Jale', 'Lale', 'Mine', 'Nalan', 'Oya', 'Pelin', 'Rüya', 'Sanem'];
    v_first_names_male TEXT[] := ARRAY['Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Osman', 'Yusuf', 'Murat', 'Ömer', 'Ramazan', 'Halil', 'Süleyman', 'Abdullah', 'Mahmut', 'Salih', 'Kemal', 'Recep', 'Sinan', 'Hakan', 'Serkan', 'Metin', 'Adem', 'Fatih', 'Burak', 'Emre', 'Kaan', 'Volkan', 'Gökhan', 'Uğur', 'Tolga', 'Kerem', 'Cem', 'Ozan', 'Eren', 'Mert', 'Can', 'Barış'];
    v_last_names TEXT[] := ARRAY['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Özer', 'Yavuz', 'Can', 'Acar', 'Erdoğan', 'Yücel', 'Güler', 'Yalçın', 'Güneş', 'Ünal', 'Aksoy', 'Taş', 'Kalkan', 'Bal', 'Sönmez', 'Akgün', 'Ulu', 'Turan', 'Bulut', 'Keskin', 'Avcı', 'Işık', 'Gül'];
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
    v_first_name TEXT;
    v_last_name TEXT;
    v_email TEXT;
    v_phone TEXT;
    v_gender TEXT;
    v_status TEXT;
    v_notes TEXT;
    v_birth_date DATE;
    v_created_at TIMESTAMP;
BEGIN
    FOR i IN 1..150 LOOP
        -- Select gender and name
        IF random() < 0.85 THEN -- 85% Female clients
            v_gender := 'Kadın';
            v_first_name := v_first_names_female[1 + floor(random() * array_length(v_first_names_female, 1))::int];
        ELSE
            v_gender := 'Erkek';
            v_first_name := v_first_names_male[1 + floor(random() * array_length(v_first_names_male, 1))::int];
        END IF;
        
        v_last_name := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];
        
        -- Generate unique-ish email
        v_email := lower(replace(v_first_name, 'ı', 'i')) || '.' || lower(replace(v_last_name, 'ö', 'o')) || i || '@email.com';
        v_email := replace(v_email, 'ş', 's');
        v_email := replace(v_email, 'ğ', 'g');
        v_email := replace(v_email, 'ü', 'u');
        v_email := replace(v_email, 'ç', 'c');
        v_email := replace(v_email, 'ö', 'o');
        
        -- Phone number
        v_phone := '05' || (30 + floor(random() * 25))::int || ' ' || (100 + floor(random() * 899))::int || ' ' || (10 + floor(random() * 89))::int || (10 + floor(random() * 89))::int;
        
        -- Birth date (20-60 years old)
        v_birth_date := CURRENT_DATE - (floor(random() * 40 * 365) + 20 * 365)::int * '1 day'::interval;
        
        -- Random creation date within last 2 years
        v_created_at := now() - (floor(random() * 730))::int * '1 day'::interval;
        
        -- Notes (randomly filled)
        IF random() < 0.3 THEN
            v_notes := CASE (floor(random() * 5))::int
                WHEN 0 THEN 'Hassas cilt yapısı var'
                WHEN 1 THEN 'Öğle arası randevularını tercih ediyor'
                WHEN 2 THEN 'Botox alerjisi var mı sorulmalı'
                WHEN 3 THEN 'VIP Müşteri, kahve ikram edilmeli'
                ELSE 'Düzenli taksit ödemesi yapıyor'
            END;
        ELSE
            v_notes := NULL;
        END IF;

        IF random() < 0.9 THEN v_status := 'Active'; ELSE v_status := 'Inactive'; END IF;

        INSERT INTO public.clients (
            clinic_id, first_name, last_name, phone, email, birth_date, gender, notes, status, created_at
        ) VALUES (
            v_clinic_id, v_first_name, v_last_name, v_phone, v_email, v_birth_date, v_gender, v_notes, v_status, v_created_at
        );
    END LOOP;
END $$;

-- ============================================================================
-- 4. CREATE INVENTORY ITEMS
-- ============================================================================

INSERT INTO public.inventory (id, clinic_id, name, stock, min_stock_alert, unit, price, cost_price, sale_price, category, status, created_at) VALUES
-- Dermal Dolgular
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Juvederm Voluma (2x1ml)', 15, 5, 'kutu', 0, 3500.00, 4500.00, 'Dolgu', 'In Stock', now()),
('b0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Teosyal Kiss (2x1ml)', 20, 5, 'kutu', 0, 3200.00, 4200.00, 'Dolgu', 'In Stock', now()),
('b0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Aliaxin FL (2x1ml)', 8, 5, 'kutu', 0, 3000.00, 4000.00, 'Dolgu', 'In Stock', now()),

-- Botulinum Toksin
('b0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Botox Allergan 100iu', 35, 10, 'flakon', 0, 1800.00, 3500.00, 'Botox', 'In Stock', now()),
('b0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Dysport 500iu', 25, 8, 'flakon', 0, 2000.00, 3800.00, 'Botox', 'In Stock', now()),

-- Mezoterapi & Profesyonel Bakım
('b0000020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Jalupro Gençlik Aşısı', 40, 10, 'kutu', 0, 1500.00, 2500.00, 'Mezoterapi', 'In Stock', now()),
('b0000021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'Dermapen İğne Başlığı', 150, 30, 'adet', 0, 25.00, 0, 'Sarf Malzemesi', 'In Stock', now()),
('b0000022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'Anestol Pomad 30g', 5, 10, 'tüp', 0, 150.00, 0, 'Anestezi', 'Low Stock', now()), -- Low stock example
('b0000023-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'Hydrafacial Solüsyon Seti', 2, 3, 'set', 0, 4500.00, 0, 'Cilt Bakım', 'Low Stock', now()),

-- Satış Ürünleri
('b0000030-0000-0000-0000-000000000030', '11111111-1111-1111-1111-111111111111', 'Güneş Kremi SPF 50+', 50, 10, 'adet', 0, 250.00, 600.00, 'Perakende', 'In Stock', now()),
('b0000031-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', 'Yüz Yıkama Jeli', 30, 10, 'adet', 0, 180.00, 450.00, 'Perakende', 'In Stock', now()),
('b0000032-0000-0000-0000-000000000032', '11111111-1111-1111-1111-111111111111', 'C Vitamin Serumu', 0, 5, 'adet', 0, 400.00, 950.00, 'Perakende', 'Out of Stock', now()) -- Out of stock example
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. GENERATE APPOINTMENTS & 6. TRANSACTIONS
-- ============================================================================

DO $$
DECLARE
    v_date DATE;
    v_time TIME;
    v_client_id UUID;
    v_service_id UUID;
    v_service_price DECIMAL;
    v_service_name TEXT;
    v_status TEXT;
    v_day_of_week INT;
    v_daily_count INT;
    v_i INT;
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
    
    -- Arrays to hold IDs for random selection
    v_client_ids UUID[];
    v_service_rec RECORD;
BEGIN
    -- Get all client IDs into an array
    SELECT array_agg(id) INTO v_client_ids FROM public.clients WHERE clinic_id = v_clinic_id;

    -- Generate history: Last 6 months
    FOR v_date IN SELECT generate_series(CURRENT_DATE - 180, CURRENT_DATE + 14, '1 day'::interval)::date LOOP
        v_day_of_week := EXTRACT(DOW FROM v_date);
        
        -- Closed on Sundays (0)
        IF v_day_of_week = 0 THEN CONTINUE; END IF;
        
        -- Busy Saturdays (6), Normal Weekdays
        IF v_day_of_week = 6 THEN
            v_daily_count := 8 + floor(random() * 5)::int; -- 8-12 appointments
        ELSE
            v_daily_count := 4 + floor(random() * 6)::int; -- 4-9 appointments
        END IF;

        FOR v_i IN 1..v_daily_count LOOP
            -- Select random client
            v_client_id := v_client_ids[1 + floor(random() * array_length(v_client_ids, 1))::int];
            
            -- Select random service
            SELECT id, price, name INTO v_service_rec FROM public.services WHERE clinic_id = v_clinic_id ORDER BY random() LIMIT 1;
            
            -- Random time (09:00 - 18:00)
            v_time := make_time(9 + floor(random() * 9)::int, (floor(random()*4)*15)::int, 0);

            -- Status based on date
            IF v_date < CURRENT_DATE THEN
                IF random() < 0.85 THEN v_status := 'Completed';
                ELSIF random() < 0.6 THEN v_status := 'Cancelled';
                ELSE v_status := 'NoShow'; END IF;
            ELSE
                IF random() < 0.8 THEN v_status := 'Confirmed';
                ELSE v_status := 'Scheduled'; END IF;
            END IF;

            -- Insert Appointment
            INSERT INTO public.appointments (
                clinic_id, client_id, service_id, date, time, status, created_at
            ) VALUES (
                v_clinic_id, v_client_id, v_service_rec.id, v_date, v_time, v_status, v_date::timestamp
            );

            -- Calculate Income if Completed
            IF v_status = 'Completed' THEN
                INSERT INTO public.transactions (
                    clinic_id, client_id, type, amount, category, description, date, created_at
                ) VALUES (
                    v_clinic_id, v_client_id, 'income', v_service_rec.price, 'Hizmet', v_service_rec.name, v_date, v_date::timestamp
                );
            END IF;
            
        END LOOP;
        
        -- Add daily expenses occasionally
        IF v_date < CURRENT_DATE AND random() < 0.1 THEN
             INSERT INTO public.transactions (
                clinic_id, type, amount, category, description, date, created_at
            ) VALUES (
                v_clinic_id, 'expense', (100 + floor(random() * 2000))::numeric, 
                (ARRAY['Kira', 'Faturalar', 'Yemek', 'Temizlik', 'Ürün Alımı'])[1 + floor(random() * 5)::int],
                'Günlük/Aylık Gider', v_date, v_date::timestamp
            );
        END IF;

    END LOOP;
END $$;

-- ============================================================================
-- 7. REVIEWS
-- ============================================================================

INSERT INTO public.reviews (clinic_id, source, patient_name, rating, comment, status, date, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Google', 'Ayşe Yılmaz', 5, 'Harika bir deneyim, herkes çok ilgiliydi.', 'Read', CURRENT_DATE - 10, now() - interval '10 days'),
('11111111-1111-1111-1111-111111111111', 'Google', 'Mehmet Demir', 4, 'Sonuçlardan memnunum ama randevu saati biraz sarkt.', 'New', CURRENT_DATE - 2, now() - interval '2 days'),
('11111111-1111-1111-1111-111111111111', 'Instagram', 'Zeynep Kaya', 5, 'Dudak dolgusu için tek adresim!', 'Read', CURRENT_DATE - 25, now() - interval '25 days'),
('11111111-1111-1111-1111-111111111111', 'Website', 'Canan Çelik', 5, 'Cilt bakımından çok memnun kaldım, cildim ışıl ışıl oldu.', 'Read', CURRENT_DATE - 40, now() - interval '40 days'),
('11111111-1111-1111-1111-111111111111', 'Google', 'Elif Şahin', 3, 'İşlem iyiydi ama bekleme salonu çok kalabalıktı.', 'Read', CURRENT_DATE - 5, now() - interval '5 days');

-- ============================================================================
-- 8. LINK USER TO CLINIC
-- ============================================================================
-- If the user exists in auth.users, link them to this demo clinic as 'owner'

DO $$
DECLARE
    v_user_email TEXT := 'yagizefegokce2416@gmail.com';
    v_user_id UUID;
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Try to find the user ID from auth.users
    -- NOTE: 'auth' schema access might be restricted depending on connection role.
    -- If this fails, the user needs to manually run the update.
    
    BEGIN
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not access auth.users directly. Skipping auto-link.';
    END;

    IF v_user_id IS NOT NULL THEN
        -- Update the profile
        UPDATE public.profiles
        SET clinic_id = v_clinic_id,
            role = 'owner',
            first_name = 'Yağız Efe',
            last_name = 'Gökçe'
        WHERE id = v_user_id;
        
        RAISE NOTICE 'User % linked to clinic %', v_user_email, v_clinic_id;
    ELSE
        RAISE NOTICE 'User % not found in auth.users yet. Please sign up first.', v_user_email;
    END IF;
END $$;

COMMIT;
