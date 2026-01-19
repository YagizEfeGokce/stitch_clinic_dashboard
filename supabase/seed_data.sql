-- ============================================================================
-- DERMDESK COMPREHENSIVE SEED DATA
-- Realistic Turkish Aesthetic Clinic Data
-- ============================================================================
-- Run this AFTER your schema is set up
-- This will create a demo clinic with 6 months of history
-- ============================================================================

-- Start transaction
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
-- 2. CREATE DEMO USERS & PROFILES
-- ============================================================================

INSERT INTO public.profiles (
    id,
    clinic_id,
    full_name,
    first_name,
    role,
    email,
    has_completed_onboarding,
    created_at
) VALUES 
-- Owner/Admin
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Dr. Ayşe Demir',
    'Ayşe',
    'owner',
    'ayse.demir@guzellikmerkezi.com',
    true,
    now() - interval '2 years'
),
-- Doctor
(
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Dr. Merve Şahin',
    'Merve',
    'doctor',
    'merve.sahin@guzellikmerkezi.com',
    true,
    now() - interval '8 months'
),
-- Staff Members
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Zeynep Yılmaz',
    'Zeynep',
    'staff',
    'zeynep.yilmaz@guzellikmerkezi.com',
    true,
    now() - interval '1 year'
),
(
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Elif Kaya',
    'Elif',
    'staff',
    'elif.kaya@guzellikmerkezi.com',
    true,
    now() - interval '1 year'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE SERVICES
-- ============================================================================

INSERT INTO public.services (
    id,
    clinic_id,
    name,
    description,
    duration_min,
    price,
    color,
    active,
    created_at
) VALUES
-- Yüz Bakımı
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Hydrafacial', 'Derin temizlik ve nemlendirme tedavisi', 60, 1500.00, '#3b82f6', true, now() - interval '2 years'),
('a0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Medikal Cilt Bakımı', 'Kişiye özel cilt analizi ve bakım', 45, 800.00, '#06b6d4', true, now() - interval '2 years'),
('a0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Altın Yüz Bakımı', 'Premium altın içerikli anti-aging bakım', 90, 2500.00, '#f59e0b', true, now() - interval '2 years'),
-- Dolgu & Botox
('a0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Botox (Alın)', 'Botulinum toksin uygulaması - alın bölgesi', 20, 2000.00, '#8b5cf6', true, now() - interval '2 years'),
('a0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Dudak Dolgusu', 'Hyalüronik asit ile dudak dolgusu', 30, 3500.00, '#ec4899', true, now() - interval '2 years'),
('a0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Yanak Dolgusu', 'Yüz hatlarını belirginleştirme', 40, 4000.00, '#f97316', true, now() - interval '2 years'),
-- Lazer Tedaviler
('a0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Lazer Epilasyon (Tüm Vücut)', 'Diode lazer ile kalıcı epilasyon', 120, 1200.00, '#ef4444', true, now() - interval '2 years'),
('a0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Lazer Epilasyon (Bacak)', 'Bacak bölgesi lazer epilasyon', 45, 500.00, '#dc2626', true, now() - interval '2 years'),
('a0000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Akne İzi Tedavisi', 'Fraksiyonel lazer ile akne izi giderme', 60, 2200.00, '#10b981', true, now() - interval '2 years'),
-- Cilt Gençleştirme
('a0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'PRP Tedavisi', 'Kendi kanınızdan elde edilen plazma ile gençleştirme', 60, 1800.00, '#14b8a6', true, now() - interval '2 years'),
('a0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Mezoterapi', 'Vitamin kokteylli cilt gençleştirme', 45, 1200.00, '#06b6d4', true, now() - interval '2 years'),
('a0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'İpek Kirpik', 'Kalıcı kirpik uzatma', 90, 800.00, '#a855f7', true, now() - interval '1 year'),
-- Vücut Bakımı
('a0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Bölgesel Zayıflama', 'Kavitasyon ile bölgesel incelme', 60, 1000.00, '#f97316', true, now() - interval '2 years'),
('a0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'G5 Masajı', 'Selülit ve sıkılaştırma masajı', 45, 600.00, '#84cc16', true, now() - interval '2 years'),
('a0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Radyofrekans', 'Cilt sıkılaştırma tedavisi', 60, 1500.00, '#eab308', true, now() - interval '2 years')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE CLIENTS (60 realistic Turkish clients)
-- ============================================================================

INSERT INTO public.clients (
    id,
    clinic_id,
    first_name,
    last_name,
    phone,
    email,
    birth_date,
    gender,
    notes,
    status,
    created_at
) VALUES
-- VIP Müşteriler (ilk 10)
('c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Aylin', 'Özkan', '0532 456 7890', 'aylin.ozkan@email.com', '1985-03-15', 'Kadın', 'VIP müşteri - Aylık düzenli bakım', 'Active', now() - interval '18 months'),
('c0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Selin', 'Arslan', '0533 567 8901', 'selin.arslan@email.com', '1990-07-22', 'Kadın', 'Hydrafacial ve botox tercih ediyor', 'Active', now() - interval '16 months'),
('c0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Deniz', 'Yıldız', '0534 678 9012', 'deniz.yildiz@email.com', '1988-11-30', 'Kadın', 'Lazer epilasyon paketi', 'Active', now() - interval '15 months'),
('c0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Elif', 'Kara', '0535 789 0123', 'elif.kara@email.com', '1992-05-18', 'Kadın', 'Cilt bakımı ve dolgu', 'Active', now() - interval '14 months'),
('c0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Zeynep', 'Demirtaş', '0536 890 1234', 'zeynep.demirtas@email.com', '1987-09-25', 'Kadın', 'Anti-aging programı', 'Active', now() - interval '13 months'),
('c0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Burcu', 'Aydın', '0537 901 2345', 'burcu.aydin@email.com', '1991-01-12', 'Kadın', 'Mezoterapi seansları', 'Active', now() - interval '12 months'),
('c0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Canan', 'Şen', '0538 012 3456', 'canan.sen@email.com', '1989-04-08', 'Kadın', 'Lazer ve cilt bakımı', 'Active', now() - interval '11 months'),
('c0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Gamze', 'Polat', '0539 123 4567', 'gamze.polat@email.com', '1993-06-14', 'Kadın', 'Dudak dolgusu takibi', 'Active', now() - interval '10 months'),
('c0000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Hande', 'Çelik', '0541 234 5678', 'hande.celik@email.com', '1986-12-20', 'Kadın', 'Botox ve PRP kombinasyonu', 'Active', now() - interval '9 months'),
('c0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'İpek', 'Koç', '0542 345 6789', 'ipek.koc@email.com', '1994-02-28', 'Kadın', 'Kirpik ve cilt bakımı', 'Active', now() - interval '8 months'),
-- Düzenli Müşteriler (11-30)
('c0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Merve', 'Aksoy', '0543 456 7891', 'merve.aksoy@email.com', '1990-08-10', 'Kadın', 'Aylık yüz bakımı', 'Active', now() - interval '7 months'),
('c0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Seda', 'Yavuz', '0544 567 8902', 'seda.yavuz@email.com', '1988-03-22', 'Kadın', 'Lazer epilasyon', 'Active', now() - interval '6 months'),
('c0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Aslı', 'Öztürk', '0545 678 9013', 'asli.ozturk@email.com', '1992-11-05', 'Kadın', NULL, 'Active', now() - interval '6 months'),
('c0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Gizem', 'Kurt', '0546 789 0124', 'gizem.kurt@email.com', '1991-07-18', 'Kadın', 'Cilt bakımı', 'Active', now() - interval '5 months'),
('c0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Esra', 'Özdemir', '0547 890 1235', 'esra.ozdemir@email.com', '1989-01-30', 'Kadın', NULL, 'Active', now() - interval '5 months'),
('c0000016-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'Dilek', 'Şahin', '0548 901 2346', 'dilek.sahin@email.com', '1987-09-12', 'Kadın', 'G5 masajı tercih ediyor', 'Active', now() - interval '4 months'),
('c0000017-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Ayşe', 'Yılmaz', '0549 012 3457', 'ayse.yilmaz@email.com', '1993-05-25', 'Kadın', NULL, 'Active', now() - interval '4 months'),
('c0000018-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'Fatma', 'Kaya', '0531 123 4568', 'fatma.kaya@email.com', '1990-12-08', 'Kadın', NULL, 'Active', now() - interval '4 months'),
('c0000019-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'Hacer', 'Demir', '0532 234 5679', 'hacer.demir@email.com', '1986-04-15', 'Kadın', 'Akne tedavisi', 'Active', now() - interval '3 months'),
('c0000020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Sibel', 'Çetin', '0533 345 6780', 'sibel.cetin@email.com', '1994-10-20', 'Kadın', NULL, 'Active', now() - interval '3 months'),
('c0000021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'Tülay', 'Erdem', '0534 456 7891', 'tulay.erdem@email.com', '1988-06-03', 'Kadın', 'Bölgesel zayıflama programı', 'Active', now() - interval '3 months'),
('c0000022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'Oya', 'Acar', '0535 567 8902', 'oya.acar@email.com', '1992-02-18', 'Kadın', NULL, 'Active', now() - interval '3 months'),
('c0000023-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'Pınar', 'Güneş', '0536 678 9013', 'pinar.gunes@email.com', '1991-08-28', 'Kadın', NULL, 'Active', now() - interval '2 months'),
('c0000024-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', 'Nihan', 'Bulut', '0537 789 0124', 'nihan.bulut@email.com', '1989-12-11', 'Kadın', 'Hydrafacial seansları', 'Active', now() - interval '2 months'),
('c0000025-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'Özge', 'Aslan', '0538 890 1235', 'ozge.aslan@email.com', '1987-04-24', 'Kadın', NULL, 'Active', now() - interval '2 months'),
('c0000026-0000-0000-0000-000000000026', '11111111-1111-1111-1111-111111111111', 'Fulya', 'Keskin', '0539 901 2346', 'fulya.keskin@email.com', '1993-01-07', 'Kadın', NULL, 'Active', now() - interval '2 months'),
('c0000027-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', 'Derya', 'Taş', '0541 012 3457', 'derya.tas@email.com', '1990-09-19', 'Kadın', 'Radyofrekans tedavisi', 'Active', now() - interval '2 months'),
('c0000028-0000-0000-0000-000000000028', '11111111-1111-1111-1111-111111111111', 'Yeşim', 'Korkmaz', '0542 123 4568', 'yesim.korkmaz@email.com', '1986-05-02', 'Kadın', NULL, 'Active', now() - interval '1 month'),
('c0000029-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111111', 'Serap', 'Doğan', '0543 234 5679', 'serap.dogan@email.com', '1994-11-16', 'Kadın', NULL, 'Active', now() - interval '1 month'),
('c0000030-0000-0000-0000-000000000030', '11111111-1111-1111-1111-111111111111', 'Berna', 'Çakır', '0544 345 6780', 'berna.cakir@email.com', '1988-07-29', 'Kadın', 'PRP ve mezoterapi', 'Active', now() - interval '1 month'),
-- Yeni Müşteriler (31-50)
('c0000031-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', 'Nilüfer', 'Erdoğan', '0545 456 7891', 'nilufer.erdogan@email.com', '1992-03-13', 'Kadın', NULL, 'Active', now() - interval '3 weeks'),
('c0000032-0000-0000-0000-000000000032', '11111111-1111-1111-1111-111111111111', 'Ayla', 'Yurt', '0546 567 8902', 'ayla.yurt@email.com', '1991-10-26', 'Kadın', NULL, 'Active', now() - interval '3 weeks'),
('c0000033-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', 'Sevgi', 'Tekin', '0547 678 9013', 'sevgi.tekin@email.com', '1989-06-09', 'Kadın', NULL, 'Active', now() - interval '2 weeks'),
('c0000034-0000-0000-0000-000000000034', '11111111-1111-1111-1111-111111111111', 'Nuray', 'Aydın', '0548 789 0124', 'nuray.aydin2@email.com', '1987-02-21', 'Kadın', 'Kirpik uygulaması', 'Active', now() - interval '2 weeks'),
('c0000035-0000-0000-0000-000000000035', '11111111-1111-1111-1111-111111111111', 'Gül', 'Kılıç', '0549 890 1235', 'gul.kilic@email.com', '1993-08-04', 'Kadın', NULL, 'Active', now() - interval '2 weeks'),
('c0000036-0000-0000-0000-000000000036', '11111111-1111-1111-1111-111111111111', 'Serpil', 'Özer', '0531 901 2346', 'serpil.ozer@email.com', '1990-04-17', 'Kadın', NULL, 'Active', now() - interval '1 week'),
('c0000037-0000-0000-0000-000000000037', '11111111-1111-1111-1111-111111111111', 'Meral', 'Bal', '0532 012 3457', 'meral.bal@email.com', '1986-12-30', 'Kadın', NULL, 'Active', now() - interval '1 week'),
('c0000038-0000-0000-0000-000000000038', '11111111-1111-1111-1111-111111111111', 'Işıl', 'Uzun', '0533 123 4569', 'isil.uzun@email.com', '1994-08-13', 'Kadın', NULL, 'Active', now() - interval '1 week'),
('c0000039-0000-0000-0000-000000000039', '11111111-1111-1111-1111-111111111111', 'Ceyda', 'Akgün', '0534 234 5670', 'ceyda.akgun@email.com', '1988-04-26', 'Kadın', NULL, 'Active', now() - interval '5 days'),
('c0000040-0000-0000-0000-000000000040', '11111111-1111-1111-1111-111111111111', 'Meltem', 'Sönmez', '0535 345 6781', 'meltem.sonmez@email.com', '1992-01-09', 'Kadın', 'İlk randevu', 'Active', now() - interval '5 days'),
('c0000041-0000-0000-0000-000000000041', '11111111-1111-1111-1111-111111111111', 'Banu', 'Ay', '0536 456 7892', 'banu.ay@email.com', '1991-09-22', 'Kadın', NULL, 'Active', now() - interval '3 days'),
('c0000042-0000-0000-0000-000000000042', '11111111-1111-1111-1111-111111111111', 'Ebru', 'Can', '0537 567 8903', 'ebru.can@email.com', '1989-05-05', 'Kadın', NULL, 'Active', now() - interval '3 days'),
('c0000043-0000-0000-0000-000000000043', '11111111-1111-1111-1111-111111111111', 'Ece', 'Dal', '0538 678 9014', 'ece.dal@email.com', '1987-01-18', 'Kadın', NULL, 'Active', now() - interval '2 days'),
('c0000044-0000-0000-0000-000000000044', '11111111-1111-1111-1111-111111111111', 'Funda', 'Er', '0539 789 0125', 'funda.er@email.com', '1993-11-01', 'Kadın', NULL, 'Active', now() - interval '2 days'),
('c0000045-0000-0000-0000-000000000045', '11111111-1111-1111-1111-111111111111', 'Gonca', 'Efe', '0541 890 1236', 'gonca.efe@email.com', '1990-07-14', 'Kadın', NULL, 'Active', now() - interval '1 day'),
('c0000046-0000-0000-0000-000000000046', '11111111-1111-1111-1111-111111111111', 'Hülya', 'Fikri', '0542 901 2347', 'hulya.fikri@email.com', '1986-03-27', 'Kadın', NULL, 'Active', now() - interval '1 day'),
('c0000047-0000-0000-0000-000000000047', '11111111-1111-1111-1111-111111111111', 'İlknur', 'Gül', '0543 012 3458', 'ilknur.gul@email.com', '1994-12-10', 'Kadın', NULL, 'Active', now() - interval '12 hours'),
('c0000048-0000-0000-0000-000000000048', '11111111-1111-1111-1111-111111111111', 'Jale', 'Han', '0544 123 4569', 'jale.han@email.com', '1988-08-23', 'Kadın', NULL, 'Active', now() - interval '6 hours'),
('c0000049-0000-0000-0000-000000000049', '11111111-1111-1111-1111-111111111111', 'Kübra', 'İnal', '0545 234 5671', 'kubra.inal@email.com', '1992-04-06', 'Kadın', NULL, 'Active', now() - interval '3 hours'),
('c0000050-0000-0000-0000-000000000050', '11111111-1111-1111-1111-111111111111', 'Yasemin', 'Ulu', '0546 345 6782', 'yasemin.ulu@email.com', '1989-06-29', 'Kadın', NULL, 'Active', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CREATE INVENTORY ITEMS
-- ============================================================================

INSERT INTO public.inventory (
    id,
    clinic_id,
    name,
    sku,
    category,
    stock,
    min_stock_alert,
    unit_cost,
    price,
    description,
    created_at
) VALUES
-- Cilt Bakım Ürünleri
('i0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Hydrafacial Serum', 'HYD-SER-001', 'Cilt Bakım', 25, 5, 150.00, 300.00, 'Hydrafacial tedavisi için özel serum', now() - interval '6 months'),
('i0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Hyalüronik Asit Dolgu 1ml', 'DOL-HA-001', 'Dolgu', 40, 10, 800.00, 1500.00, 'Premium HA dolgu malzemesi', now() - interval '6 months'),
('i0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Botox 50 Ünite', 'BOT-50-001', 'Botox', 30, 8, 600.00, 1200.00, 'Botulinum toksin 50 ünite', now() - interval '6 months'),
('i0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'PRP Kiti', 'PRP-KIT-001', 'PRP', 20, 5, 200.00, 400.00, 'PRP hazırlama kiti', now() - interval '6 months'),
('i0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Mezoterapi Kokteyl', 'MEZ-COK-001', 'Mezoterapi', 35, 8, 120.00, 250.00, 'Vitamin C ve HA içeren kokteyl', now() - interval '6 months'),
('i0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Lazer Jeli', 'LAZ-JEL-001', 'Lazer', 50, 10, 30.00, 60.00, 'Lazer epilasyon için soğutucu jel', now() - interval '6 months'),
('i0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Altın Maske', 'ALT-MAS-001', 'Cilt Bakım', 15, 3, 250.00, 500.00, 'Premium altın içerikli yüz maskesi', now() - interval '6 months'),
('i0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'İpek Kirpik Seti - C Kıvrım', 'KRP-IPK-C01', 'Kirpik', 45, 10, 80.00, 180.00, 'C kıvrım ipek kirpik seti', now() - interval '6 months'),
('i0000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'G5 Masaj Yağı', 'G5-YAG-001', 'Masaj', 30, 8, 50.00, 100.00, 'G5 masajı için özel yağ', now() - interval '6 months'),
('i0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'RF Jeli', 'RF-JEL-001', 'Radyofrekans', 40, 10, 40.00, 80.00, 'Radyofrekans uygulaması için iletken jel', now() - interval '6 months'),
('i0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Tek Kullanımlık Eldiven (100lü)', 'ELD-TEK-001', 'Sarf Malz.', 100, 20, 25.00, 50.00, 'Latex olmayan muayene eldiveni', now() - interval '6 months'),
('i0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Steril Gazlı Bez', 'GAZ-STR-001', 'Sarf Malz.', 200, 50, 5.00, 10.00, 'Steril gazlı bez paketi', now() - interval '6 months'),
-- Düşük stoklu ürünler (uyarı test için)
('i0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Anestezik Krem', 'ANE-KRM-001', 'Anestezi', 4, 5, 100.00, 200.00, 'Lokal anestezik krem', now() - interval '6 months'),
('i0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Kirpik Yapıştırıcı Pro', 'KRP-YAP-001', 'Kirpik', 3, 5, 60.00, 120.00, 'Profesyonel kirpik yapıştırıcı', now() - interval '6 months'),
-- Stok bitti
('i0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Premium Dudak Dolgusu', 'DOL-DUD-001', 'Dolgu', 0, 3, 1200.00, 2000.00, 'Özel formül dudak dolgusu', now() - interval '6 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. GENERATE HISTORICAL APPOINTMENTS (6 months)
-- ============================================================================
-- This creates ~300 historical appointments with realistic patterns

-- Create temporary function to generate appointments
DO $$
DECLARE
    v_date DATE;
    v_time TIME;
    v_client_id UUID;
    v_service_id UUID;
    v_staff_id UUID;
    v_status TEXT;
    v_day_of_week INT;
    v_appointments_per_day INT;
    v_i INT;
    v_hour INT;
    v_minute INT;
    v_client_ids UUID[] := ARRAY[
        'c0000001-0000-0000-0000-000000000001'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid,
        'c0000003-0000-0000-0000-000000000003'::uuid, 'c0000004-0000-0000-0000-000000000004'::uuid,
        'c0000005-0000-0000-0000-000000000005'::uuid, 'c0000006-0000-0000-0000-000000000006'::uuid,
        'c0000007-0000-0000-0000-000000000007'::uuid, 'c0000008-0000-0000-0000-000000000008'::uuid,
        'c0000009-0000-0000-0000-000000000009'::uuid, 'c0000010-0000-0000-0000-000000000010'::uuid,
        'c0000011-0000-0000-0000-000000000011'::uuid, 'c0000012-0000-0000-0000-000000000012'::uuid,
        'c0000013-0000-0000-0000-000000000013'::uuid, 'c0000014-0000-0000-0000-000000000014'::uuid,
        'c0000015-0000-0000-0000-000000000015'::uuid, 'c0000016-0000-0000-0000-000000000016'::uuid,
        'c0000017-0000-0000-0000-000000000017'::uuid, 'c0000018-0000-0000-0000-000000000018'::uuid,
        'c0000019-0000-0000-0000-000000000019'::uuid, 'c0000020-0000-0000-0000-000000000020'::uuid
    ];
    v_service_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid,
        'a0000003-0000-0000-0000-000000000003'::uuid, 'a0000004-0000-0000-0000-000000000004'::uuid,
        'a0000005-0000-0000-0000-000000000005'::uuid, 'a0000006-0000-0000-0000-000000000006'::uuid,
        'a0000007-0000-0000-0000-000000000007'::uuid, 'a0000008-0000-0000-0000-000000000008'::uuid,
        'a0000009-0000-0000-0000-000000000009'::uuid, 'a0000010-0000-0000-0000-000000000010'::uuid,
        'a0000011-0000-0000-0000-000000000011'::uuid, 'a0000012-0000-0000-0000-000000000012'::uuid,
        'a0000013-0000-0000-0000-000000000013'::uuid, 'a0000014-0000-0000-0000-000000000014'::uuid,
        'a0000015-0000-0000-0000-000000000015'::uuid
    ];
    v_staff_ids UUID[] := ARRAY[
        '22222222-2222-2222-2222-222222222222'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid
    ];
BEGIN
    -- Loop through last 180 days (6 months)
    FOR v_date IN SELECT generate_series(CURRENT_DATE - 180, CURRENT_DATE - 1, '1 day'::interval)::date LOOP
        v_day_of_week := EXTRACT(DOW FROM v_date);
        
        -- Skip Sundays (0)
        IF v_day_of_week = 0 THEN
            CONTINUE;
        END IF;
        
        -- Determine appointments per day (busier on weekdays)
        IF v_day_of_week = 6 THEN
            v_appointments_per_day := 3 + floor(random() * 3)::int; -- Saturday: 3-5
        ELSE
            v_appointments_per_day := 5 + floor(random() * 5)::int; -- Weekday: 5-9
        END IF;
        
        -- Generate appointments for this day
        FOR v_i IN 1..v_appointments_per_day LOOP
            -- Random time between 09:00 and 18:00
            v_hour := 9 + floor(random() * 9)::int;
            v_minute := (floor(random() * 4)::int) * 15; -- 0, 15, 30, or 45
            v_time := (v_hour || ':' || lpad(v_minute::text, 2, '0'))::time;
            
            -- Random client, service, staff
            v_client_id := v_client_ids[1 + floor(random() * array_length(v_client_ids, 1))::int];
            v_service_id := v_service_ids[1 + floor(random() * array_length(v_service_ids, 1))::int];
            v_staff_id := v_staff_ids[1 + floor(random() * array_length(v_staff_ids, 1))::int];
            
            -- Status (historical appointments are mostly completed)
            IF random() < 0.85 THEN
                v_status := 'Completed';
            ELSIF random() < 0.5 THEN
                v_status := 'Cancelled';
            ELSE
                v_status := 'No-Show';
            END IF;
            
            -- Insert appointment
            INSERT INTO public.appointments (
                clinic_id, client_id, service_id, staff_id,
                date, time, status, created_at
            ) VALUES (
                '11111111-1111-1111-1111-111111111111',
                v_client_id, v_service_id, v_staff_id,
                v_date, v_time, v_status, v_date::timestamp
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 7. CREATE FUTURE APPOINTMENTS (Next 2 weeks)
-- ============================================================================

DO $$
DECLARE
    v_date DATE;
    v_time TIME;
    v_client_id UUID;
    v_service_id UUID;
    v_staff_id UUID;
    v_status TEXT;
    v_day_of_week INT;
    v_appointments_per_day INT;
    v_i INT;
    v_hour INT;
    v_minute INT;
    v_client_ids UUID[] := ARRAY[
        'c0000001-0000-0000-0000-000000000001'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid,
        'c0000003-0000-0000-0000-000000000003'::uuid, 'c0000004-0000-0000-0000-000000000004'::uuid,
        'c0000005-0000-0000-0000-000000000005'::uuid, 'c0000031-0000-0000-0000-000000000031'::uuid,
        'c0000032-0000-0000-0000-000000000032'::uuid, 'c0000033-0000-0000-0000-000000000033'::uuid,
        'c0000034-0000-0000-0000-000000000034'::uuid, 'c0000035-0000-0000-0000-000000000035'::uuid
    ];
    v_service_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid,
        'a0000004-0000-0000-0000-000000000004'::uuid, 'a0000005-0000-0000-0000-000000000005'::uuid,
        'a0000010-0000-0000-0000-000000000010'::uuid, 'a0000011-0000-0000-0000-000000000011'::uuid,
        'a0000012-0000-0000-0000-000000000012'::uuid
    ];
    v_staff_ids UUID[] := ARRAY[
        '22222222-2222-2222-2222-222222222222'::uuid,
        '55555555-5555-5555-5555-555555555555'::uuid
    ];
BEGIN
    -- Today's appointments
    FOR v_i IN 1..6 LOOP
        v_hour := 9 + (v_i * 1.5)::int;
        v_minute := (floor(random() * 2)::int) * 30;
        v_time := (v_hour || ':' || lpad(v_minute::text, 2, '0'))::time;
        
        v_client_id := v_client_ids[1 + floor(random() * array_length(v_client_ids, 1))::int];
        v_service_id := v_service_ids[1 + floor(random() * array_length(v_service_ids, 1))::int];
        v_staff_id := v_staff_ids[1 + floor(random() * array_length(v_staff_ids, 1))::int];
        
        IF random() < 0.7 THEN
            v_status := 'Confirmed';
        ELSE
            v_status := 'Scheduled';
        END IF;
        
        INSERT INTO public.appointments (
            clinic_id, client_id, service_id, staff_id,
            date, time, status, created_at
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            v_client_id, v_service_id, v_staff_id,
            CURRENT_DATE, v_time, v_status, now() - interval '2 days'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Next 14 days
    FOR v_date IN SELECT generate_series(CURRENT_DATE + 1, CURRENT_DATE + 14, '1 day'::interval)::date LOOP
        v_day_of_week := EXTRACT(DOW FROM v_date);
        
        IF v_day_of_week = 0 THEN CONTINUE; END IF;
        
        IF v_day_of_week = 6 THEN
            v_appointments_per_day := 2 + floor(random() * 3)::int;
        ELSE
            v_appointments_per_day := 4 + floor(random() * 4)::int;
        END IF;
        
        FOR v_i IN 1..v_appointments_per_day LOOP
            v_hour := 9 + floor(random() * 9)::int;
            v_minute := (floor(random() * 4)::int) * 15;
            v_time := (v_hour || ':' || lpad(v_minute::text, 2, '0'))::time;
            
            v_client_id := v_client_ids[1 + floor(random() * array_length(v_client_ids, 1))::int];
            v_service_id := v_service_ids[1 + floor(random() * array_length(v_service_ids, 1))::int];
            v_staff_id := v_staff_ids[1 + floor(random() * array_length(v_staff_ids, 1))::int];
            
            IF random() < 0.5 THEN
                v_status := 'Confirmed';
            ELSE
                v_status := 'Scheduled';
            END IF;
            
            INSERT INTO public.appointments (
                clinic_id, client_id, service_id, staff_id,
                date, time, status, created_at
            ) VALUES (
                '11111111-1111-1111-1111-111111111111',
                v_client_id, v_service_id, v_staff_id,
                v_date, v_time, v_status, now() - interval '1 week'
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 8. CREATE FINANCIAL TRANSACTIONS
-- ============================================================================
-- Generate transactions for completed appointments

INSERT INTO public.transactions (
    clinic_id,
    client_id,
    appointment_id,
    type,
    amount,
    payment_method,
    description,
    date,
    created_at
)
SELECT
    a.clinic_id,
    a.client_id,
    a.id,
    'income',
    s.price,
    CASE 
        WHEN random() < 0.6 THEN 'Kredi Kartı'
        WHEN random() < 0.85 THEN 'Nakit'
        ELSE 'Havale/EFT'
    END,
    s.name || ' - ' || c.first_name || ' ' || c.last_name,
    a.date,
    a.created_at
FROM public.appointments a
JOIN public.services s ON a.service_id = s.id
JOIN public.clients c ON a.client_id = c.id
WHERE a.status = 'Completed'
  AND a.clinic_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- Add some expense transactions
INSERT INTO public.transactions (
    clinic_id,
    type,
    amount,
    payment_method,
    category,
    description,
    date,
    created_at
) VALUES
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Ocak ayı kira ödemesi', CURRENT_DATE - interval '5 months', now() - interval '5 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Şubat ayı kira ödemesi', CURRENT_DATE - interval '4 months', now() - interval '4 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Mart ayı kira ödemesi', CURRENT_DATE - interval '3 months', now() - interval '3 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Nisan ayı kira ödemesi', CURRENT_DATE - interval '2 months', now() - interval '2 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Mayıs ayı kira ödemesi', CURRENT_DATE - interval '1 month', now() - interval '1 month'),
('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Havale/EFT', 'Kira', 'Haziran ayı kira ödemesi', CURRENT_DATE, now()),
('11111111-1111-1111-1111-111111111111', 'expense', 12000.00, 'Havale/EFT', 'Ürün Alımı', 'Dolgu ve Botox malzeme siparişi', CURRENT_DATE - interval '3 months', now() - interval '3 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 8500.00, 'Havale/EFT', 'Ürün Alımı', 'Cilt bakım ürünleri stoku', CURRENT_DATE - interval '2 months', now() - interval '2 months'),
('11111111-1111-1111-1111-111111111111', 'expense', 3200.00, 'Nakit', 'Faturalar', 'Elektrik ve su faturaları', CURRENT_DATE - interval '1 month', now() - interval '1 month'),
('11111111-1111-1111-1111-111111111111', 'expense', 2800.00, 'Kredi Kartı', 'Ekipman', 'Lazer başlığı bakımı', CURRENT_DATE - interval '2 weeks', now() - interval '2 weeks')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. CREATE REVIEWS
-- ============================================================================

INSERT INTO public.reviews (
    clinic_id,
    client_id,
    rating,
    comment,
    platform,
    is_public,
    created_at
) VALUES
('11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 5, 'Harika bir deneyimdi! Dr. Ayşe Hanım çok ilgili ve profesyonel. Hydrafacial sonrası cildim gözle görülür şekilde iyileşti.', 'Google', true, now() - interval '5 months'),
('11111111-1111-1111-1111-111111111111', 'c0000002-0000-0000-0000-000000000002', 5, 'Botox uygulaması için geldim, sonuçlar mükemmel! Çok doğal bir görüntü elde ettim.', 'Google', true, now() - interval '4 months'),
('11111111-1111-1111-1111-111111111111', 'c0000003-0000-0000-0000-000000000003', 4, 'Lazer epilasyon seanslarım devam ediyor. Şimdiye kadar çok memnunum, sonuçlar tatmin edici.', 'Instagram', true, now() - interval '4 months'),
('11111111-1111-1111-1111-111111111111', 'c0000004-0000-0000-0000-000000000004', 5, 'Dudak dolgusu için çok endişeliydim ama Zeynep Hanım beni çok rahatlattı. Sonuç doğal ve zarif.', 'Google', true, now() - interval '3 months'),
('11111111-1111-1111-1111-111111111111', 'c0000005-0000-0000-0000-000000000005', 5, 'Anti-aging programına başladım, PRP ve mezoterapi kombinasyonu harikalar yarattı!', 'Google', true, now() - interval '3 months'),
('11111111-1111-1111-1111-111111111111', 'c0000006-0000-0000-0000-000000000006', 4, 'Temiz ve modern bir klinik. Randevu sistemi çok pratik.', 'Instagram', true, now() - interval '2 months'),
('11111111-1111-1111-1111-111111111111', 'c0000007-0000-0000-0000-000000000007', 5, 'Akne izlerim için fraksiyonel lazer yaptırdım. 3 seans sonunda ciddi bir iyileşme var.', 'Google', true, now() - interval '2 months'),
('11111111-1111-1111-1111-111111111111', 'c0000008-0000-0000-0000-000000000008', 5, 'Güzellik Merkezi Nişantaşı''nı kesinlikle tavsiye ederim. Profesyonel ekip ve kaliteli hizmet.', 'Google', true, now() - interval '1 month'),
('11111111-1111-1111-1111-111111111111', 'c0000009-0000-0000-0000-000000000009', 4, 'İpek kirpik uygulaması için geldim. Çok güzel ve doğal oldu. Tek eksik biraz bekleme süresi.', 'Instagram', true, now() - interval '3 weeks'),
('11111111-1111-1111-1111-111111111111', 'c0000010-0000-0000-0000-000000000010', 5, 'Altın yüz bakımı gerçekten lüks bir deneyim. Cildim hiç bu kadar parlak olmamıştı!', 'Google', true, now() - interval '2 weeks')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. CREATE ACTIVITY LOG ENTRIES
-- ============================================================================

INSERT INTO public.activity_log (
    clinic_id,
    user_id,
    action,
    details,
    created_at
) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Giriş Yapıldı', '{"ip": "192.168.1.100"}', now() - interval '2 hours'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Randevu Oluşturuldu', '{"client_name": "Aylin Özkan", "service": "Hydrafacial"}', now() - interval '1 hour'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Randevu Tamamlandı', '{"client_name": "Selin Arslan", "service": "Botox"}', now() - interval '30 minutes'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Müşteri Eklendi', '{"client_name": "Yasemin Ulu"}', now() - interval '15 minutes'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Stok Güncellendi', '{"item": "Hyalüronik Asit Dolgu", "change": -1}', now() - interval '10 minutes')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This seed script creates:
-- ✓ 1 Demo Clinic (Istanbul aesthetic clinic)
-- ✓ 4 Staff Members (1 owner, 1 doctor, 2 staff)
-- ✓ 15 Services (facial, botox, laser, body treatments)
-- ✓ 50 Clients (with realistic Turkish names)
-- ✓ 15 Inventory Items (with low stock alerts)
-- ✓ ~300 Historical Appointments (6 months)
-- ✓ ~60 Future Appointments (2 weeks)
-- ✓ Financial Transactions (matching completed appointments)
-- ✓ 10 Client Reviews
-- ✓ Recent Activity Log entries
-- ============================================================================
