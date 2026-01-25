import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSubscription } from './useSubscription';
import { ROLES } from '../utils/constants';
import { translateError } from '../utils/errorHelpers';

export function useTeam() {
    const { clinic, role } = useAuth();
    const { addToast } = useToast();
    const { getPlanLimit } = useSubscription();

    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTeamData = useCallback(async () => {
        if (!clinic?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch active team members (profiles linked to this clinic)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('clinic_id', clinic.id)
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;
            setMembers(profilesData || []);

            // 2. Fetch pending invitations (only if admin/owner/super_admin)
            if (role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
                const { data: invitesData, error: invitesError } = await supabase
                    .from('invitations')
                    .select('*')
                    .eq('clinic_id', clinic.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (invitesError) throw invitesError;
                setInvitations(invitesData || []);
            }
        } catch (err) {
            console.error('Error fetching team data:', err);
            setError(err.message);
            addToast('Ekip bilgileri alınırken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    }, [clinic?.id, role, addToast]);

    const inviteMember = async (email, inviteRole = ROLES.STAFF) => {
        try {
            // Validations
            if (!email) throw new Error('E-posta adresi gereklidir.');

            // Check Plan Limits
            const maxStaff = getPlanLimit('max_staff');
            const currentCount = members.length + invitations.filter(i => i.status === 'pending').length;

            if (currentCount >= maxStaff) {
                throw new Error(`Paket limitinize ulaştınız (${maxStaff} Kişi). Daha fazla personel eklemek için paketinizi yükseltin.`);
            }

            // Check if user is already in the team
            const existingMember = members.find(m => m.email === email);
            if (existingMember) throw new Error('Bu kullanıcı zaten ekipte.');

            // Check active invitations
            const existingInvite = invitations.find(i => i.email === email && i.status === 'pending');
            if (existingInvite) throw new Error('Bu e-posta adresi için zaten bekleyen bir davet var.');

            const { data, error } = await supabase
                .from('invitations')
                .insert({
                    clinic_id: clinic.id,
                    email,
                    role: inviteRole,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            setInvitations(prev => [data, ...prev]);

            // --- TRIGGER EMAIL SENDING (EDGE FUNCTION) ---
            const inviteLink = `${window.location.origin}/signup?invite=${data.token}`;

            const emailPayload = {
                email,
                clinicName: clinic?.name || 'Klinik',
                inviteLink,
                inviterName: 'Yonetici'
            };

            console.log('Sending email with payload:', JSON.stringify(emailPayload));

            supabase.functions.invoke('send-invite', {
                body: emailPayload
            }).then(({ data: responseData, error }) => {
                if (error) {
                    console.error('Email sending failed:', error);
                    console.error('Response:', responseData);
                } else {
                    console.log('Email sent successfully:', responseData);
                }
            });
            // ---------------------------------------------

            addToast(`${email} adresine davet gönderildi.`, 'success');
            return data;
        } catch (err) {
            console.error('Invite error:', err);
            addToast(translateError(err.message) || err.message, 'error'); // Fallback to err.message if translation fails or returns generic
            throw err;
        }
    };

    const cancelInvitation = async (id) => {
        try {
            const { error } = await supabase
                .from('invitations')
                .delete()
                .eq('id', id)
                .eq('clinic_id', clinic.id); // Security check

            if (error) throw error;

            setInvitations(prev => prev.filter(i => i.id !== id));
            addToast('Davet iptal edildi.', 'success');
        } catch (err) {
            console.error('Cancel invite error:', err);
            addToast('Davet iptal edilemedi.', 'error');
        }
    };

    const removeMember = async (memberId) => {
        try {
            // Remove member from clinic by setting clinic_id to null
            const { error } = await supabase
                .from('profiles')
                .update({ clinic_id: null })
                .eq('id', memberId)
                .eq('clinic_id', clinic.id); // Security: only remove from own clinic

            if (error) throw error;

            setMembers(prev => prev.filter(m => m.id !== memberId));
            addToast('Personel klinikten cikarildi.', 'success');
        } catch (err) {
            console.error('Remove member error:', err);
            addToast('Personel kaldirilirken hata olustu.', 'error');
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, [fetchTeamData]);

    return {
        members,
        invitations,
        loading,
        error,
        inviteMember,
        cancelInvitation,
        removeMember,
        refreshTeam: fetchTeamData
    };
}
