import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-8)}`;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subtotal = order.subtotal || order.items.reduce((acc, it) => acc + (it.product.price * it.quantity), 0);
  const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 0;
  const totalPrice = order.totalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white text-neutral-900 border border-neutral-300 shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Actions Bar (hidden on print) */}
        <div className="print:hidden p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold font-serif">
              Official Invoice
            </span>
            <span className="text-neutral-400 text-xs">• {invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="invoice-sheet" className="p-8 sm:p-12 space-y-8 bg-white relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-neutral-200 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-2xl font-bold tracking-[0.25em] text-neutral-950 uppercase">
                  MAISON LANA
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-serif uppercase tracking-widest">
                Haute Couture • Fine Jewelry • Fragrance
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                12 Place Vendôme, 75001 Paris • Private Client Department<br />
                Email: concierge@maisonlana.luxury • Web: www.maisonlana.luxury
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 font-sans">
              <div className="inline-block px-3 py-1 bg-neutral-100 border border-neutral-300 text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-2">
                {order.paymentStatus || 'Confirmed'}
              </div>
              <h2 className="font-serif text-lg font-bold text-neutral-900 tracking-wider">
                {invoiceNumber}
              </h2>
              <p className="text-xs text-neutral-500">Order ID: <span className="font-mono text-neutral-700">{order.id}</span></p>
              <p className="text-xs text-neutral-500">Date: <span className="font-medium text-neutral-800">{orderDate}</span></p>
              <p className="text-xs text-neutral-500">Payment: <span className="font-medium text-neutral-800">{order.paymentMethod || 'Credit / Bank Transfer'}</span></p>
            </div>
          </div>

          {/* Client & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-2 font-serif">
                Billed & Shipped To
              </span>
              <p className="font-bold text-sm text-neutral-900">{order.customerName}</p>
              {order.customerEmail && <p className="text-neutral-600">{order.customerEmail}</p>}
              <p className="text-neutral-600">{order.customerPhone}</p>
              <p className="text-neutral-600 mt-1">{order.deliveryAddress}</p>
              {(order.city || order.postalCode) && (
                <p className="text-neutral-600">{order.city}{order.postalCode ? `, ${order.postalCode}` : ''}</p>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-2 font-serif">
                Delivery Method
              </span>
              <p className="font-bold text-neutral-900">White-Glove VIP Express Courier</p>
              <p className="text-neutral-600">Tamper-evident luxury wax-sealed presentation box</p>
              {order.giftWrapping && (
                <p className="text-amber-700 font-medium mt-1">✨ Complimentary Maison Gift Wrapping Included</p>
              )}
              {order.notes && (
                <p className="text-neutral-500 italic mt-2 border-t border-neutral-100 pt-1">
                  Dedication: "{order.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white font-serif uppercase tracking-widest text-[10px]">
                  <th className="p-3">Piece Details</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover border border-neutral-200 shrink-0"
                        />
                        <div>
                          <p className="font-serif font-bold text-neutral-900">{item.product.name}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">{item.product.category || 'Maison Selection'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">${item.product.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold">${(item.product.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-neutral-200 pt-6">
            <div className="space-y-2 max-w-sm text-xs text-neutral-500">
              <div className="flex items-center gap-1.5 text-neutral-800 font-bold font-serif text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Authentic by Maison LANA
              </div>
              <p className="text-[11px] leading-relaxed">
                Thank you for acquiring your luxury pieces with Maison LANA. All fine goods are serialized and protected under our 14-day client satisfaction policy.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs font-sans">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>VIP Insured Shipping:</span>
                <span className="font-mono">{shippingFee === 0 ? 'COMPLIMENTARY' : `$${shippingFee}`}</span>
              </div>
              {order.giftWrapping && (
                <div className="flex justify-between text-neutral-600">
                  <span>Wax-Sealed Dedication:</span>
                  <span className="font-mono">FREE</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-950 font-serif font-bold text-base border-t border-neutral-950 pt-2">
                <span>Total Amount:</span>
                <span>${totalPrice.toLocaleString()} USD</span>
              </div>
            </div>
          </div>

          {/* Footer Barcode / Verification */}
          <div className="border-t border-dashed border-neutral-300 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-400 gap-4">
            <div>
              <p className="font-mono tracking-widest uppercase">DOC-ID: {order.id.slice(0, 18)}</p>
              <p>Maison LANA • Paris • London • Dubai • Mogadishu</p>
            </div>
            <div className="font-serif italic text-neutral-600 text-center sm:text-right">
              "L'élégance est la seule beauté qui ne se fane jamais."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
