import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import InventoryStats from '../components/inventory/InventoryStats';
import ProductCard from '../components/inventory/ProductCard';
import ProductModal from '../components/inventory/ProductModal';
import { useToast } from '../context/ToastContext';

export default function Inventory() {
    const { success, error: showError } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // New state for custom delete modal
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);



    const fetchInventory = async (retryCount = 0) => {
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Create a race between data fetch and a timeout
            const fetchPromise = supabase
                .from('inventory')
                .select('*')
                .order('name', { ascending: true });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);

            // Auto-Retry on Timeout or Network Error (up to 2 times)
            const isNetworkError = error.message === 'TIMEOUT' || error.message?.includes('fetch');
            if (isNetworkError && retryCount < 2) {
                console.warn(`Retry attempt ${retryCount + 1} for inventory...`);
                return fetchInventory(retryCount + 1);
            }

            showError('Connection unstable. Could not load inventory.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('inventory')
                .delete()
                .eq('id', confirmDeleteId);

            if (error) throw error;

            success('Product deleted successfully');
            // Close modal and refresh
            setConfirmDeleteId(null);
            fetchInventory();
        } catch (error) {
            console.error('Error deleting product:', error);
            showError('Failed to delete product');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    // Derived State
    const filteredProducts = products.filter(p => {
        // Status Filter
        let matchesStatus = true;
        if (filter === 'Low Stock') matchesStatus = p.stock <= (p.min_stock_alert || 5) && p.stock > 0;
        if (filter === 'Out of Stock') matchesStatus = p.stock === 0;

        // Search Filter
        let matchesSearch = true;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            matchesSearch = p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term));
        }

        return matchesStatus && matchesSearch;
    });

    const lowStockCount = products.filter(p => p.stock <= (p.min_stock_alert || 5) && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    return (
        <div className="pb-24 bg-background-light min-h-screen">
            <header className="flex items-center justify-between p-6 pb-2 sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm">
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">Inventory</h2>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm text-slate-900 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            </header>

            <InventoryStats products={products} />

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 px-5 pt-4">
                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilter('All')}
                        className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-xl transition-colors ${filter === 'All' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="text-sm font-semibold">All Items</span>
                    </button>
                    <button
                        onClick={() => setFilter('Low Stock')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-2 px-5 rounded-xl transition-colors ${filter === 'Low Stock' ? 'bg-amber-100 border border-amber-200 text-amber-900' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="text-sm font-medium">Low Stock</span>
                        {lowStockCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{lowStockCount}</span>}
                    </button>
                    <button
                        onClick={() => setFilter('Out of Stock')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-2 px-5 rounded-xl transition-colors ${filter === 'Out of Stock' ? 'bg-rose-100 border border-rose-200 text-rose-900' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="text-sm font-medium">Out of Stock</span>
                        {outOfStockCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{outOfStockCount}</span>}
                    </button>
                </div>
            </div>

            {/* Product List */}
            <div className="flex flex-col gap-4 px-5 mt-6">
                <h2 className="text-lg font-bold text-slate-900">Products List</h2>
                {loading && products.length === 0 ? (
                    <div className="flex justify-center p-8">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    </div>
                ) : (
                    <>
                        {loading && <div className="hidden md:block absolute top-4 right-4 text-xs text-primary font-bold animate-pulse">Syncing...</div>}
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </>
                )}
            </div>



            <ProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                productToEdit={editingProduct}
                onSuccess={() => {
                    fetchInventory();
                }}
            />

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">delete</span>
                        </div>
                        <h3 className="text-center text-lg font-bold text-slate-900 mb-2">Delete Product?</h3>
                        <p className="text-center text-slate-500 text-sm mb-6">
                            This action cannot be undone. Are you sure you want to remove this product from inventory?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
