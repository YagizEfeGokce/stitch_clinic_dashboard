import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import KPICard from '../components/finance/KPICard';
import RevenueChart from '../components/finance/RevenueChart';
import RevenueBreakdown from '../components/finance/RevenueBreakdown';
import TransactionTable from '../components/finance/TransactionTable';
import AddTransactionModal from '../components/finance/AddTransactionModal';
import MonthPicker from '../components/ui/MonthPicker';

export default function Finance() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filter, setFilter] = useState('This Month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [filter, selectedMonth]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (filter !== 'All Time') {
                const now = new Date();
                let start, end;

                if (filter === 'This Month') {
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                } else if (filter === 'Custom Month') {
                    const [y, m] = selectedMonth.split('-').map(Number);
                    start = new Date(y, m - 2, 1);
                    end = new Date(y, m, 0, 23, 59, 59, 999);
                }

                if (start && end) {
                    query = query.gte('date', start.toISOString()).lte('date', end.toISOString());
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        let start, end, prevStart, prevEnd;

        if (filter === 'This Month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (filter === 'Custom Month') {
            const [y, m] = selectedMonth.split('-').map(Number);
            start = new Date(y, m - 1, 1);
            end = new Date(y, m, 0, 23, 59, 59);
            prevStart = new Date(y, m - 2, 1);
            prevEnd = new Date(y, m - 1, 0, 23, 59, 59);
        } else {
            return { start: null, end: null, prevStart: null, prevEnd: null };
        }
        return { start, end, prevStart, prevEnd };
    };

    const { start, end, prevStart, prevEnd } = getDateRange();

    const currentTxns = transactions.filter(t => {
        if (!start) return true;
        const d = new Date(t.date);
        return d >= start && d <= end;
    });

    const prevTxns = transactions.filter(t => {
        if (!prevStart) return false;
        const d = new Date(t.date);
        return d >= prevStart && d <= prevEnd;
    });

    const calculateKPIs = (txns) => {
        const rev = txns.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const exp = txns.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const profit = rev - exp;
        const count = txns.filter(t => t.type === 'Income').length;
        const avg = count > 0 ? rev / count : 0;
        return { rev, exp, profit, avg };
    };

    const currentKPIs = calculateKPIs(currentTxns);
    const prevKPIs = calculateKPIs(prevTxns);

    const getPctChange = (curr, prev) => {
        if (!prev || prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    const revPct = getPctChange(currentKPIs.rev, prevKPIs.rev);
    const profitPct = getPctChange(currentKPIs.profit, prevKPIs.profit);
    const expPct = getPctChange(currentKPIs.exp, prevKPIs.exp);
    const avgPct = getPctChange(currentKPIs.avg, prevKPIs.avg);

    const formatPct = (pct) => {
        if (!start) return "";
        const sign = pct >= 0 ? "+" : "";
        return `${sign}${Math.round(pct)}%`;
    };

    const filteredTransactions = currentTxns;
    const totalRevenue = currentKPIs.rev;
    const totalExpense = currentKPIs.exp;
    const netProfit = currentKPIs.profit;
    const avgTicket = currentKPIs.avg;

    return (
        <div className="p-5 pb-32">
            <div className="flex flex-col gap-1 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
                        <p className="text-sm text-slate-500">Here's your clinic's financial update.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="hidden md:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Filter & Month Selection - RELATIVE for Positioning */}
            <div className="flex flex-wrap items-center gap-3 mb-6 relative">
                <div className="flex bg-white p-1 rounded-xl shadow-sm ring-1 ring-slate-100">
                    {['All Time', 'This Month', 'Custom Month'].map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                setFilter(f);
                                if (f === 'This Month') {
                                    const now = new Date();
                                    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                                    setIsPickerOpen(false);
                                }
                                if (f === 'Custom Month') {
                                    setIsPickerOpen(!isPickerOpen);
                                } else {
                                    setIsPickerOpen(false);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Custom Month Picker */}
                {isPickerOpen && (
                    <MonthPicker
                        selectedMonth={selectedMonth}
                        onChange={(val) => {
                            setSelectedMonth(val);
                            // Keep filter
                        }}
                        onClose={() => setIsPickerOpen(false)}
                    />
                )}

                {/* Selected Month Label */}
                {filter === 'Custom Month' && !isPickerOpen && (
                    <div
                        onClick={() => setIsPickerOpen(true)}
                        className="text-sm font-bold text-slate-500 flex items-center gap-2 animate-in fade-in cursor-pointer hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* KPI Cards Carousel - No Scrollbar */}
                <div
                    className="flex gap-4 overflow-x-auto pb-0 -mx-5 px-5 snap-x [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="snap-center shrink-0 w-[240px]">
                        <KPICard
                            title="Total Revenue"
                            amount={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            percentage={filter === 'This Month' ? formatPct(revPct) : ""}
                            icon="payments"
                            color="primary"
                        />
                    </div>
                    <div className="snap-center shrink-0 w-[240px]">
                        <KPICard
                            title="Net Profit"
                            amount={`$${netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            percentage={filter === 'This Month' ? formatPct(profitPct) : ""}
                            icon="savings"
                            color={netProfit >= 0 ? "blue" : "red"}
                        />
                    </div>
                    <div className="snap-center shrink-0 w-[240px]">
                        <KPICard
                            title="Total Expense"
                            amount={`$${totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            percentage={filter === 'This Month' ? formatPct(expPct) : ""}
                            icon="trending_down"
                            color="red"
                        />
                    </div>
                    <div className="snap-center shrink-0 w-[240px]">
                        <KPICard
                            title="Avg. Ticket"
                            amount={`$${avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            percentage={filter === 'This Month' ? formatPct(avgPct) : ""}
                            icon="sell"
                            color="purple"
                        />
                    </div>
                </div>

                {/* Main Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RevenueChart transactions={filteredTransactions} />
                    <RevenueBreakdown transactions={filteredTransactions} />
                </div>

                {/* Transactions */}
                <TransactionTable transactions={filteredTransactions} onRefresh={fetchTransactions} />
            </div>

            {/* FAB for Add Transaction (Mobile) */}
            <div className="fixed bottom-24 right-5 z-40 md:hidden">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
            </div>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchTransactions}
            />
        </div>
    );
}
