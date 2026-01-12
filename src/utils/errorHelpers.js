/**
 * Translates common Supabase and application error messages to Turkish.
 * @param {string} message - The original error message in English.
 * @returns {string} - The translated Turkish message.
 */
export const translateError = (message) => {
    if (!message) return 'Bir hata oluştu.';

    const lowerMsgs = message.toLowerCase();

    // Mapping of error substrings to Turkish messages
    const errorMap = [
        { key: 'invalid login credentials', msg: 'E-posta adresi veya şifre hatalı.' },
        { key: 'email not confirmed', msg: 'E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.' },
        { key: 'user not found', msg: 'Bu bilgilerle kayıtlı bir kullanıcı bulunamadı.' },
        { key: 'password should be at least', msg: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' },
        { key: 'already registered', msg: 'Bu e-posta adresi zaten kullanımda.' },
        { key: 'rate limit exceeded', msg: 'Çok fazla deneme yaptınız. Lütfen bir süre bekleyip tekrar deneyin.' },
        { key: 'invalid input', msg: 'Giriş bilgileri geçersiz.' },
        { key: 'duplicate key value', msg: 'Bu kayıt zaten mevcut.' },
        { key: 'permission denied', msg: 'Bu işlemi yapmaya yetkiniz yok.' },
        { key: 'too many requests', msg: 'Çok fazla istek gönderildi.' },
        { key: 'auth session missing', msg: 'Oturum süresi doldu, lütfen tekrar giriş yapın.' },
        { key: 'weak password', msg: 'Şifre çok zayıf. Daha karmaşık bir şifre seçin.' },
        { key: 'violates row-level security', msg: 'Bu veriye erişim izniniz yok (RLS).' },
        { key: 'database error', msg: 'Veritabanı bağlantı hatası.' },
        { key: 'fetch failed', msg: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.' }
    ];

    for (const { key, msg } of errorMap) {
        if (lowerMsgs.includes(key)) {
            return msg;
        }
    }

    // Default return original if no match (maybe prefixed to indicate untranslated)
    // But for better UX, we might just return the original.
    console.warn('Untranslated error:', message);
    return message;
};
