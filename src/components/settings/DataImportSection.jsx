import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '../../context/ToastContext';
import {
    downloadTemplate,
    parseFile,
    detectFileType,
    validateRows,
    importData,
    generateErrorReport
} from '../../lib/importData';

const FILE_TYPE_LABELS = {
    musteriler: 'Müşteriler',
    hizmetler: 'Hizmetler',
    envanter: 'Envanter',
    randevular: 'Randevular'
};

export default function DataImportSection() {
    const { success, error: showError } = useToast();
    const [file, setFile] = useState(null);
    const [rows, setRows] = useState([]);
    const [fileType, setFileType] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

    const onDrop = useCallback(async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setValidationResult(null);
        setIsValidating(true);

        try {
            const parsedRows = await parseFile(uploadedFile);
            setRows(parsedRows);

            const detected = detectFileType(parsedRows);
            if (!detected) {
                showError('Dosya formatı tanınamadı. Lütfen doğru şablonu kullanın.');
                setFile(null);
                setRows([]);
                setIsValidating(false);
                return;
            }

            setFileType(detected);
            const result = await validateRows(parsedRows, detected);
            setValidationResult(result);
        } catch (err) {
            console.error('[Parse Error]', err);
            showError(err.message || 'Dosya okunamadı');
            setFile(null);
            setRows([]);
        } finally {
            setIsValidating(false);
        }
    }, [showError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1,
        disabled: isImporting
    });

    const handleImport = async () => {
        if (!validationResult || validationResult.valid.length === 0) return;

        setIsImporting(true);
        setImportProgress({ current: 0, total: validationResult.valid.length });

        try {
            const { imported, errors } = await importData(
                validationResult.valid,
                fileType,
                (current, total) => setImportProgress({ current, total }),
                validationResult.existingClients,
                validationResult.existingServices
            );

            if (errors.length > 0) {
                showError(`${imported} kayıt içe aktarıldı, ancak ${errors.length} hata oluştu.`);
            } else {
                success(`${imported} kayıt başarıyla içe aktarıldı! ✅`);
            }

            setFile(null);
            setRows([]);
            setFileType(null);
            setValidationResult(null);
        } catch (err) {
            console.error('[Import Error]', err);
            showError('İçe aktarma sırasında hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadErrors = () => {
        if (validationResult?.invalid?.length > 0) {
            generateErrorReport(validationResult.invalid);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setRows([]);
        setFileType(null);
        setValidationResult(null);
    };

    const previewRows = rows.slice(0, 10);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">upload_file</span>
            </div>
            <div className="flex-1">
                <h4 className="text-slate-900 font-bold mb-1">Verileri İçe Aktar</h4>
                <p className="text-sm text-slate-500 mb-4">
                    CSV veya Excel dosyasından veri yükleyin. Önce şablon indirin, doldurun ve yükleyin.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => downloadTemplate('musteriler')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Müşteri Şablonu
                    </button>
                    <button
                        onClick={() => downloadTemplate('hizmetler')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Hizmet Şablonu
                    </button>
                    <button
                        onClick={() => downloadTemplate('envanter')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Envanter Şablonu
                    </button>
                    <button
                        onClick={() => downloadTemplate('randevular')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Randevu Şablonu
                    </button>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-green-400 bg-green-50'
                            : file
                                ? 'border-green-300 bg-green-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        } ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    {isValidating ? (
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-2xl text-slate-400">progress_activity</span>
                            <p className="text-slate-500 text-sm">Dosya doğrulanıyor...</p>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                            <p className="text-slate-700 text-sm font-medium">{file.name}</p>
                            {fileType && (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                    {FILE_TYPE_LABELS[fileType]}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                            <p className="text-slate-500 text-sm">
                                {isDragActive ? 'Dosyayı bırakın...' : 'Sürükle & Bırak veya Dosya Seç'}
                            </p>
                            <p className="text-slate-400 text-xs">CSV veya Excel (.xlsx) dosyaları</p>
                        </div>
                    )}
                </div>

                {validationResult && (
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                {validationResult.valid.length} geçerli satır
                            </span>
                            {validationResult.invalid.length > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    {validationResult.invalid.length} hatalı satır
                                </span>
                            )}
                        </div>

                        {previewRows.length > 0 && (
                            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-2 py-1.5 text-left text-slate-600 font-medium">#</th>
                                            {headers.map((header, idx) => (
                                                <th key={idx} className="px-2 py-1.5 text-left text-slate-600 font-medium whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, rowIdx) => {
                                            const invalidRow = validationResult.invalid.find(r => r.rowNumber === rowIdx + 2);
                                            return (
                                                <tr
                                                    key={rowIdx}
                                                    className={invalidRow ? 'bg-red-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                                                    title={invalidRow ? invalidRow.errors.join(', ') : ''}
                                                >
                                                    <td className="px-2 py-1 text-slate-400 border-t border-slate-100">
                                                        {rowIdx + 2}
                                                        {invalidRow && (
                                                            <span className="material-symbols-outlined text-red-500 text-[12px] ml-1">error</span>
                                                        )}
                                                    </td>
                                                    {headers.map((header, colIdx) => (
                                                        <td key={colIdx} className="px-2 py-1 text-slate-700 border-t border-slate-100 whitespace-nowrap max-w-[150px] truncate">
                                                            {row[header] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {rows.length > 10 && (
                            <p className="text-slate-400 text-xs text-center">
                                İlk 10 satır gösteriliyor ({rows.length} toplam)
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleImport}
                                disabled={isImporting || validationResult.valid.length === 0}
                                className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                        İçe aktarılıyor... {importProgress.current}/{importProgress.total}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">upload</span>
                                        İçe Aktar ({validationResult.valid.length} satır)
                                    </>
                                )}
                            </button>

                            {validationResult.invalid.length > 0 && (
                                <button
                                    onClick={handleDownloadErrors}
                                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Hata Raporu İndir
                                </button>
                            )}

                            <button
                                onClick={resetUpload}
                                disabled={isImporting}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                İptal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
