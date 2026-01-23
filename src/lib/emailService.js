import { supabase } from './supabase';

/**
 * Davet emaili gönder - Resend API kullanarak
 * @param {string} email - Alıcı email adresi
 * @param {string} inviteCode - Davet kodu
 * @param {string} recipientName - Alıcının adı
 */
export async function sendInvitationEmail(email, inviteCode, recipientName = '') {
    try {
        // Use Database RPC (Server-Side) instead of Edge Function (Client-Side)
        // This avoids Edge Function deployment issues and Docker requirements.

        // Get current origin (dynamically works for localhost and production)
        const appUrl = window.location.origin;

        const { data, error } = await supabase.rpc('send_beta_email', {
            email,
            invite_code: inviteCode,
            recipient_name: recipientName,
            app_url: appUrl
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Email gönderilirken hata:', error);
        return {
            success: false,
            error: error.message || 'Email gönderimi başarısız oldu'
        };
    }
}

/**
 * Test email gönder
 */
export async function sendTestEmail() {
    return await sendInvitationEmail(
        'test@example.com',
        'TEST1234',
        'Test Kullanıcı'
    );
}
