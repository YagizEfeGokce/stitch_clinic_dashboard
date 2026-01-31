import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';

const TEMPLATES = {
    musteriler: {
        headers: ['Ad', 'Soyad', 'Telefon', 'E-posta', 'Doğum Tarihi', 'Cinsiyet', 'Adres', 'Notlar', 'Kayıt Tarihi'],
        table: 'clients',
        requiredFields: ['Ad', 'Telefon']
    },
    hizmetler: {
        headers: ['Hizmet Adı', 'Kategori', 'Fiyat (₺)', 'Süre (dk)', 'Açıklama', 'Durum'],
        table: 'services',
        requiredFields: ['Hizmet Adı', 'Fiyat (₺)', 'Süre (dk)']
    },
    envanter: {
        headers: ['Ürün Adı', 'Kategori', 'Stok Miktarı', 'Birim', 'Min. Stok', 'Tedarikçi', 'Son Güncelleme'],
        table: 'inventory',
        requiredFields: ['Ürün Adı', 'Stok Miktarı']
    },
    randevular: {
        headers: ['Tarih', 'Saat', 'Müşteri Adı', 'Hizmet', 'Durum', 'Ödeme Durumu', 'Tutar (₺)', 'Notlar'],
        table: 'appointments',
        requiredFields: ['Tarih', 'Saat', 'Müşteri Adı', 'Hizmet', 'Durum', 'Tutar (₺)']
    }
};

const MAX_ROWS = 1000;
const BATCH_SIZE = 100;

export const downloadTemplate = (templateKey) => {
    const template = TEMPLATES[templateKey];
    if (!template) return;

    const csv = Papa.unparse([template.headers], { header: false });
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateKey}-sablon.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export const parseFile = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'xlsx' || extension === 'xls') {
        return parseExcel(file);
    } else if (extension === 'csv') {
        return parseCsv(file);
    }

    throw new Error('Desteklenmeyen dosya formatı. Sadece CSV ve Excel dosyaları kabul edilir.');
};

const parseCsv = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(new Error(`CSV okuma hatası: ${error.message}`));
            }
        });
    });
};

