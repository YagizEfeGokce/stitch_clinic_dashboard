import { supabase } from '../lib/supabase';
import { addDays, format } from 'date-fns';

const SAMPLE_CLIENTS = [
    { first_name: 'Ayşe', last_name: 'Yılmaz', phone: '+90 532 123 45 67', email: 'ayse.yilmaz@email.com', gender: 'female', status: 'VIP' },
    { first_name: 'Mehmet', last_name: 'Kaya', phone: '+90 533 234 56 78', email: 'mehmet.kaya@email.com', gender: 'male', status: 'Active' },
    { first_name: 'Zeynep', last_name: 'Demir', phone: '+90 535 345 67 89', email: 'zeynep.demir@email.com', gender: 'female', status: 'Active' },
    { first_name: 'Ali', last_name: 'Öztürk', phone: '+90 536 456 78 90', email: 'ali.ozturk@email.com', gender: 'male', status: 'Active' },
    { first_name: 'Fatma', last_name: 'Şahin', phone: '+90 537 567 89 01', email: 'fatma.sahin@email.com', gender: 'female', status: 'Lead' },
    { first_name: 'Emre', last_name: 'Yıldız', phone: '+90 538 678 90 12', email: 'emre.yildiz@email.com', gender: 'male', status: 'Active' },
    { first_name: 'Elif', last_name: 'Çelik', phone: '+90 539 789 01 23', email: 'elif.celik@email.com', gender: 'female', status: 'VIP' },
    { first_name: 'Burak', last_name: 'Arslan', phone: '+90 541 890 12 34', email: 'burak.arslan@email.com', gender: 'male', status: 'Active' },
];

const SAMPLE_SERVICES = [
    { name: 'Botox Uygulaması', description: 'Yüz kırışıklıklarını azaltmak için botulinum toksin enjeksiyonu', duration_min: 30, price: 3500.00, color: 'blue', active: true },
    { name: 'Hyaluronik Asit Dolgu', description: 'Dudak ve yüz hatlarını belirginleştirmek için dolgu uygulaması', duration_min: 45, price: 4500.00, color: 'pink', active: true },
    { name: 'Lazer Epilasyon', description: 'Kalıcı tüy azaltma için lazer tedavisi', duration_min: 60, price: 2000.00, color: 'purple', active: true },
    { name: 'Medikal Cilt Bakımı', description: 'Profesyonel cilt yenileme ve bakım prosedürü', duration_min: 75, price: 2500.00, color: 'green', active: true },
    { name: 'PRP Tedavisi', description: 'Platelet zengin plazma ile cilt gençleştirme', duration_min: 45, price: 5000.00, color: 'orange', active: true },
];

const SAMPLE_INVENTORY = [
    { name: 'Botox 100 Ünite', description: 'Allergan Botox 100 ünite flakon', stock: 25, min_stock_alert: 5, unit: 'flakon', price: 1200.00, category: 'Enjektabl', status: 'In Stock' },
    { name: 'Hyaluronik Asit 1ml', description: 'Juvederm Ultra 1ml şırınga', stock: 40, min_stock_alert: 10, unit: 'şırınga', price: 800.00, category: 'Dolgu', status: 'In Stock' },
    { name: 'Lazer Ucu', description: 'Alexandrite lazer başlığı', stock: 8, min_stock_alert: 2, unit: 'adet', price: 2500.00, category: 'Ekipman', status: 'In Stock' },
    { name: 'PRP Tüpü', description: 'PRP hazırlama kiti', stock: 50, min_stock_alert: 15, unit: 'kit', price: 150.00, category: 'Sarf Malzemesi', status: 'In Stock' },
];

const APPOINTMENT_STATUSES = ['Completed', 'Pending', 'Cancelled', 'Scheduled', 'Confirmed', 'NoShow'];

export async function seedSampleData(clinicId, userId) {
    if (!clinicId || !userId) {
        throw new Error('clinic_id ve user_id gereklidir');
    }

    const errors = [];

    const clientsToInsert = SAMPLE_CLIENTS.map(client => ({
        ...client,
        clinic_id: clinicId,
    }));

    const { data: insertedClients, error: clientsError } = await supabase
        .from('clients')
        .insert(clientsToInsert)
        .select('id');

    if (clientsError) {
        console.error('[Supabase Error] clients:', clientsError.code, clientsError.message, clientsError.details);
        errors.push({ table: 'clients', error: clientsError });
    }

    const servicesToInsert = SAMPLE_SERVICES.map(service => ({
        ...service,
        clinic_id: clinicId,
    }));

    const { data: insertedServices, error: servicesError } = await supabase
        .from('services')
        .insert(servicesToInsert)
        .select('id');

    if (servicesError) {
        console.error('[Supabase Error] services:', servicesError.code, servicesError.message, servicesError.details);
        errors.push({ table: 'services', error: servicesError });
    }

    const inventoryToInsert = SAMPLE_INVENTORY.map(item => ({
        ...item,
        clinic_id: clinicId,
    }));

    const { error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryToInsert);

    if (inventoryError) {
        console.error('[Supabase Error] inventory:', inventoryError.code, inventoryError.message, inventoryError.details);
        errors.push({ table: 'inventory', error: inventoryError });
    }

    if (insertedClients?.length > 0 && insertedServices?.length > 0) {
        const today = new Date();
        const appointmentsToInsert = [];

        for (let i = 0; i < 6; i++) {
            const appointmentDate = addDays(today, i % 7);
            const clientIndex = i % insertedClients.length;
            const serviceIndex = i % insertedServices.length;
            const statusIndex = i % APPOINTMENT_STATUSES.length;
            const hour = 9 + (i * 2) % 8;

            appointmentsToInsert.push({
                clinic_id: clinicId,
                client_id: insertedClients[clientIndex].id,
                service_id: insertedServices[serviceIndex].id,
                staff_id: userId,
                date: format(appointmentDate, 'yyyy-MM-dd'),
                time: `${String(hour).padStart(2, '0')}:00:00`,
                status: APPOINTMENT_STATUSES[statusIndex],
                payment_status: statusIndex === 0 ? 'Paid' : 'Unpaid',
                notes: `Örnek randevu ${i + 1}`,
            });
        }

        const { error: appointmentsError } = await supabase
            .from('appointments')
            .insert(appointmentsToInsert);

        if (appointmentsError) {
            console.error('[Supabase Error] appointments:', appointmentsError.code, appointmentsError.message, appointmentsError.details);
            errors.push({ table: 'appointments', error: appointmentsError });
        }
    }

    if (errors.length > 0) {
        const errorMessage = errors.map(e => `${e.table}: ${e.error.message}`).join(', ');
        throw new Error(`Bazı veriler yüklenemedi: ${errorMessage}`);
    }

    return {
        clients: insertedClients?.length || 0,
        services: insertedServices?.length || 0,
        inventory: SAMPLE_INVENTORY.length,
        appointments: 6,
    };
}

export async function completeOnboarding(userId, withSampleData = false, clinicId = null) {
    if (withSampleData && clinicId) {
        await seedSampleData(clinicId, userId);
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', userId);

    if (profileError) {
        console.error('[Supabase Error] profiles update:', profileError.code, profileError.message, profileError.details);
        throw new Error('Profil güncellenemedi: ' + profileError.message);
    }

    return true;
}
