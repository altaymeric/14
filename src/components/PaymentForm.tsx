import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Payment } from '../types/payment';
import ConfirmationDialog from './ConfirmationDialog';

interface Category {
  id: string;
  name: string;
  items: string[];
}

const paymentSchema = z.object({
  dueDate: z.string().min(1, 'Vade tarihi zorunludur'),
  checkNumber: z.string().min(1, 'Çek numarası zorunludur'),
  bank: z.string().min(1, 'Banka adı zorunludur'),
  company: z.string().min(1, 'Firma adı zorunludur'),
  businessGroup: z.string().min(1, 'İş grubu zorunludur'),
  description: z.string(),
  amount: z.string().min(1, 'Tutar zorunludur')
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSubmit: (payment: Omit<Payment, 'id' | 'status'>) => void;
  initialData?: Payment | null;
  categories: Category[];
}

export default function PaymentForm({ onSubmit, initialData, categories }: PaymentFormProps) {
  const [displayAmount, setDisplayAmount] = useState(
    initialData ? initialData.amount.toLocaleString('tr-TR') : ''
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentToSave, setPaymentToSave] = useState<Omit<Payment, 'id' | 'status'> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData ? {
      dueDate: format(initialData.dueDate, 'yyyy-MM-dd'),
      checkNumber: initialData.checkNumber,
      bank: initialData.bank,
      company: initialData.company,
      businessGroup: initialData.businessGroup,
      description: initialData.description,
      amount: initialData.amount.toString()
    } : undefined
  });

  const handleFormSubmit = (data: PaymentFormData) => {
    const numericAmount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    const payment = {
      dueDate: new Date(data.dueDate),
      checkNumber: data.checkNumber,
      bank: data.bank,
      company: data.company,
      businessGroup: data.businessGroup,
      description: data.description,
      amount: numericAmount
    };
    setPaymentToSave(payment);
    setShowConfirmation(true);
  };

  const confirmSave = () => {
    if (paymentToSave) {
      onSubmit(paymentToSave);
      reset();
      setDisplayAmount('');
      setShowConfirmation(false);
      setPaymentToSave(null);
    }
  };

  const handleDueDateClick = () => {
    setValue('dueDate', format(new Date(), 'yyyy-MM-dd'));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setDisplayAmount('');
      setValue('amount', '');
      return;
    }

    const numericValue = parseInt(value, 10);
    const formattedValue = numericValue.toLocaleString('tr-TR');
    setDisplayAmount(formattedValue);
    setValue('amount', numericValue.toString());
  };

  const formData = watch();

  const inputClassName = "mt-2 block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out hover:bg-white";
  const selectClassName = "mt-2 block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out hover:bg-white";
  const labelClassName = "block text-sm font-medium text-gray-700";
  const errorClassName = "mt-1 text-sm text-red-600";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 pb-4 border-b">Ödeme Girişi</h2>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelClassName}>Vade Tarihi</label>
            <input
              type="date"
              {...register('dueDate')}
              onClick={handleDueDateClick}
              className={inputClassName}
            />
            {errors.dueDate && <p className={errorClassName}>{errors.dueDate.message}</p>}
          </div>

          <div>
            <label className={labelClassName}>Çek No</label>
            <input
              type="text"
              {...register('checkNumber')}
              className={inputClassName}
              placeholder="Çek numarasını girin"
            />
            {errors.checkNumber && <p className={errorClassName}>{errors.checkNumber.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClassName}>Banka</label>
          <select
            {...register('bank')}
            className={selectClassName}
          >
            <option value="">Banka Seçiniz</option>
            {categories.find(c => c.id === 'bank')?.items.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          {errors.bank && <p className={errorClassName}>{errors.bank.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>Firma</label>
          <select
            {...register('company')}
            className={selectClassName}
          >
            <option value="">Firma Seçiniz</option>
            {categories.find(c => c.id === 'company')?.items.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
          {errors.company && <p className={errorClassName}>{errors.company.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>İş Grubu</label>
          <select
            {...register('businessGroup')}
            className={selectClassName}
          >
            <option value="">İş Grubu Seçiniz</option>
            {categories.find(c => c.id === 'businessGroup')?.items.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          {errors.businessGroup && <p className={errorClassName}>{errors.businessGroup.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>Açıklama</label>
          <textarea
            {...register('description')}
            className={`${inputClassName} min-h-[100px] resize-none`}
            placeholder="Açıklama girin (opsiyonel)"
          />
          {errors.description && <p className={errorClassName}>{errors.description.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>Tutar</label>
          <div className="relative">
            <input
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              className={inputClassName}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">TL</span>
          </div>
          {errors.amount && <p className={errorClassName}>{errors.amount.message}</p>}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition duration-150 ease-in-out"
          >
            Kaydet
          </button>
        </div>
      </form>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmSave}
        title="Ödeme Kaydı Onayı"
        message={
          <div>
            <p>Bu ödeme kaydını kaydetmek istediğinizden emin misiniz?</p>
            {paymentToSave && (
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Çek No:</span> {formData.checkNumber}</p>
                <p><span className="font-medium">Vade Tarihi:</span> {format(new Date(formData.dueDate), 'dd.MM.yyyy')}</p>
                <p><span className="font-medium">Banka:</span> {formData.bank}</p>
                <p><span className="font-medium">Firma:</span> {formData.company}</p>
                <p><span className="font-medium">İş Grubu:</span> {formData.businessGroup}</p>
                <p><span className="font-medium">Tutar:</span> {displayAmount} TL</p>
                {formData.description && (
                  <p><span className="font-medium">Açıklama:</span> {formData.description}</p>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}