/**
 * Beta User Service
 * Handles beta user invitation and access management
 * 
 * Uses Supabase Edge Function for secure invitation handling
 */

import { supabase } from '../lib/supabase';

/**
 * Check if a user has beta access
 * @param {string} userId - User ID from auth
 * @returns {Promise<boolean>}
 */
export async function checkBetaUserAccess(userId) {
    if (!userId) return false;

    try {
        const { data, error } = await supabase
            .from('beta_users')
            .select('status, approved_at')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .maybeSingle();

        if (error) {
            console.error('[betaUserService] Access check error:', error);
            return false;
        }

        return !!data?.approved_at;
    } catch (err) {
        console.error('[betaUserService] Access check failed:', err);
        return false;
    }
}

/**
 * Send beta invitation using Supabase Edge Function
 * 
 * @param {string} waitlistId - ID from beta_waitlist table
 * @param {string} email - Recipient email
 * @param {object} metadata - Additional data (clinic_name, owner_name)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function sendBetaInvitation(waitlistId, email, metadata = {}) {
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Call Supabase Edge Function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-beta-invitation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                waitlistId,
                email,
                metadata,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMessage = result.details
                ? `${result.error}: ${result.details}`
                : result.error || 'Invitation sending failed';
            throw new Error(errorMessage);
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('[betaUserService] Send invitation error:', error);
        return {
            success: false,
            error: error.message || 'Davet gönderilirken hata oluştu',
        };
    }
}

/**
 * Handle invitation acceptance
 * @param {string} userId - Newly created user ID
 * @param {string} email - User email
 * @param {string} waitlistId - Optional waitlist ID
 * @returns {Promise<boolean>}
 */
export async function handleInvitationAccepted(userId, email, waitlistId = null) {
    try {
        const { data: existing } = await supabase
            .from('beta_users')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            console.log('[betaUserService] Beta user already exists');
            return true;
        }

        const { error: insertError } = await supabase
            .from('beta_users')
            .insert({
                user_id: userId,
                email: email.toLowerCase(),
                waitlist_id: waitlistId,
                status: 'approved',
                approved_at: new Date().toISOString(),
                invitation_accepted_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('[betaUserService] Insert error:', insertError);
            return false;
        }

        if (waitlistId) {
            await supabase
                .from('beta_waitlist')
                .update({
                    status: 'converted',
                    converted_at: new Date().toISOString(),
                    invite_token: null // Invalidate token
                })
                .eq('id', waitlistId);
        }

        return true;
    } catch (error) {
        console.error('[betaUserService] Handle acceptance error:', error);
        return false;
    }
}

/**
 * Update beta user's last active timestamp
 * @param {string} userId - User ID
 */
export async function updateBetaUserActivity(userId) {
    if (!userId) return;

    try {
        await supabase
            .from('beta_users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId);
    } catch (err) {
        console.warn('[betaUserService] Failed to update activity:', err);
    }
}

/**
 * Get beta user details
 * @param {string} userId - User ID
 * @returns {Promise<object|null>}
 */
export async function getBetaUserDetails(userId) {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('beta_users')
            .select(`
        *,
        beta_waitlist (
          clinic_name,
          owner_name,
          city
        )
      `)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[betaUserService] Get details error:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[betaUserService] Get details failed:', err);
        return null;
    }
}

/**
 * Complete beta signup via Edge Function
 * This handles user creation (confirmed) and data linking securely on server side.
 */
export async function completeBetaSignup(token, email, password, metadata) {
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/complete-beta-signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                token,
                email,
                password,
                metadata
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Signup failed');
        }

        return { success: true, userId: result.userId };
    } catch (error) {
        console.error('[betaUserService] Complete signup error:', error);
        return { success: false, error: error.message };
    }
}
