import React from 'react';
import { format, isThisMonth } from 'date-fns';
import { Payment } from '../types/payment';

interface PaymentSummaryProps {
  payments: Payment[];
}

interface BankTotal {
  bank: string;
  amount: number;
}

export default function PaymentSummary({ payments }: PaymentSummaryProps) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const otherAmount = payments
    .filter(payment => payment.status === 'other')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = totalAmount - paidAmount - otherAmount;
  
  // Calculate current month totals
  const currentMonthPayments = payments.filter(payment => isThisMonth(payment.dueDate));
  const currentMonthTotal = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const currentMonthPaid = currentMonthPayments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const currentMonthRemaining = currentMonthTotal - currentMonthPaid;

  // Calculate and sort bank totals for all payments
  const allBankTotals = Object.entries(payments.reduce((acc, payment) => {
    acc[payment.bank] = (acc[payment.bank] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>))
    .map(([bank, amount]): BankTotal => ({ bank, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate and sort bank totals for paid payments
  const paidBankTotals = Object.entries(payments
    .filter(payment => payment.status === 'paid')
    .reduce((acc, payment) => {
      acc[payment.bank] = (acc[payment.bank] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>))
    .map(([bank, amount]): BankTotal => ({ bank, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate and sort bank totals for remaining payments
  const remainingBankTotals = Object.entries(payments
    .filter(payment => payment.status === 'pending')
    .reduce((acc, payment) => {
      acc[payment.bank] = (acc[payment.bank] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>))
    .map(([bank, amount]): BankTotal => ({ bank, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate and sort bank totals for current month
  const currentMonthBankTotals = Object.entries(currentMonthPayments
    .reduce((acc, payment) => {
      acc[payment.bank] = (acc[payment.bank] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>))
    .map(([bank, amount]): BankTotal => ({ bank, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Toplam Tutar</h3>
        </div>
        <p className="text-2xl font-bold text-blue-600 mb-3">
          {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
        <div className="border-t pt-2 space-y-1">
          {allBankTotals.map(({ bank, amount }) => (
            <div key={bank} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{bank}:</span>
              <span className="font-medium text-blue-600">
                {amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Ödenen</h3>
        <p className="text-2xl font-bold text-green-600 mb-3">
          {paidAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
        <div className="border-t pt-2 space-y-1">
          {paidBankTotals.map(({ bank, amount }) => (
            <div key={bank} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{bank}:</span>
              <span className="font-medium text-green-600">
                {amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Kalan</h3>
        <p className="text-2xl font-bold text-red-600 mb-3">
          {remainingAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
        <div className="border-t pt-2 space-y-1">
          {remainingBankTotals.map(({ bank, amount }) => (
            <div key={bank} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{bank}:</span>
              <span className="font-medium text-red-600">
                {amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bu Ay Toplam</h3>
        <p className="text-2xl font-bold text-purple-600 mb-3">
          {currentMonthTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
        
        <div className="mb-3 space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Ödenen:</span>
            <span className="font-medium text-green-600">
              {currentMonthPaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Kalan:</span>
            <span className="font-medium text-red-600">
              {currentMonthRemaining.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          </div>
        </div>

        <div className="border-t pt-2 space-y-1">
          {currentMonthBankTotals.map(({ bank, amount }) => (
            <div key={bank} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{bank}:</span>
              <span className="font-medium text-purple-600">
                {amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}