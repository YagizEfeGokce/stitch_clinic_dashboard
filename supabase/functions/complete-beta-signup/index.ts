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
        const { token, email, password, metadata } = await req.json()

        if (!token || !email || !password) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // 1. Verify Token
        const { data: waitlistData, error: tokenError } = await supabaseAdmin
            .from('beta_waitlist')
            .select('*')
            .eq('invite_token', token)
            .single()

        if (tokenError || !waitlistData) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Create User (Confirmed)
        // Check if user exists first to avoid error
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)

        let userId

        if (existingUser) {
            // User exists, update password and confirm
            const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        ...existingUser.user_metadata,
                        is_beta_user: true,
                        role: 'owner', // FORCE ROLE
                        clinic_name: metadata?.clinic_name || waitlistData.clinic_name,
                        full_name: metadata?.full_name || waitlistData.owner_name
                    }
                }
            )
            if (updateError) throw updateError
            userId = existingUser.id
        } else {
            // Create new confirmed user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    is_beta_user: true,
                    role: 'owner', // FORCE ROLE
                    clinic_name: metadata?.clinic_name || waitlistData.clinic_name,
                    full_name: metadata?.full_name || waitlistData.owner_name
                }
            })
            if (createError) throw createError
            userId = newUser.user.id
        }

        // 3. Create Clinic & Profile in Database (Public Schema)
        // Check if clinic exists (somehow) or create new
        const { data: newClinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .insert({
                name: metadata?.clinic_name || waitlistData.clinic_name,
                owner_id: userId,
                subscription_status: 'trial',
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        // If clnic table missing or error, we log but proceed with profile
        // But optimally we need a clinic for the owner

        const clinicId = newClinic?.id || '00000000-0000-0000-0000-000000000000'; // Default valid UUID if failed

        // Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                clinic_id: clinicId,
                role: 'owner',
                full_name: metadata?.full_name || waitlistData.owner_name,
                avatar_url: null,
                created_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile creation error:', profileError)
        }

        // 4. Link Beta User Profile
        await supabaseAdmin
            .from('beta_users')
            .upsert({
                user_id: userId,
                email: email,
                waitlist_id: waitlistData.id,
                status: 'approved',
                approved_at: new Date().toISOString(),
                invitation_accepted_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        // 5. Invalidate Token
        await supabaseAdmin
            .from('beta_waitlist')
            .update({
                status: 'converted',
                converted_at: new Date().toISOString(),
                invite_token: null
            })
            .eq('id', waitlistData.id)

        return new Response(
            JSON.stringify({ success: true, userId }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Complete signup error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
