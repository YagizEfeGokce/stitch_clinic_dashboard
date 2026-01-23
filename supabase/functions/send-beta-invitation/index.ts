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

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
        const userExists = existingUser?.users?.some(u => u.email === email)

        let userId
        let isNewUser = false

        if (userExists) {
            const user = existingUser.users.find(u => u.email === email)
            userId = user.id
        } else {
            // Create user directly (NOT inviteUserByEmail to avoid Supabase email)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: false, // User will confirm via our custom flow
                user_metadata: {
                    is_beta_user: true,
                    beta_waitlist_id: waitlistId,
                    clinic_name: metadata?.clinic_name || '',
                    owner_name: metadata?.owner_name || '',
                }
            })

            if (createError) {
                console.error('User creation error:', createError)
                return new Response(
                    JSON.stringify({ error: createError.message }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            userId = newUser.user.id
            isNewUser = true
        }

        // Generate a secure one-time token for password setup
        const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/auth/confirm`
            }
        })

        if (tokenError) {
            console.error('Token generation error:', tokenError)
            return new Response(
                JSON.stringify({ error: tokenError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Extract properties URL from the verification link
        const inviteUrl = tokenData.properties.action_link

        // Send ONLY custom email via Resend (no Supabase email)
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
                <a href="${inviteUrl}" style="background: #0d9488; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 148, 136, 0.2);">Hesap Oluştur</a>
              </div>
              <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 32px 0; border-radius: 8px;">
                <p style="color: #115e59; font-size: 14px; margin: 0; line-height: 1.6;"><strong>📌 Önemli:</strong> Bu link 24 saat geçerlidir.</p>
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
                throw new Error('Email sending failed')
            }
        } catch (emailError) {
            console.error('Email error:', emailError)
            return new Response(
                JSON.stringify({ error: 'User created but email failed to send' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId,
                isNewUser,
                message: 'Davet başarıyla gönderildi'
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

