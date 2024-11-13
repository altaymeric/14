import { parse, isValid, isBefore, startOfDay } from 'date-fns';
import { Payment } from '../../types/payment';

export function processImportedData(data: any[][]): Payment[] {
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
}

export function parseExcelDate(value: any): Date {
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
}