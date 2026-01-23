/**
 * API Route: Send Beta User Invitation
 * Uses Supabase Admin invite + Custom email via Resend
 * 
 * This avoids conflict with staff invitations which use Supabase's "Invite User" email template.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

if (!supabaseServiceRoleKey) {
    console.error('VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env');
}

// Create admin client with Service Role Key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request) {
    try {
        const { waitlistId, email, metadata } = await request.json();

        if (!email || !waitlistId) {
            return new Response(
                JSON.stringify({ error: 'Email and waitlist ID are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // STEP 1: Create Supabase invitation (generates secure token)
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                is_beta_user: true,
                beta_waitlist_id: waitlistId,
                clinic_name: metadata?.clinic_name || '',
                owner_name: metadata?.owner_name || '',
            },
            redirectTo: `${request.headers.get('origin')}/auth/confirm`
        });

        if (error) {
            console.error('[API] Supabase invitation error:', error);
            return new Response(
                JSON.stringify({ error: error.message || 'Invitation failed' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // STEP 2: Extract invitation token from Supabase response
        const origin = request.headers.get('origin') || 'http://localhost:5173';

        // Supabase creates the user with a confirmation_token
        let token = data.user?.confirmation_token;

        const inviteUrl = token
            ? `${origin}/auth/confirm?token_hash=${token}&type=invite&email=${encodeURIComponent(email)}`
            : `${origin}/auth/confirm`;

        // STEP 3: Send custom email via Resend
        try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Dermdesk <noreply@dermdesk.net>',
                    to: [email],
                    subject: '🎉 Dermdesk Beta Davetiniz Hazır!',
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: #0d9488; color: white; width: 64px; height: 64px; border-radius: 16px; line-height: 64px; font-size: 32px;">
                  ✨
                </div>
              </div>
              
              <h1 style="color: #0f766e; font-size: 28px; margin-bottom: 20px; text-align: center;">Merhaba${metadata?.owner_name ? ' ' + metadata.owner_name : ''}!</h1>
              
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Dermdesk Beta programına davet edildiniz! 🎉
              </p>
              
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                <strong>${metadata?.clinic_name || 'Kliniğiniz'}</strong> için hesabınızı oluşturmak ve hemen başlamak için aşağıdaki butona tıklayın:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}" style="background: #0d9488; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 148, 136, 0.2);">
                  Hesap Oluştur
                </a>
              </div>
              
              <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 32px 0; border-radius: 8px;">
                <p style="color: #115e59; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>📌 Önemli:</strong> Bu link 7 gün geçerlidir. Hesabınızı oluşturduktan sonra erişiminizin süresi dolmaz ve tüm özelliklere tam erişim sağlarsınız.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
              
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                Dermdesk Ekibi<br />
                <a href="https://dermdesk.net" style="color: #0d9488; text-decoration: none;">dermdesk.net</a>
              </p>
            </div>
          `
                })
            });

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error('[API] Resend email error:', errorText);

                // Invitation created but email failed
                return new Response(
                    JSON.stringify({
                        success: true,
                        warning: 'Davet oluşturuldu ama email gönderilemedi',
                        user: data.user,
                        inviteUrl: inviteUrl // Return URL so admin can manually share
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const emailData = await emailResponse.json();
            console.log('[API] Email sent successfully:', emailData);

        } catch (emailError) {
            console.error('[API] Email sending exception:', emailError);
            // Continue anyway - invitation is created
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: data.user,
                message: 'Davet başarıyla gönderildi'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[API] Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
