# Supabase Email Templates - Türkçe

Bu dosyayı Supabase Dashboard > Authentication > Email Templates'de kullanın.

---

## 1. Confirm Signup (E-posta Onaylama)

**Subject:**

```
Dermdesk - E-posta Adresinizi Onaylayın
```

**Body (HTML):**

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; font-size: 28px; margin: 0;">Dermdesk</h1>
      <p style="color: #64748b; margin-top: 5px;">Klinik Yönetim Paneli</p>
    </div>
    
    <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 20px;">Hoş Geldiniz! 👋</h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Dermdesk'e kayıt olduğunuz için teşekkür ederiz. E-posta adresinizi onaylamak için aşağıdaki butona tıklayın:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
        E-postamı Onayla
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      Bu linkin süresi 24 saat içinde dolacaktır. Eğer bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      © 2025 Dermdesk. Tüm hakları saklıdır.
    </p>
  </div>
</div>
```

---

## 2. Reset Password (Şifre Sıfırlama)

**Subject:**

```
Dermdesk - Şifre Sıfırlama
```

**Body (HTML):**

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; font-size: 28px; margin: 0;">Dermdesk</h1>
      <p style="color: #64748b; margin-top: 5px;">Klinik Yönetim Paneli</p>
    </div>
    
    <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 20px;">Şifrenizi Sıfırlayın 🔐</h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
        Şifremi Sıfırla
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      Bu linkin süresi 1 saat içinde dolacaktır. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz - şifreniz değişmeyecektir.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      © 2025 Dermdesk. Tüm hakları saklıdır.
    </p>
  </div>
</div>
```

---

## 3. Magic Link (Sihirli Link)

**Subject:**

```
Dermdesk - Giriş Linkiniz
```

**Body (HTML):**

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; font-size: 28px; margin: 0;">Dermdesk</h1>
      <p style="color: #64748b; margin-top: 5px;">Klinik Yönetim Paneli</p>
    </div>
    
    <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 20px;">Giriş Linkiniz ✨</h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Hesabınıza giriş yapmak için aşağıdaki butona tıklayın:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
        Giriş Yap
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      Bu link yalnızca bir kez kullanılabilir ve 1 saat sonra geçersiz olacaktır.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      © 2025 Dermdesk. Tüm hakları saklıdır.
    </p>
  </div>
</div>
```

---

## 4. Invite User (Kullanıcı Daveti) - Varsa

**Subject:**

```
Dermdesk - Ekibe Davet Edildiniz!
```

**Body (HTML):**

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; font-size: 28px; margin: 0;">Dermdesk</h1>
      <p style="color: #64748b; margin-top: 5px;">Klinik Yönetim Paneli</p>
    </div>
    
    <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 20px;">Ekibe Davet Edildiniz! 🎉</h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Bir klinik yöneticisi sizi ekibe katılmaya davet etti. Daveti kabul etmek ve hesabınızı oluşturmak için aşağıdaki butona tıklayın:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
        Daveti Kabul Et
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      Bu davet 7 gün boyunca geçerlidir.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      © 2025 Dermdesk. Tüm hakları saklıdır.
    </p>
  </div>
</div>
```

---

## Supabase URL Ayarları

**Supabase Dashboard > Authentication > URL Configuration:**

1. **Site URL:** `https://dermdesk.net`

2. **Redirect URLs (her satıra bir tane):**

```
https://dermdesk.net/*
https://dermdesk.net/reset-password
https://dermdesk.net/verify-email
https://dermdesk.net/signup
http://localhost:5173/*
```

---

## Checklist

- [ ] Confirm signup template güncellendi
- [ ] Reset password template güncellendi
- [ ] Magic link template güncellendi (opsiyonel)
- [ ] Invite user template güncellendi (opsiyonel)
- [ ] Site URL ayarlandı
- [ ] Redirect URLs eklendi
- [ ] "Enable email confirmations" açıldı (opsiyonel)
