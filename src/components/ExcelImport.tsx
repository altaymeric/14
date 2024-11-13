import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { parse, isValid, isBefore, startOfDay } from 'date-fns';
import { Payment } from '../types/payment';

interface ExcelImportProps {
  onImport: (payments: Payment[]) => void;
}

interface ImportSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
}

function ImportSuccessDialog({ isOpen, onClose, count, totalAmount, paidCount, paidAmount }: ImportSuccessDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="relative z-50 w-full max-w-md transform bg-white rounded-lg shadow-xl">
          <div className="bg-green-50 p-6 rounded-t-lg border-b border-green-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Aktarım Başarılı</h3>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Toplam Aktarılan</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Çek Sayısı:</span>
                  <span className="font-semibold text-gray-900">{count} adet</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Toplam Tutar:</span>
                  <span className="font-semibold text-gray-900">
                    {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
              </div>

              {paidCount > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 mb-2">Vadesi Geçmiş - Ödendi Olarak İşaretlendi</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Çek Sayısı:</span>
                    <span className="font-semibold text-red-900">{paidCount} adet</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-red-600">Toplam Tutar:</span>
                    <span className="font-semibold text-red-900">
                      {paidAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExcelImport({ onImport }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [importData, setImportData] = useState<{
    count: number;
    totalAmount: number;
    paidCount: number;
    paidAmount: number;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const payments = processImportedData(jsonData);
        onImport(payments);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        const paidPayments = payments.filter(p => p.status === 'paid');
        
        setImportData({
          count: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
          paidCount: paidPayments.length,
          paidAmount: paidPayments.reduce((sum, p) => sum + p.amount, 0)
        });
        setShowSuccessDialog(true);
      } catch (error: any) {
        console.error('Excel okuma hatası:', error);
        alert(error.message || 'Excel dosyası okunurken bir hata oluştu');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImportedData = (data: any[][]): Payment[] => {
    if (data.length < 2) {
      throw new Error('Excel dosyasında veri bulunamadı');
    }

    const expectedColumns = [
      'Vade Tarihi',
      'Çek No',
      'Banka',
      'Firma',
      'İş Grubu',
      'Açıklama',
      'Tutar'
    ];

    const headers = (data[0] as any[]).map(h => String(h).trim());
    
    const isValidColumnOrder = expectedColumns.every((col, index) => 
      headers[index]?.toLowerCase() === col.toLowerCase()
    );

    if (!isValidColumnOrder) {
      throw new Error(`Excel dosyası beklenen sütun sırasına sahip olmalıdır:\n${expectedColumns.join(', ')}`);
    }

    const today = startOfDay(new Date());

    return data.slice(1)
      .filter(row => row.length >= expectedColumns.length)
      .map(row => {
        const dueDate = parseExcelDate(row[0]);
        const isPastDue = isBefore(dueDate, today);

        return {
          id: crypto.randomUUID(),
          dueDate,
          checkNumber: String(row[1] || ''),
          bank: String(row[2] || ''),
          company: String(row[3] || ''),
          businessGroup: String(row[4] || ''),
          description: String(row[5] || ''),
          amount: typeof row[6] === 'number' ? row[6] : parseFloat(String(row[6]).replace(/[^\d.-]/g, '')),
          status: isPastDue ? 'paid' as const : 'pending' as const
        };
      })
      .filter(payment => 
        payment.checkNumber && 
        payment.bank && 
        payment.company && 
        payment.businessGroup && 
        payment.amount > 0
      );
  };

  const parseExcelDate = (value: any): Date => {
    if (!value) return new Date();

    if (typeof value === 'number') {
      const date = new Date((value - (25567 + 2)) * 86400 * 1000);
      if (isValid(date)) return date;
    }

    if (typeof value === 'string') {
      const formats = ['dd.MM.yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
      for (const format of formats) {
        const parsedDate = parse(value, format, new Date());
        if (isValid(parsedDate)) return parsedDate;
      }
    }

    return new Date();
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 h-[38px]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Excel'den Aktar</span>
      </button>

      {importData && (
        <ImportSuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            setImportData(null);
          }}
          count={importData.count}
          totalAmount={importData.totalAmount}
          paidCount={importData.paidCount}
          paidAmount={importData.paidAmount}
        />
      )}
    </div>
  );
}