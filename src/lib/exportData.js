import Papa from 'papaparse';
import JSZip from 'jszip';
import { supabase } from './supabase';

const TURKISH_MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
};

const formatBoolean = (value) => {
    if (value === true) return 'Evet';
    if (value === false) return 'Hayır';
    return '';
};

const formatGender = (gender) => {
    if (!gender) return '';
    const map = { male: 'Erkek', female: 'Kadın', other: 'Diğer' };
    return map[gender] || gender;
};

const formatStatus = (status) => {
    if (!status) return '';
    const map = {
        Scheduled: 'Planlandı',
        Confirmed: 'Onaylandı',
        Pending: 'Beklemede',
        Completed: 'Tamamlandı',
        Cancelled: 'İptal Edildi',
        NoShow: 'Gelmedi'
    };
    return map[status] || status;
};

const formatPaymentStatus = (status) => {
    if (!status) return '';
    const map = {
        Unpaid: 'Ödenmedi',
        Partial: 'Kısmi Ödeme',
        Paid: 'Ödendi',
        Refunded: 'İade Edildi'
    };
    return map[status] || status;
};

const formatTransactionType = (type) => {
    if (!type) return '';
    const map = { income: 'Gelir', expense: 'Gider' };
    return map[type] || type;
};

const clean = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const getMonthKey = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    return `${TURKISH_MONTHS[parseInt(month, 10) - 1]} ${year}`;
};

const fetchAllData = async (tableName, selectQuery, orderBy = 'created_at') => {
    const BATCH_SIZE = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from(tableName)
            .select(selectQuery)
            .order(orderBy, { ascending: false })
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            offset += BATCH_SIZE;
            hasMore = data.length === BATCH_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allData;
};

const exportClients = async () => {
    const data = await fetchAllData('clients', '*', 'created_at');

    const rows = data.map(row => ({
        'Ad': clean(row.first_name),
        'Soyad': clean(row.last_name),
        'Telefon': clean(row.phone),
        'E-posta': clean(row.email),
        'Doğum Tarihi': formatDate(row.birth_date),
        'Cinsiyet': formatGender(row.gender),
        'Adres': clean(row.address),
        'Notlar': clean(row.notes),
        'Kayıt Tarihi': formatDate(row.created_at)
    }));

    return Papa.unparse(rows, { header: true });
};

const exportServices = async () => {
    const data = await fetchAllData('services', '*', 'created_at');

    const rows = data.map(row => ({
        'Hizmet Adı': clean(row.name),
        'Kategori': '',
        'Fiyat (₺)': row.price ? Number(row.price).toFixed(2) : '',
        'Süre (dk)': clean(row.duration_min),
        'Açıklama': clean(row.description),
        'Durum': formatBoolean(row.active)
    }));

    return Papa.unparse(rows, { header: true });
};

const exportInventory = async () => {
    const data = await fetchAllData('inventory', '*', 'updated_at');

    const rows = data.map(row => ({
        'Ürün Adı': clean(row.name),
        'Kategori': clean(row.category),
        'Stok Miktarı': clean(row.stock),
        'Birim': clean(row.unit),
        'Min. Stok': clean(row.min_stock_alert),
        'Tedarikçi': clean(row.supplier),
        'Son Güncelleme': formatDate(row.updated_at)
    }));

    return Papa.unparse(rows, { header: true });
};

const exportAppointments = async () => {
    const data = await fetchAllData(
        'appointments',
        `*, clients(first_name, last_name, full_name), services(name, price)`,
        'date'
    );

    const rows = data.map(row => {
        const clientName = row.clients?.full_name ||
            (row.clients ? `${row.clients.first_name || ''} ${row.clients.last_name || ''}`.trim() : '');
        const serviceName = row.services?.name || '';
        const servicePrice = row.services?.price;

        return {
            'Ay': getMonthLabel(getMonthKey(row.date)),
            'Tarih': formatDate(row.date),
            'Saat': formatTime(row.time),
            'Müşteri Adı': clientName,
            'Hizmet': serviceName,
            'Durum': formatStatus(row.status),
            'Ödeme Durumu': formatPaymentStatus(row.payment_status),
            'Tutar (₺)': servicePrice ? Number(servicePrice).toFixed(2) : '',
            'Notlar': clean(row.notes)
        };
    });

    return Papa.unparse(rows, { header: true });
};

