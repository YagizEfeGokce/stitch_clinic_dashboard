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
        const { email, inviteLink, clinicName, inviterName } = await req.json()

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set in Edge Function secrets.')
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Dermdesk <onboarding@resend.dev>', // Use verified domain later
                to: [email],
                subject: `${clinicName} Ekibine Davet Edildiniz!`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Merhaba! 👋</h2>
            <p><strong>${inviterName}</strong>, sizi <strong>${clinicName}</strong> ekibine katılmaya davet etti.</p>
            <p>Aşağıdaki butona tıklayarak daveti kabul edebilirsiniz:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Daveti Kabul Et</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Bu davet 7 gün boyunca geçerlidir.</p>
            <hr />
            <p style="font-size: 10px; color: #888;">Dermdesk - Modern Klinik Yönetimi</p>
          </div>
        `,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            return new Response(JSON.stringify({ error: data }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
