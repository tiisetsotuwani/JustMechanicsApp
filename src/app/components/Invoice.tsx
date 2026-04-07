import { ArrowLeft, Printer } from 'lucide-react';
import type { Invoice as InvoiceType } from '../../shared/types';

interface InvoiceProps {
  invoice: InvoiceType | null;
  onBack: () => void;
}

export function Invoice({ invoice, onBack }: InvoiceProps) {
  if (!invoice) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-gray-600 mb-4">No invoice available</p>
          <button onClick={onBack} className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Invoice</h1>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="space-y-3">
            {invoice.lineItems.map((item, index) => (
              <div key={`${item.description}-${index}`} className="flex justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-sm text-gray-600">
                    Qty {item.quantity} • Labor {item.laborCost} • Parts {item.partsCost}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  R{((item.laborCost + item.partsCost) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Callout fee</span>
              <span>R{invoice.calloutFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee</span>
              <span>R{invoice.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>R{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
