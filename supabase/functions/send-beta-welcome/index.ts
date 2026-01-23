// Beta Welcome Email Edge Function
// Sends a welcome email to new beta signups

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
        const { email, name, position, referralCode } = await req.json()

        if (!email || !name) {
            throw new Error('Email and name are required')
        }

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set')
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: #14b8a6; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 24px; font-weight: bold;">D</span>
      </div>
    </div>

    <h1 style="color: #14b8a6; text-align: center; margin-bottom: 10px;">Hos Geldiniz, ${name}!</h1>
    
    <p style="color: #475569; font-size: 16px; text-align: center;">Dermdesk Beta programina katildiginiz icin tesekkur ederiz!</p>
    
    <div style="background: #f0fdfa; padding: 24px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Siradaki Yeriniz</p>
      <h2 style="margin: 0; color: #14b8a6; font-size: 48px; font-weight: bold;">#${position}</h2>
      <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">Beta erisiniz 1-3 gun icinde hazir olacak.</p>
    </div>
    
    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 30px 0;">
      <h3 style="margin: 0 0 15px 0; color: #0f172a;">Sirada One Gecin!</h3>
      <p style="color: #475569; margin: 0 0 20px 0;">3 arkadasinizi davet edin, sirada 15 basamak one gecin:</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #e2e8f0; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #64748b;">Senin Referans Kodun</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; color: #0f172a;">${referralCode}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://dermdesk.net/beta?ref=${referralCode}" style="display: inline-block; background: #14b8a6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Arkadaslarinizi Davet Edin</a>
      </div>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
        Sorulariniz icin: <a href="mailto:destek@dermdesk.net" style="color: #14b8a6;">destek@dermdesk.net</a>
      </p>
    </div>
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
      2026 Dermdesk. Tum haklari saklidir.
    </p>
  </div>
</body>
</html>
        `.trim()

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Dermdesk <beta@dermdesk.net>',
                to: [email],
                subject: 'Dermdesk Beta Programina Hos Geldiniz!',
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
