/**
 * Beta Guard Middleware
 * Blocks access to app unless user has beta access
 */

import { supabase } from '../lib/supabase';

/**
 * Admin emails that always have beta access (bypass beta check)
 * These users don't need to be in beta_users table
 */
const ADMIN_EMAILS = [
    'yagiz.gokce19@gmail.com',
    'relre434@gmail.com',
];

/**
 * Check if email is an admin email (always has access)
 */
export function isAdminEmail(email) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if a user has approved beta access
 * @param {string} userId - The user's ID from Supabase Auth
 * @param {string} userEmail - Optional email to check admin list
 * @returns {Promise<boolean>} - True if user has beta access
 */
export async function checkBetaAccess(userId, userEmail = null) {
    if (!userId) return false;

    // Check if admin email (always has access)
    if (userEmail && isAdminEmail(userEmail)) {
        return true;
    }

    try {
        const { data, error } = await supabase
            .from('beta_users')
            .select('status, approved_at')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .maybeSingle();

        if (error) {
            console.error('Beta access check error:', error);
            // If table doesn't exist yet, don't block admins
            return false;
        }

        return data && data.approved_at;
    } catch (err) {
        console.error('Beta access check failed:', err);
        return false;
    }
}

/**
 * Check if an email is on the approved beta waitlist
 * @param {string} email - The user's email address
 * @returns {Promise<object|null>} - Waitlist data if approved, null otherwise
 */
export async function checkEmailBetaAccess(email) {
    if (!email) return null;

    // Admin emails always have access
    if (isAdminEmail(email)) {
        return { status: 'approved', approved_at: new Date().toISOString() };
    }

    try {
        const { data, error } = await supabase
            .from('beta_waitlist')
            .select('id, status, approved_at, referral_code')
            .eq('email', email.toLowerCase())
            .eq('status', 'approved')
            .maybeSingle();

        if (error) {
            console.error('Email beta check error:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Email beta check failed:', err);
        return null;
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
        // Silent fail - activity tracking is not critical
        console.warn('Failed to update beta user activity:', err);
    }
}
