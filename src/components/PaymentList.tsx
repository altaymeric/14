import React, { useState, useEffect, useRef } from 'react';
import { format, parse, isSameMonth, isSameYear } from 'date-fns';
import { Payment } from '../types/payment';
import ContextMenu from './ContextMenu';
import ConfirmationDialog from './ConfirmationDialog';
import PrintOptions from './PrintOptions';
import FilterPopup from './FilterPopup';

interface Position {
  x: number;
  y: number;
}

interface PaymentListProps {
  payments: Payment[];
  onEdit?: (payment: Payment) => void;
  onStatusChange?: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
}

export default function PaymentList({ payments, onEdit, onStatusChange, onDelete }: PaymentListProps) {
  const [contextMenu, setContextMenu] = useState<{ position: Position; payment: Payment } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [showBusinessGroupFilter, setShowBusinessGroupFilter] = useState(false);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [showBankFilter, setShowBankFilter] = useState(false);
  const [selectedBusinessGroups, setSelectedBusinessGroups] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showPaidPayments, setShowPaidPayments] = useState(false);
  const businessGroupFilterRef = useRef<HTMLDivElement>(null);
  const companyFilterRef = useRef<HTMLDivElement>(null);
  const bankFilterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    month: '',
    checkNumber: '',
    description: '',
    amount: '',
    status: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (businessGroupFilterRef.current && !businessGroupFilterRef.current.contains(event.target as Node)) {
        setShowBusinessGroupFilter(false);
      }
      if (companyFilterRef.current && !companyFilterRef.current.contains(event.target as Node)) {
        setShowCompanyFilter(false);
      }
      if (bankFilterRef.current && !bankFilterRef.current.contains(event.target as Node)) {
        setShowBankFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFilters({
      month: '',
      checkNumber: '',
      description: '',
      amount: '',
      status: ''
    });
    setSelectedBusinessGroups([]);
    setSelectedCompanies([]);
    setSelectedBanks([]);
  }, [payments.length]);

  const handleContextMenu = (e: React.MouseEvent, payment: Payment, field: string) => {
    if (field === 'status') {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        payment
      });
    }
  };

  const handleEdit = () => {
    if (contextMenu && onEdit) {
      onEdit(contextMenu.payment);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      setPaymentToDelete(contextMenu.payment);
      setShowDeleteConfirmation(true);
      setContextMenu(null);
    }
  };

  const confirmDelete = () => {
    if (paymentToDelete && onDelete) {
      onDelete(paymentToDelete);
      setPaymentToDelete(null);
    }
  };

  const handleStatusClick = (payment: Payment) => {
    if (onStatusChange) {
      const nextStatus = getNextStatus(payment.status);
      onStatusChange({
        ...payment,
        status: nextStatus
      });
    }
  };

  const getNextStatus = (currentStatus: string): 'pending' | 'paid' | 'other' => {
    switch (currentStatus) {
      case 'pending':
        return 'paid';
      case 'paid':
        return 'other';
      case 'other':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'text-red-800';
      case 'pending':
        return 'text-yellow-800';
      case 'other':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'pending':
        return 'Ödenmedi';
      case 'other':
        return 'Diğer';
      default:
        return status;
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleBusinessGroupFilter = (businessGroup: string) => {
    setSelectedBusinessGroups(prev =>
      prev.includes(businessGroup)
        ? prev.filter(bg => bg !== businessGroup)
        : [...prev, businessGroup]
    );
  };

  const toggleCompanyFilter = (company: string) => {
    setSelectedCompanies(prev =>
      prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };

  const toggleBankFilter = (bank: string) => {
    setSelectedBanks(prev =>
      prev.includes(bank)
        ? prev.filter(b => b !== bank)
        : [...prev, bank]
    );
  };

  const filteredPayments = payments.filter(payment => {
    if (!showPaidPayments && payment.status === 'paid') {
      return false;
    }

    const monthFilter = filters.month 
      ? parse(filters.month, 'yyyy-MM', new Date())
      : null;

    return (
      (!monthFilter || (isSameMonth(payment.dueDate, monthFilter) && isSameYear(payment.dueDate, monthFilter))) &&
      (!filters.checkNumber || payment.checkNumber.toLowerCase().includes(filters.checkNumber.toLowerCase())) &&
      (selectedBanks.length === 0 || selectedBanks.includes(payment.bank)) &&
      (selectedCompanies.length === 0 || selectedCompanies.includes(payment.company)) &&
      (selectedBusinessGroups.length === 0 || selectedBusinessGroups.includes(payment.businessGroup)) &&
      (!filters.description || payment.description.toLowerCase().includes(filters.description.toLowerCase())) &&
      (!filters.amount || payment.amount.toString().includes(filters.amount)) &&
      (!filters.status || payment.status === filters.status)
    );
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidPaymentsCount = payments.filter(p => p.status === 'paid').length;

  const uniqueCompanies = Array.from(new Set(payments.map(p => p.company))).sort();
  const uniqueBusinessGroups = Array.from(new Set(payments.map(p => p.businessGroup))).sort();
  const uniqueBanks = Array.from(new Set(payments.map(p => p.bank))).sort();

  const renderCell = (payment: Payment, field: string) => {
    switch (field) {
      case 'dueDate':
        return format(payment.dueDate, 'dd.MM.yyyy');
      case 'amount':
        return payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
      case 'status':
        return (
          <button
            onClick={() => handleStatusClick(payment)}
            onContextMenu={(e) => handleContextMenu(e, payment, field)}
            className={`text-xs font-medium ${getStatusColor(payment.status)}`}
          >
            {getStatusText(payment.status)}
          </button>
        );
      default:
        return String(payment[field as keyof Payment]);
    }
  };

  return (
    <>
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-9 gap-4 flex-1">
            <div>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md"
                placeholder="Ay Seçin"
              />
            </div>
            <div>
              <input
                type="text"
                value={filters.checkNumber}
                onChange={(e) => handleFilterChange('checkNumber', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md"
                placeholder="Çek No"
              />
            </div>
            <div ref={bankFilterRef} className="relative">
              <input
                type="text"
                value={selectedBanks.join(', ')}
                readOnly
                onClick={() => setShowBankFilter(true)}
                className="w-full px-2 py-1 text-sm border rounded-md cursor-pointer bg-white"
                placeholder="Banka"
              />
              <FilterPopup
                isOpen={showBankFilter}
                onClose={() => setShowBankFilter(false)}
                items={uniqueBanks}
                selectedItems={selectedBanks}
                onItemSelect={toggleBankFilter}
                title="Banka Filtresi"
              />
            </div>
            <div ref={companyFilterRef} className="relative">
              <input
                type="text"
                value={selectedCompanies.join(', ')}
                readOnly
                onClick={() => setShowCompanyFilter(true)}
                className="w-full px-2 py-1 text-sm border rounded-md cursor-pointer bg-white"
                placeholder="Firma"
              />
              <FilterPopup
                isOpen={showCompanyFilter}
                onClose={() => setShowCompanyFilter(false)}
                items={uniqueCompanies}
                selectedItems={selectedCompanies}
                onItemSelect={toggleCompanyFilter}
                title="Firma Filtresi"
              />
            </div>
            <div ref={businessGroupFilterRef} className="relative">
              <input
                type="text"
                value={selectedBusinessGroups.join(', ')}
                readOnly
                onClick={() => setShowBusinessGroupFilter(true)}
                className="w-full px-2 py-1 text-sm border rounded-md cursor-pointer bg-white"
                placeholder="İş Grubu"
              />
              <FilterPopup
                isOpen={showBusinessGroupFilter}
                onClose={() => setShowBusinessGroupFilter(false)}
                items={uniqueBusinessGroups}
                selectedItems={selectedBusinessGroups}
                onItemSelect={toggleBusinessGroupFilter}
                title="İş Grubu Filtresi"
              />
            </div>
            <div>
              <input
                type="text"
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md"
                placeholder="Açıklama"
              />
            </div>
            <div>
              <input
                type="text"
                value={filters.amount}
                onChange={(e) => handleFilterChange('amount', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md"
                placeholder="Tutar"
              />
            </div>
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md"
              >
                <option value="">Tümü</option>
                <option value="pending">Ödenmedi</option>
                <option value="paid">Ödendi</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div>
              <PrintOptions payments={filteredPayments} />
            </div>
          </div>
        </div>

        <div className="px-6 py-2 bg-gray-50 border-b flex justify-between items-center">
          <button
            onClick={() => setShowPaidPayments(!showPaidPayments)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>
              {showPaidPayments ? 'Ödenen Çekleri Gizle' : `Tüm Çekleri Göster (${paidPaymentsCount})`}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto payment-table-container">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vade Tarihi</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Çek No</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banka</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İş Grubu</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className={`hover:bg-gray-100 transition-colors duration-150 ${
                    payment.status === 'paid' ? 'bg-red-200' : 
                    payment.status === 'other' ? 'bg-blue-200' : ''
                  }`}
                >
                  {['dueDate', 'checkNumber', 'bank', 'company', 'businessGroup', 'description', 'amount', 'status'].map((field) => (
                    <td
                      key={field}
                      className="px-6 py-1.5 whitespace-nowrap text-sm text-gray-900"
                    >
                      {renderCell(payment, field)}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-1.5 text-center text-sm text-gray-500">
                    Henüz ödeme kaydı bulunmamaktadır
                  </td>
                </tr>
              ) : (
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={6} className="px-6 py-2 text-right text-sm text-gray-900">
                    Toplam:
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContextMenu
        position={contextMenu?.position ?? null}
        onClose={() => setContextMenu(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setPaymentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Ödeme Kaydını Sil"
        message={
          <div>
            <p>Bu ödeme kaydını silmek istediğinizden emin misiniz?</p>
            {paymentToDelete && (
              <div className="mt-2 text-sm text-gray-500">
                <p>Çek No: {paymentToDelete.checkNumber}</p>
                <p>Tutar: {paymentToDelete.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              </div>
            )}
          </div>
        }
      />
    </>
  );
}