import { captureError } from '../lib/sentry';

/**
 * Translates common Supabase and application error messages to Turkish.
 * @param {string} message - The original error message in English.
 * @returns {string} - The translated Turkish message.
 */
export const translateError = (message) => {
    if (!message) return 'Bir hata oluştu.';

    const lowerMsg = message.toLowerCase();

    // Mapping of error substrings to Turkish messages (ordered by specificity)
    const errorMap = [
        // Authentication errors
        { key: 'invalid login credentials', msg: 'E-posta adresi veya şifre hatalı.' },
        { key: 'email not confirmed', msg: 'E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.' },
        { key: 'user not found', msg: 'Bu bilgilerle kayıtlı bir kullanıcı bulunamadı.' },
        { key: 'password should be at least', msg: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' },
        { key: 'already registered', msg: 'Bu e-posta adresi zaten kullanımda.' },
        { key: 'email already', msg: 'Bu e-posta adresi zaten kayıtlı.' },
        { key: 'weak password', msg: 'Şifre çok zayıf. Daha karmaşık bir şifre seçin.' },
        { key: 'invalid email', msg: 'Geçersiz e-posta adresi.' },

        // Session/Token errors
        { key: 'auth session missing', msg: 'Oturum süresi doldu, lütfen tekrar giriş yapın.' },
        { key: 'jwt expired', msg: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' },
        { key: 'invalid jwt', msg: 'Oturum geçersiz. Lütfen tekrar giriş yapın.' },
        { key: 'refresh token', msg: 'Oturum yenilenemedi. Lütfen tekrar giriş yapın.' },
        { key: 'token', msg: 'Oturum hatası. Lütfen tekrar giriş yapın.' },

        // Rate limiting
        { key: 'rate limit exceeded', msg: 'Çok fazla deneme yaptınız. Lütfen bir süre bekleyip tekrar deneyin.' },
        { key: 'too many requests', msg: 'Çok fazla istek gönderildi. Lütfen bekleyin.' },

        // Database errors - Foreign key
        { key: 'foreign key constraint', msg: 'Bu kayıt başka kayıtlarla ilişkili olduğu için silinemez.' },
        { key: 'violates foreign key', msg: 'Bu kayıt başka kayıtlarla ilişkili olduğu için silinemez.' },
        { key: 'referenced by', msg: 'Bu kayda bağlı veriler olduğu için silinemez.' },

        // Database errors - Duplicate
        { key: 'duplicate key value', msg: 'Bu kayıt zaten mevcut.' },
        { key: 'unique constraint', msg: 'Bu değer zaten kullanımda.' },
        { key: 'already exists', msg: 'Bu kayıt zaten mevcut.' },

        // Database errors - RLS/Permissions
        { key: 'violates row-level security', msg: 'Bu veriye erişim izniniz yok.' },
        { key: 'permission denied', msg: 'Bu işlemi yapmaya yetkiniz yok.' },
        { key: 'rls', msg: 'Bu veriye erişim izniniz yok.' },
        { key: 'not authorized', msg: 'Bu işlem için yetkiniz yok.' },

        // Database errors - General
        { key: 'database error', msg: 'Veritabanı hatası oluştu.' },
        { key: 'not found', msg: 'Kayıt bulunamadı.' },
        { key: 'invalid input', msg: 'Giriş bilgileri geçersiz.' },

        // Network errors
        { key: 'fetch failed', msg: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.' },
        { key: 'network error', msg: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' },
        { key: 'networkerror', msg: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' },
        { key: 'failed to fetch', msg: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' },
        { key: 'timeout', msg: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.' },
        { key: 'connection refused', msg: 'Sunucuya bağlanılamadı.' },

        // Storage/File errors
        { key: 'payload too large', msg: 'Dosya çok büyük. Maksimum 5MB yükleyebilirsiniz.' },
        { key: 'file size', msg: 'Dosya boyutu çok büyük.' },
        { key: 'file type', msg: 'Desteklenmeyen dosya formatı.' },
        { key: 'unsupported media', msg: 'Desteklenmeyen dosya formatı.' },
        { key: 'storage', msg: 'Dosya yükleme hatası.' },

        // Validation errors
        { key: 'required', msg: 'Zorunlu alanları doldurun.' },
        { key: 'invalid', msg: 'Geçersiz veri girdiniz.' },
        { key: 'must be', msg: 'Geçersiz değer.' },
    ];

    for (const { key, msg } of errorMap) {
        if (lowerMsg.includes(key)) {
            return msg;
        }
    }

    // Default - show generic message instead of English error
    console.warn('Untranslated error:', message);
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

/**
 * Extract error message from various error formats (Supabase, PostgreSQL, etc.)
 * @param {any} error - Error object or string
 * @returns {string} - Error message string
 */
export const getErrorMessage = (error) => {
    if (!error) return '';

    // String error
    if (typeof error === 'string') return error;

    // Standard Error object
    if (error.message) return error.message;

    // Supabase/PostgreSQL error
    if (error.error_description) return error.error_description;
    if (error.details) return error.details;
    if (error.hint) return error.hint;

    // Nested error
    if (error.error?.message) return error.error.message;

    return 'Bilinmeyen hata';
};

/**
 * Handle an error: log to console, send to Sentry, and return translated message.
 * Use this in catch blocks throughout the application.
 * 
 * @param {Error} error - The error object to handle.
 * @param {Object} context - Additional context for Sentry (e.g., { operation: 'save_client' }).
 * @returns {string} - User-friendly translated error message.
 * 
 * @example
 * try {
 *   await saveData();
 * } catch (error) {
 *   const message = handleError(error, { operation: 'save_client' });
 *   showError(message);
 * }
 */
export const handleError = (error, context = {}) => {
    // Send to Sentry with context
    captureError(error, context);

    // Extract and translate error message
    const errorMessage = getErrorMessage(error);
    return translateError(errorMessage);
};