const exportFinance = async () => {
    const data = await fetchAllData(
        'transactions',
        `*, clients(first_name, last_name, full_name)`,
        'date'
    );

    const rows = data.map(row => {
        const clientName = row.clients?.full_name ||
            (row.clients ? `${row.clients.first_name || ''} ${row.clients.last_name || ''}`.trim() : '');

        return {
            'Ay': getMonthLabel(getMonthKey(row.date)),
            'Tarih': formatDate(row.date),
            'Tür': formatTransactionType(row.type),
            'Tutar (₺)': row.amount ? Number(row.amount).toFixed(2) : '',
            'Kategori': clean(row.category),
            'Açıklama': clean(row.description),
            'Ödeme Yöntemi': clean(row.payment_method),
            'Müşteri': clientName
        };
    });

    return Papa.unparse(rows, { header: true });
};

const exportPerformance = async () => {
    const data = await fetchAllData(
        'appointments',
        `*, profiles!staff_id(full_name), services(name, price)`,
        'date'
    );

    const monthlyStats = {};

    data.forEach(row => {
        const monthKey = getMonthKey(row.date);
        if (!monthKey) return;

        const staffName = row.profiles?.full_name || 'Atanmamış';
        const key = `${monthKey}|${staffName}`;

        if (!monthlyStats[key]) {
            monthlyStats[key] = {
                month: monthKey,
                staff: staffName,
                totalAppointments: 0,
                completed: 0,
                cancelled: 0,
                noShow: 0,
                revenue: 0
            };
        }

        monthlyStats[key].totalAppointments++;

        if (row.status === 'Completed') {
            monthlyStats[key].completed++;
            if (row.services?.price) {
                monthlyStats[key].revenue += Number(row.services.price);
            }
        } else if (row.status === 'Cancelled') {
            monthlyStats[key].cancelled++;
        } else if (row.status === 'NoShow') {
            monthlyStats[key].noShow++;
        }
    });

    const sortedKeys = Object.keys(monthlyStats).sort((a, b) => b.localeCompare(a));

    const rows = sortedKeys.map(key => {
        const stat = monthlyStats[key];
        const completionRate = stat.totalAppointments > 0
            ? ((stat.completed / stat.totalAppointments) * 100).toFixed(1)
            : '0.0';

        return {
            'Ay': getMonthLabel(stat.month),
            'Personel': stat.staff,
            'Toplam Randevu': stat.totalAppointments,
            'Tamamlanan': stat.completed,
            'İptal Edilen': stat.cancelled,
            'Gelmeyen': stat.noShow,
            'Tamamlanma Oranı (%)': completionRate,
            'Toplam Gelir (₺)': stat.revenue.toFixed(2)
        };
    });

    return Papa.unparse(rows, { header: true });
};

const addBOM = (csvContent) => {
    return '\uFEFF' + csvContent;
};

export const exportAllData = async () => {
    const zip = new JSZip();
    const errors = [];

    try {
        const clientsCsv = await exportClients();
        zip.file('musteriler.csv', addBOM(clientsCsv));
    } catch (err) {
        console.error('[Export Error] clients:', err.code, err.message, err.details);
        errors.push(`Müşteriler: ${err.message}`);
    }

    try {
        const servicesCsv = await exportServices();
        zip.file('hizmetler.csv', addBOM(servicesCsv));
    } catch (err) {
        console.error('[Export Error] services:', err.code, err.message, err.details);
        errors.push(`Hizmetler: ${err.message}`);
    }

    try {
        const inventoryCsv = await exportInventory();
        zip.file('envanter.csv', addBOM(inventoryCsv));
    } catch (err) {
        console.error('[Export Error] inventory:', err.code, err.message, err.details);
        errors.push(`Envanter: ${err.message}`);
    }

    try {
        const appointmentsCsv = await exportAppointments();
        zip.file('randevular.csv', addBOM(appointmentsCsv));
    } catch (err) {
        console.error('[Export Error] appointments:', err.code, err.message, err.details);
        errors.push(`Randevular: ${err.message}`);
    }

    try {
        const financeCsv = await exportFinance();
        zip.file('finans.csv', addBOM(financeCsv));
    } catch (err) {
        console.error('[Export Error] transactions:', err.code, err.message, err.details);
        errors.push(`Finans: ${err.message}`);
    }

    try {
        const performanceCsv = await exportPerformance();
        zip.file('performans.csv', addBOM(performanceCsv));
    } catch (err) {
        console.error('[Export Error] performance:', err.code, err.message, err.details);
        errors.push(`Performans: ${err.message}`);
    }

    if (errors.length > 0) {
        zip.file('hata.txt', errors.join('\n'));
    }

    if (Object.keys(zip.files).length === 0) {
        throw new Error('Hiçbir veri dışa aktarılamadı.');
    }

    const blob = await zip.generateAsync({ type: 'blob' });

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `dermdesk-export-${dateStr}.zip`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return { success: true, hasErrors: errors.length > 0 };
};
