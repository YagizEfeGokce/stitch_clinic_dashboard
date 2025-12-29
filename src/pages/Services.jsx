import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ServiceList from '../components/services/ServiceList';
import ServiceModal from '../components/services/ServiceModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { logActivity } from '../lib/logger';

import { useAuth } from '../context/AuthContext';

export default function Services() {
    const { role } = useAuth(); // Get Access Role
    const isStaff = role === 'staff';

    const { success, error: showError } = useToast();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);


    useEffect(() => {
        fetchServices();
    }, []);

    // Failsafe
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => setLoading(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        const service = services.find(s => s.id === id);
        setServiceToDelete(service);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceToDelete.id);

            if (error) throw error;

            await logActivity('Deleted Service', {
                service_name: serviceToDelete.name,
                service_id: serviceToDelete.id
            });

            success('Service deleted successfully');
            fetchServices();
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
        } catch (error) {
            console.error('Error deleting service:', error);
            showError('Failed to delete service');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setSelectedService(null);
        setIsModalOpen(true);
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Services</h1>
                    <p className="text-slate-500 mt-1">Manage treatments and pricing</p>
                </div>
                {!isStaff && (
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span>Add Service</span>
                    </button>
                )}
            </header>

            {/* Search */}
            <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </div>
            ) : (
                <ServiceList
                    services={filteredServices}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                />
            )}

            <ServiceModal
                isOpen={isModalOpen}
                service={selectedService}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedService(null);
                }}
                onSuccess={fetchServices}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Service"
                message={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