const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                resolve(jsonData);
            } catch (error) {
                reject(new Error(`Excel okuma hatası: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsArrayBuffer(file);
    });
};

export const detectFileType = (rows) => {
    if (!rows || rows.length === 0) return null;

    const headers = Object.keys(rows[0]);

    for (const [key, template] of Object.entries(TEMPLATES)) {
        const matchCount = template.headers.filter(h => headers.includes(h)).length;
        if (matchCount >= template.requiredFields.length) {
            return key;
        }
    }

    return null;
};

const isValidEmail = (email) => {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\s/g, '');
    const regex1 = /^\+90[5][0-9]{9}$/;
    const regex2 = /^0[5][0-9]{9}$/;
    const regex3 = /^[5][0-9]{9}$/;
    return regex1.test(cleaned) || regex2.test(cleaned) || regex3.test(cleaned);
};

const isValidDateDMY = (dateStr) => {
    if (!dateStr) return true;
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    return true;
};

const isValidTime = (timeStr) => {
    if (!timeStr) return false;
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(timeStr);
};

const parseDateDMY = (dateStr) => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return null;
    return `${match[3]}-${match[2]}-${match[1]}`;
};

const normalizePhone = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+90')) cleaned = cleaned.slice(3);
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    return cleaned;
};

export const validateRows = async (rows, fileType) => {
    const template = TEMPLATES[fileType];
    if (!template) {
        return { valid: [], invalid: [], errors: ['Bilinmeyen dosya tipi'] };
    }

    if (rows.length > MAX_ROWS) {
        return { valid: [], invalid: [], errors: [`Maksimum ${MAX_ROWS} satır yüklenebilir. Dosyanızda ${rows.length} satır var.`] };
    }

    const valid = [];
    const invalid = [];
    let existingPhones = new Set();
    let existingClients = {};
    let existingServices = {};

    if (fileType === 'musteriler') {
        const { data: clients } = await supabase.from('clients').select('phone');
        existingPhones = new Set(clients?.map(c => normalizePhone(c.phone)) || []);
    }

    if (fileType === 'randevular') {
        const { data: clients } = await supabase.from('clients').select('id, first_name, last_name');
        clients?.forEach(c => {
            const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
            existingClients[fullName] = c.id;
        });

        const { data: services } = await supabase.from('services').select('id, name');
        services?.forEach(s => {
            existingServices[(s.name || '').toLowerCase()] = s.id;
        });
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowErrors = [];
        const rowNumber = i + 2;

        for (const field of template.requiredFields) {
            if (!row[field] || String(row[field]).trim() === '') {
                rowErrors.push(`"${field}" alanı zorunludur`);
            }
        }

        if (fileType === 'musteriler') {
            if (row['Ad'] && String(row['Ad']).length > 50) {
                rowErrors.push('Ad 50 karakterden uzun olamaz');
            }
            if (row['Telefon'] && !isValidPhone(row['Telefon'])) {
                rowErrors.push('Geçersiz telefon formatı');
            }
            if (row['E-posta'] && !isValidEmail(row['E-posta'])) {
                rowErrors.push('Geçersiz e-posta formatı');
            }
            if (row['Doğum Tarihi'] && !isValidDateDMY(row['Doğum Tarihi'])) {
                rowErrors.push('Doğum tarihi DD.MM.YYYY formatında olmalı');
            }
            if (row['Cinsiyet'] && !['Erkek', 'Kadın'].includes(row['Cinsiyet'])) {
                rowErrors.push('Cinsiyet "Erkek" veya "Kadın" olmalı');
            }
            const phone = normalizePhone(row['Telefon']);
            if (phone && existingPhones.has(phone)) {
                rowErrors.push('Bu telefon numarası zaten kayıtlı');
            }
        }

        if (fileType === 'hizmetler') {
            if (row['Hizmet Adı'] && String(row['Hizmet Adı']).length > 100) {
                rowErrors.push('Hizmet adı 100 karakterden uzun olamaz');
            }
            const price = parseFloat(row['Fiyat (₺)']);
            if (row['Fiyat (₺)'] && (isNaN(price) || price < 0)) {
                rowErrors.push('Fiyat geçerli bir sayı olmalı (min 0)');
            }
            const duration = parseInt(row['Süre (dk)'], 10);
            if (row['Süre (dk)'] && (isNaN(duration) || duration < 1)) {
                rowErrors.push('Süre geçerli bir tam sayı olmalı (min 1)');
            }
            if (row['Durum'] && !['Aktif', 'Pasif'].includes(row['Durum'])) {
                rowErrors.push('Durum "Aktif" veya "Pasif" olmalı');
            }
        }

        if (fileType === 'envanter') {
            if (row['Ürün Adı'] && String(row['Ürün Adı']).length > 100) {
                rowErrors.push('Ürün adı 100 karakterden uzun olamaz');
            }
            const stock = parseInt(row['Stok Miktarı'], 10);
            if (row['Stok Miktarı'] && (isNaN(stock) || stock < 0)) {
                rowErrors.push('Stok miktarı geçerli bir tam sayı olmalı (min 0)');
            }
            if (row['Min. Stok']) {
                const minStock = parseInt(row['Min. Stok'], 10);
                if (isNaN(minStock)) {
                    rowErrors.push('Min. stok geçerli bir tam sayı olmalı');
                }
            }
        }

        if (fileType === 'randevular') {
            if (row['Tarih'] && !isValidDateDMY(row['Tarih'])) {
                rowErrors.push('Tarih DD.MM.YYYY formatında olmalı');
            }
            if (row['Saat'] && !isValidTime(row['Saat'])) {
                rowErrors.push('Saat HH:mm formatında olmalı');
            }
            const clientName = (row['Müşteri Adı'] || '').toLowerCase().trim();
            if (clientName && !existingClients[clientName]) {
                rowErrors.push('Müşteri bulunamadı');
            }
            const serviceName = (row['Hizmet'] || '').toLowerCase().trim();
            if (serviceName && !existingServices[serviceName]) {
                rowErrors.push('Hizmet bulunamadı');
            }
            const validStatuses = ['Tamamlandı', 'Onaylandı', 'Planlandı', 'İptal'];
            if (row['Durum'] && !validStatuses.includes(row['Durum'])) {
                rowErrors.push('Geçersiz durum değeri');
            }
            const amount = parseFloat(row['Tutar (₺)']);
            if (row['Tutar (₺)'] && (isNaN(amount) || amount < 0)) {
                rowErrors.push('Tutar geçerli bir sayı olmalı (min 0)');
            }
        }

        if (rowErrors.length > 0) {
            invalid.push({ rowNumber, data: row, errors: rowErrors });
        } else {
            valid.push({ rowNumber, data: row });
        }
    }

    return { valid, invalid, errors: [], existingClients, existingServices };
};

const mapRowToClient = (row) => {
    return {
        first_name: row['Ad'] || null,
        last_name: row['Soyad'] || null,
        phone: normalizePhone(row['Telefon']),
        email: row['E-posta'] || null,
        date_of_birth: parseDateDMY(row['Doğum Tarihi']),
        gender: row['Cinsiyet'] === 'Erkek' ? 'male' : row['Cinsiyet'] === 'Kadın' ? 'female' : null,
        address: row['Adres'] || null,
        notes: row['Notlar'] || null
    };
};

const mapRowToService = (row) => {
    return {
        name: row['Hizmet Adı'] || null,
        category: row['Kategori'] || null,
        price: parseFloat(row['Fiyat (₺)']) || 0,
        duration: parseInt(row['Süre (dk)'], 10) || 30,
        description: row['Açıklama'] || null,
        is_active: row['Durum'] !== 'Pasif'
    };
};

const mapRowToInventory = (row) => {
    return {
        name: row['Ürün Adı'] || null,
        category: row['Kategori'] || null,
        quantity: parseInt(row['Stok Miktarı'], 10) || 0,
        unit: row['Birim'] || 'adet',
        min_stock: row['Min. Stok'] ? parseInt(row['Min. Stok'], 10) : null,
        supplier: row['Tedarikçi'] || null
    };
};

const mapRowToAppointment = (row, existingClients, existingServices) => {
    const clientName = (row['Müşteri Adı'] || '').toLowerCase().trim();
    const serviceName = (row['Hizmet'] || '').toLowerCase().trim();

    const statusMap = {
        'Tamamlandı': 'completed',
        'Onaylandı': 'confirmed',
        'Planlandı': 'scheduled',
        'İptal': 'cancelled'
    };

    const paymentMap = {
        'Ödendi': 'paid',
        'Bekliyor': 'pending',
        'İptal': 'refunded'
    };

    return {
        client_id: existingClients[clientName] || null,
        service_id: existingServices[serviceName] || null,
        date: parseDateDMY(row['Tarih']),
        time: row['Saat'] || null,
        status: statusMap[row['Durum']] || 'scheduled',
        payment_status: paymentMap[row['Ödeme Durumu']] || 'pending',
        price: parseFloat(row['Tutar (₺)']) || 0,
        notes: row['Notlar'] || null
    };
};

export const importData = async (validRows, fileType, onProgress, existingClients = {}, existingServices = {}) => {
    const template = TEMPLATES[fileType];
    if (!template) throw new Error('Bilinmeyen dosya tipi');

    const total = validRows.length;
    let imported = 0;
    const errors = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);

        let mappedBatch;
        switch (fileType) {
            case 'musteriler':
                mappedBatch = batch.map(r => mapRowToClient(r.data));
                break;
            case 'hizmetler':
                mappedBatch = batch.map(r => mapRowToService(r.data));
                break;
            case 'envanter':
                mappedBatch = batch.map(r => mapRowToInventory(r.data));
                break;
            case 'randevular':
                mappedBatch = batch.map(r => mapRowToAppointment(r.data, existingClients, existingServices));
                break;
            default:
                throw new Error('Desteklenmeyen tablo');
        }

        const { error } = await supabase.from(template.table).insert(mappedBatch);

        if (error) {
            console.error('[Import Error]', error);
            errors.push(`Satır ${i + 2} - ${i + batch.length + 1}: ${error.message}`);
        } else {
            imported += batch.length;
        }

        onProgress?.(imported, total);
    }

    return { imported, errors };
};

export const generateErrorReport = (invalidRows) => {
    const reportRows = invalidRows.map(row => ({
        'Satır No': row.rowNumber,
        'Hatalar': row.errors.join('; '),
        ...row.data
    }));

    const csv = Papa.unparse(reportRows, { header: true });
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hatali-satirlar.csv';
    link.click();
    URL.revokeObjectURL(url);
};
