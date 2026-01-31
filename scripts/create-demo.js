import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { addDays, format } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, '../.env');
let envConfig = {};

try {
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        // Handle comments and simple key=value
        if (!line || line.startsWith('#')) return;
        const [key, ...value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) {
    console.error('Error loading .env file:', e.message);
    process.exit(1);
}

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL;
const SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) in .env file');
    process.exit(1);
}

if (!ANON_KEY) {
    console.warn('⚠️ Missing VITE_SUPABASE_ANON_KEY - attempting to proceed with Service Role only (might fail for user ops)');
}

// Admin Client (Service Role) - Bypasses RLS
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// User Client (Anon Key) - Respects RLS
const userSupabase = createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    }
});

const DEMO_USER = {
    email: 'demo@dermdesk.net',
    password: 'demo123456!',
    user_metadata: {
        full_name: 'Demo Doktor',
        is_demo: true,
        is_beta_user: true // Bypass beta wall
    }
};

const SAMPLE_CLIENTS = [
    { first_name: 'Ayşe', last_name: 'Yılmaz', phone: '+90 532 123 45 67', email: 'ayse.yilmaz@demo.com', gender: 'female', status: 'VIP' },
    { first_name: 'Mehmet', last_name: 'Kaya', phone: '+90 533 234 56 78', email: 'mehmet.kaya@demo.com', gender: 'male', status: 'Active' },
    { first_name: 'Zeynep', last_name: 'Demir', phone: '+90 535 345 67 89', email: 'zeynep.demir@demo.com', gender: 'female', status: 'Active' },
    { first_name: 'Ali', last_name: 'Öztürk', phone: '+90 536 456 78 90', email: 'ali.ozturk@demo.com', gender: 'male', status: 'Active' },
    { first_name: 'Fatma', last_name: 'Şahin', phone: '+90 537 567 89 01', email: 'fatma.sahin@demo.com', gender: 'female', status: 'Lead' },
    { first_name: 'Emre', last_name: 'Yıldız', phone: '+90 538 678 90 12', email: 'emre.yildiz@demo.com', gender: 'male', status: 'Active' },
    { first_name: 'Elif', last_name: 'Çelik', phone: '+90 539 789 01 23', email: 'elif.celik@demo.com', gender: 'female', status: 'VIP' },
    { first_name: 'Burak', last_name: 'Arslan', phone: '+90 541 890 12 34', email: 'burak.arslan@demo.com', gender: 'male', status: 'Active' },
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

async function createDemoAccount() {
    console.log('🚀 Creating Demo Account...');
    console.log(`📧 Email: ${DEMO_USER.email}`);
    console.log(`🔑 Password: ${DEMO_USER.password}`);

    // 1. Create User via Admin API
    console.log('\n👤 Creating Auth User...');
    let userId;
    const { data: user, error: createError } = await adminSupabase.auth.admin.createUser({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        email_confirm: true,
        user_metadata: DEMO_USER.user_metadata
    });

    if (createError) {
        if (createError.message.includes('already registered') || createError.status === 422) {
            console.log('⚠️ User already exists. Updating metadata for Beta Access...');

            // Need to find user ID first to update
            // Since we can't search by email easily with public API, we try to sign in or rely on update user by email if supported?
            // admin.updateUserById requires ID.
            // Let's use listUsers to find the ID (admin only)
            const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
            if (listError) console.error('List users failed:', listError.message);

            const existingUser = usersData?.users.find(u => u.email === DEMO_USER.email);
            if (existingUser) {
                userId = existingUser.id;
                // Update metadata to grant beta access
                await adminSupabase.auth.admin.updateUserById(userId, {
                    user_metadata: { ...existingUser.user_metadata, ...DEMO_USER.user_metadata }
                });
                console.log('✅ User metadata updated (Beta Access Granted)');
            } else {
                console.log('⚠️ Could not find user ID to update. Proceeding to login...');
            }

        } else {
            console.error('❌ Error creating user:', createError.message);
            process.exit(1);
        }
    } else {
        userId = user.user.id;
        console.log(`✅ User created! ID: ${userId}`);
    }

    // 2.a Force Beta Access in Database (Guarantee)
    console.log('🔓 Granting Beta Access in DB...');
    // We need to use adminSupabase because normal user might not have permission to insert into beta_users directly depending on policies
    // But let's try with adminSupabase which has service role
    const { error: betaError } = await adminSupabase
        .from('beta_users')
        .upsert({
            user_id: userId,
            email: DEMO_USER.email,
            status: 'approved',
            approved_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (betaError) {
        console.error('⚠️ Could not insert into beta_users:', betaError.message);
    } else {
        console.log('✅ Added to beta_users table');
    }

    // 2. Login as User to verify access and get session
    console.log('🔐 Logging in as user...');
    const { data: session, error: loginError } = await userSupabase.auth.signInWithPassword({
        email: DEMO_USER.email,
        password: DEMO_USER.password
    });

    if (loginError) {
        console.error('❌ Login failed:', loginError.message);
        process.exit(1);
    }

    userId = session.user.id;
    console.log(`✅ Logged in as ${userId}`);

    // Wait for triggers
    console.log('⏳ Waiting for triggers...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Setup Clinic and Profile
    console.log('🏥 Setting up Clinic and Profile...');

    // Check Profile
    const { data: profile, error: profileError } = await userSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('❌ Profile check failed:', profileError.message);
        // Try to insert manually if missed trigger?
        process.exit(1);
    }

    if (!profile) {
        console.error('❌ Profile not found after wait');
        process.exit(1);
    }

    // Mark Onboarded
    await userSupabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', userId);

    let clinicId = profile.clinic_id;

    if (!clinicId) {
        // Create Clinic
        const { data: clinic, error: clinicError } = await userSupabase
            .from('clinics')
            .insert({ name: 'Demo Clinic', subscription_tier: 'ENTERPRISE' })
            .select()
            .single();

        if (clinicError) throw clinicError;
        clinicId = clinic.id;

        // Link profile
        await userSupabase.from('profiles').update({ clinic_id: clinicId }).eq('id', userId);
        console.log(`✅ Organization created: ${clinicId}`);
    } else {
        // Update Clinic Name
        await userSupabase.from('clinics')
            .update({ name: 'Demo Clinic (Public)', subscription_tier: 'ENTERPRISE' })
            .eq('id', clinicId);
        console.log(`✅ Organization updated: ${clinicId}`);
    }

    // 4. Seed Data
    console.log('\n🌱 Seeding Sample Data...');

    // Clients
    const clientsToInsert = SAMPLE_CLIENTS.map(c => ({ ...c, clinic_id: clinicId }));
    const { data: clients, error: clientsError } = await userSupabase.from('clients').insert(clientsToInsert).select('id');
    if (clientsError) console.error('Error inserting clients:', clientsError.message);
    else console.log(`✅ Added ${clients?.length || 0} clients`);

    // Services
    const servicesToInsert = SAMPLE_SERVICES.map(s => ({ ...s, clinic_id: clinicId }));
    const { data: services, error: servicesError } = await userSupabase.from('services').insert(servicesToInsert).select('id');
    if (servicesError) console.error('Error inserting services:', servicesError.message);
    else console.log(`✅ Added ${services?.length || 0} services`);

    // Inventory
    const inventoryToInsert = SAMPLE_INVENTORY.map(i => ({ ...i, clinic_id: clinicId }));
    await userSupabase.from('inventory').insert(inventoryToInsert);
    console.log(`✅ Added ${SAMPLE_INVENTORY.length} inventory items`);

    // Appointments
    if (clients?.length && services?.length) {
        const today = new Date();
        const appointments = [];
        for (let i = 0; i < 6; i++) {
            appointments.push({
                clinic_id: clinicId,
                client_id: clients[i % clients.length].id,
                service_id: services[i % services.length].id,
                staff_id: userId,
                date: format(addDays(today, i % 5), 'yyyy-MM-dd'),
                time: `09:00:00`,
                status: APPOINTMENT_STATUSES[i % APPOINTMENT_STATUSES.length],
                notes: 'Demo appointment'
            });
        }
        await userSupabase.from('appointments').insert(appointments);
        console.log(`✅ Added ${appointments.length} appointments`);
    }

    console.log('\n🎉 DEMO ACCOUNT READY!');
    console.log('-----------------------------------');
    console.log(`Email:    ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
    console.log('-----------------------------------');
}

createDemoAccount().catch(console.error);
