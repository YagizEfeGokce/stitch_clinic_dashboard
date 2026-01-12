# Dermdesk Deployment Guide (Vercel)

Dermdesk projesini canlıya almak için aşağıdaki adımları takip edebilirsiniz.

## 1. Hazırlık

Projeniz teknik olarak hazırdır ve `master_schema` ile tüm veritabanı ayarları tekil hale getirilmiştir.
"Mock Payment" modu aktiftir, yani kullanıcılar ödeme ekranını görecek ancak kart bilgisi girmeden "Test Başarılı" diyerek geçebilecektir (Beta Süreci).

## 2. Vercel Kurulumu (Manuel Yükleme)

Bilgisayarınızdaki klasörü doğrudan Vercel'e yüklemek için `Vercel CLI` kullanacağız.

1. Bilgisayarınızda terminali açın.
2. `npm install -g vercel` komutunu çalıştırın.
3. Proje klasörüne gidin: `cd c:\Users\relre\OneDrive\Masaüstü\CRM\stitch_clinic_dashboard`
4. `vercel login` komutunu çalıştırın ve giriş yapın.
5. `vercel` komutunu çalıştırın ve soruları şöyle yanıtlayın:
    * Set up and deploy? **Y**
    * Which scope? **(Enter ile geçin)**
    * Link to existing project? **N**
    * Project name? **dermdesk**
    * In which directory? **./**
    * Want to modify these settings? **N**

## 3. Ortam Değişkenleri (Environment Variables)

Projenizin çalışması için aşağıdaki anahtarları Vercel panelinden eklemeniz gerekir.

**Vercel Dashboard > Dermdesk > Settings > Environment Variables** menüsüne gidin:

| Key | Value | Not |

|TestKey|TestValue|This is a Test|
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `https://kkigrfdlctwdreqklrpq.supabase.co` | `.env` dosyanızda mevcut |
| `VITE_SUPABASE_ANON_KEY` | `(Sizin Anon Key'iniz)` | `.env` dosyanızda mevcut |
| `VITE_RESEND_API_KEY` | `re_RXQhVLDW_AV7fZCyGBGosbf26fTK64d6y` | Email servisi için |

## 4. Edge Functions (Email)

Email servisinin çalışması için Supabase tarafında da bir ayar gerekmektedir. Ancak şu an Edge Function kodunu sadece oluşturduk, deploy etmedik.

Terminalde şu komutu çalıştırarak fonksiyonu Supabase'e yükleyin:
`npx supabase functions deploy send-invite`

Bu komut sizden Access Token isteyebilir.

## 5. Canlı Test

Deploy bittikten sonra size `https://dermdesk.vercel.app` gibi bir link verilecek.

1. Girin ve "Kayıt Ol" deyin.
2. Ödeme sayfasını test edin (Mock olduğu için geçecektir).
3. Ayarlar > Ekip sayfasından kendinize bir davet atın.
