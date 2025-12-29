import { supabase } from './supabase';

export const seedDatabase = async () => {
    try {
        console.log("Starting Seed Process...");

        // 0. Get Current User for Assignments
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // 1. Seed Clients
        const dummyClients = [
            { first_name: 'Emma', last_name: 'Watson', phone: '05551112233', email: 'emma@test.com', status: 'Active' },
            { first_name: 'Brad', last_name: 'Pitt', phone: '05552223344', email: 'brad@test.com', status: 'Active' },
            { first_name: 'Angelina', last_name: 'Jolie', phone: '05553334455', email: 'angie@test.com', status: 'Active' },
            { first_name: 'Leonardo', last_name: 'DiCaprio', phone: '05554445566', email: 'leo@test.com', status: 'Lead' },
            { first_name: 'Jennifer', last_name: 'Lawrence', phone: '05555556677', email: 'jen@test.com', status: 'Active' },
            { first_name: 'Tom', last_name: 'Cruise', phone: '05556667788', email: 'tom@test.com', status: 'Inactive' },
            { first_name: 'Scarlett', last_name: 'Johansson', phone: '05557778899', email: 'scarlett@test.com', status: 'Active' },
            { first_name: 'Robert', last_name: 'Downey Jr.', phone: '05558889900', email: 'rdj@test.com', status: 'Active' },
            { first_name: 'Chris', last_name: 'Hemsworth', phone: '05559990011', email: 'thor@test.com', status: 'Active' },
            { first_name: 'Margot', last_name: 'Robbie', phone: '05550001122', email: 'barbie@test.com', status: 'Lead' }
        ];

        // Replace upsert with insert to avoid error on non-unique constraint
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .insert(dummyClients)
            .select();

        if (clientError) throw clientError;
        console.log(`Seeded ${clients.length} clients.`);

        // 2. Seed Inventory
        const dummyProducts = [
            { name: 'Botox Vial (100u)', stock: 45, unit: 'Vial', min_stock_alert: 10, status: 'In Stock' },
            { name: 'Juvederm Ultra', stock: 22, unit: 'Syringe', min_stock_alert: 5, status: 'In Stock' },
            { name: 'Dysport', stock: 8, unit: 'Vial', min_stock_alert: 10, status: 'Low Stock' },
            { name: 'Lidocaine Cream', stock: 5, unit: 'Tube', min_stock_alert: 5, status: 'Low Stock' },
            { name: 'Surgical Gloves (M)', stock: 200, unit: 'Pair', min_stock_alert: 50, status: 'In Stock' },
            { name: 'Facial Cleanser', stock: 0, unit: 'Bottle', min_stock_alert: 10, status: 'Out of Stock' },
            { name: 'HydraFacial Serum', stock: 15, unit: 'Bottle', min_stock_alert: 5, status: 'In Stock' },
            { name: 'Dermal Filler (Cheek)', stock: 12, unit: 'Syringe', min_stock_alert: 5, status: 'In Stock' },
            { name: 'Lip Dissolver', stock: 30, unit: 'Vial', min_stock_alert: 5, status: 'In Stock' },
            { name: 'Sunscreen SPF 50', stock: 50, unit: 'Bottle', min_stock_alert: 20, status: 'In Stock' }
        ];

        const { error: invError } = await supabase
            .from('inventory')
            .insert(dummyProducts);

        if (invError) console.warn('Inventory seed warning:', invError);
        console.log('Seeded Inventory.');

        // 3. Seed Services (Need IDs for appointments)
        // Check existing services
        let { data: services } = await supabase.from('services').select('id, name').limit(5);
        if (!services || services.length === 0) {
            // Create dummy services if none exist
            const dServices = [
                { name: 'Botox Full Face', duration_min: 30, price: 350 },
                { name: 'Lip Filler', duration_min: 45, price: 400 },
                { name: 'HydraFacial', duration_min: 60, price: 150 },
                { name: 'Consultation', duration_min: 15, price: 0 }
            ];
            const { data: newServices } = await supabase.from('services').insert(dServices).select();
            services = newServices;
        }

        // 4. Seed Appointments (Randomly this month)
        if (clients && clients.length > 0 && services && services.length > 0) {
            const appointments = [];
            const statuses = ['Confirmed', 'Confirmed', 'Completed', 'Cancelled', 'Scheduled'];

            // Generate 20 random appointments
            for (let i = 0; i < 20; i++) {
                const randomClient = clients[Math.floor(Math.random() * clients.length)];
                const randomService = services[Math.floor(Math.random() * services.length)];

                // Random date this month
                const d = new Date();
                const randomDay = Math.floor(Math.random() * 28) + 1; // 1-28
                d.setDate(randomDay);
                const dateStr = d.toISOString().split('T')[0];

                // Random time (09:00 - 17:00) - simplified
                const h = Math.floor(Math.random() * 9) + 9;
                const m = Math.random() > 0.5 ? '00' : '30';
                const timeStr = `${h < 10 ? '0' + h : h}:${m}`;

                appointments.push({
                    // We must manually set 'client_id' (FK to client) and 'service_id'.
                    // The trigger sets 'clinic_id'.
                    // It is DIFFERENT from the 'clinic_id'.
                    // The trigger sets 'clinic_id'.
                    // We must manually set 'client_id' (FK to client) and 'service_id'.
                    // And we leave 'clinic_id' as null to be auto-filled by trigger?
                    // Yes, we leave 'clinic_id' null. 

                    client_id: randomClient.id,
                    staff_id: currentUserId, // Assign to current user so they see it!
                    service_id: randomService.id,
                    date: dateStr,
                    time: timeStr,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    notes: 'Seeded Appointment'
                });
            }

            const { error: aptError } = await supabase.from('appointments').insert(appointments);
            if (aptError) throw aptError;
            console.log(`Seeded ${appointments.length} appointments.`);
        }

        return { success: true, message: 'Database populated successfully!' };

    } catch (error) {
        console.error('Seeding failed:', error);
        return { success: false, message: error.message };
    }
};
