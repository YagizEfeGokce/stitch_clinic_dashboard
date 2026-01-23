// Setup Guide:
// 1. Create a Resend account at resend.com
// 2. Get API Key
// 3. Set secret: supabase secrets set RESEND_API_KEY=re_123...

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { email, inviteLink, clinicName, inviterName } = body

        console.log('Received request:', { email, clinicName, inviterName })

        if (!email) {
            throw new Error('Email is required')
        }

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set in Edge Function secrets.')
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8fafc; border-radius: 16px; padding: 40px;">
    <h2 style="color: #0f172a; margin-bottom: 20px;">Merhaba!</h2>
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      <strong>${inviterName || 'Yonetici'}</strong>, sizi <strong>${clinicName || 'Klinik'}</strong> ekibine katilmaya davet etti.
    </p>
    <p style="color: #475569; font-size: 16px;">Asagidaki butona tiklayarak daveti kabul edebilirsiniz:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold;">Daveti Kabul Et</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8;">Bu davet 7 gun boyunca gecerlidir.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="font-size: 10px; color: #94a3b8; text-align: center;">Dermdesk - Modern Klinik Yonetimi</p>
  </div>
</body>
</html>
        `.trim()

        console.log('Sending email to:', email)

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Dermdesk <noreply@dermdesk.net>',
                to: [email],
                subject: `${clinicName || 'Klinik'} Ekibine Davet Edildiniz!`,
                html: htmlContent,
            }),
        })

        const data = await res.json()
        console.log('Resend response:', res.status, data)

        if (!res.ok) {
            console.error('Resend error:', data)
            return new Response(JSON.stringify({ error: data }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Function error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
