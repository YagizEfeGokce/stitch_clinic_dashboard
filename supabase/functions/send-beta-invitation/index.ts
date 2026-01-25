import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { waitlistId, email, metadata } = await req.json()

        if (!email || !waitlistId) {
            return new Response(
                JSON.stringify({ error: 'Email and waitlist ID are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Generate Custom Invite Token (UUID)
        const inviteToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days validity

        // Update Waitlist Table with Token
        const { error: updateError } = await supabaseAdmin
            .from('beta_waitlist')
            .update({
                invite_token: inviteToken,
                token_expires_at: expiresAt.toISOString(),
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', waitlistId);

        if (updateError) {
            console.error('Update beta_waitlist error:', updateError);
            throw new Error(`DB Error: ${updateError.message} (${updateError.code}) - ${updateError.details || ''}`);
        }

        // Construct Custom Signup URL
        const origin = req.headers.get('origin') || 'https://dermdesk.net'; // Fallback to prod or use ENV
        const signupUrl = `${origin}/beta-signup?token=${inviteToken}`;

        console.log('Generated Signup URL:', signupUrl);

        // Send Email via Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')

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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: #0d9488; color: white; width: 64px; height: 64px; border-radius: 16px; line-height: 64px; font-size: 32px;">✨</div>
              </div>
              <h1 style="color: #0f766e; font-size: 28px; margin-bottom: 20px; text-align: center;">Merhaba${metadata?.owner_name ? ' ' + metadata.owner_name : ''}!</h1>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dermdesk Beta programına davet edildiniz! 🎉</p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 32px;"><strong>${metadata?.clinic_name || 'Kliniğiniz'}</strong> için hesabınızı oluşturmak ve hemen başlamak için aşağıdaki butona tıklayın:</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${signupUrl}" style="background: #0d9488; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 148, 136, 0.2);">Hesap Oluştur</a>
              </div>
              <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 32px 0; border-radius: 8px;">
                <p style="color: #115e59; font-size: 14px; margin: 0; line-height: 1.6;"><strong>📌 Önemli:</strong> Bu link 7 gün geçerlidir.</p>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">Dermdesk Ekibi<br /><a href="https://dermdesk.net" style="color: #0d9488;">dermdesk.net</a></p>
            </div>
          `
                })
            })

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text()
                console.error('Resend error:', errorText)
                // We don't fail the whole request if email fails but DB update succeeded, 
                // but we should probably warn or retry. For now just log it.
                throw new Error('Email sending failed')
            }
        } catch (emailError) {
            console.error('Email error:', emailError)
            return new Response(
                JSON.stringify({ error: 'Token generated but email failed to send' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Davet maili gönderildi'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
