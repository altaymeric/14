import React from 'react';

interface ImportSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
}

export function ImportSuccessDialog({ 
  isOpen, 
  onClose, 
  count, 
  totalAmount, 
  paidCount, 
  paidAmount 
}: ImportSuccessDialogProps) {
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