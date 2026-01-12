
import React, { useState, useEffect } from 'react';
import { Product, CartItem, Receipt, ReceiptItem, PaymentMethodConfig, PaymentStatus } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, CheckCircle, ScanBarcode, Printer, Clock, AlertCircle, MapPin, Phone, User, Tag, Percent } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface POSProps {
  products: Product[];
  onCompleteSale: (receipt: Receipt) => void;
  paymentMethods: PaymentMethodConfig[];
}

const POS: React.FC<POSProps> = ({ products, onCompleteSale, paymentMethods }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState<Receipt | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    const exactBarcodeMatch = products.find(p => p.barcode === searchTerm);
    
    if (exactBarcodeMatch && searchTerm.length >= 8) {
      return [exactBarcodeMatch];
    }

    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(term) || 
        (p.barcode && p.barcode.toLowerCase().includes(term));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getItemEffectivePrice = (item: CartItem) => {
    let price = item.salePrice || item.price;
    if (item.quantityDiscountThreshold && item.quantity >= item.quantityDiscountThreshold && item.quantityDiscountPercentage) {
      price = price * (1 - item.quantityDiscountPercentage / 100);
    }
    return price;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactMatch = products.find(p => p.barcode === searchTerm);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        return;
      }
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      }
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (getItemEffectivePrice(item) * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = (methodLabel: string, status: PaymentStatus = 'PAID') => {
    if (cart.length === 0) return;

    const receiptItems: ReceiptItem[] = cart.map(item => {
      const effPrice = getItemEffectivePrice(item);
      const isDiscounted = (item.quantityDiscountThreshold && item.quantity >= item.quantityDiscountThreshold);
      return {
        productId: item.id,
        name: item.name,
        priceAtSale: effPrice,
        quantity: item.quantity,
        total: effPrice * item.quantity,
        discountApplied: isDiscounted ? item.quantityDiscountPercentage : undefined
      };
    });

    const newReceipt: Receipt = {
      id: `REF-${uuidv4().split('-')[0].toUpperCase()}`,
      timestamp: Date.now(),
      items: receiptItems,
      totalAmount: cartTotal,
      customerName: customerName || 'Walk-in Customer',
      customerLocation: customerLocation,
      customerPhone: customerPhone,
      paymentMethod: methodLabel,
      status: status
    };

    onCompleteSale(newReceipt);
    setShowReceiptModal(newReceipt);
    setCart([]);
    setCustomerName('');
    setCustomerLocation('');
    setCustomerPhone('');
  };

  const enabledMethods = paymentMethods.filter(m => m.enabled);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 print:hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white p-4 border-b flex space-x-4 items-center shadow-sm z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="Scan barcode for exact match or search name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar max-w-md">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <Search size={48} className="opacity-20" />
                <p>No products found matching your search</p>
             </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col h-full group relative"
              >
                {product.salePrice && (
                  <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                    SALE
                  </div>
                )}
                <div className="h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 transition-colors relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold opacity-30 z-10">{product.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                <div className="mt-auto pt-3 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className={`font-bold ${product.salePrice ? 'text-red-600' : 'text-indigo-600'}`}>
                      ${(product.salePrice || product.price).toFixed(2)}
                    </span>
                    {product.salePrice && <span className="text-[10px] text-gray-400 line-through">${product.price.toFixed(2)}</span>}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l shadow-xl flex flex-col z-20">
        <div className="p-5 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ShoppingCart className="mr-2 text-indigo-600" size={24} /> Current Order
          </h2>
          <div className="mt-3 space-y-2">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" placeholder="Customer Name" 
                className="w-full pl-9 p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-indigo-500"
                value={customerName} onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" placeholder="Location (Required for Credit)" 
                className="w-full pl-9 p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-indigo-500"
                value={customerLocation} onChange={e => setCustomerLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50">
              <ShoppingCart size={48} />
              <p>Empty Cart</p>
            </div>
          )}
          {cart.map(item => {
            const effectiveUnitPrice = getItemEffectivePrice(item);
            const isDiscounted = (item.quantityDiscountThreshold && item.quantity >= item.quantityDiscountThreshold);
            return (
              <div key={item.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDiscounted ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                        ${effectiveUnitPrice.toFixed(2)} / unit
                      </span>
                      {isDiscounted && <Percent size={10} className="text-green-600" />}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                {item.quantityDiscountThreshold && !isDiscounted && (
                  <p className="text-[10px] text-indigo-500 font-bold italic">
                    Buy {item.quantityDiscountThreshold - item.quantity} more for {item.quantityDiscountPercentage}% off!
                  </p>
                )}
                <div className="text-right font-black text-slate-800">
                  ${(effectiveUnitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t bg-gray-50 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-gray-500">Items ({cartItemCount})</span>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Bill</p>
              <p className="text-3xl font-bold text-gray-900">${cartTotal.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Payment Method</p>
            <div className={`grid gap-2 ${enabledMethods.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {enabledMethods.map(method => (
                <button 
                  key={method.id}
                  onClick={() => handleCheckout(method.label, 'PAID')} 
                  disabled={cart.length === 0} 
                  className={`flex flex-col items-center p-3 rounded-xl transition disabled:opacity-50 border shadow-sm ${
                    method.type === 'CASH' ? 'bg-white text-green-700 border-green-100 hover:bg-green-50' :
                    method.type === 'CARD' ? 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50' :
                    'bg-white text-purple-700 border-purple-100 hover:bg-purple-50'
                  }`}
                >
                  {method.type === 'CASH' && <Banknote size={20} />}
                  {method.type === 'CARD' && <CreditCard size={20} />}
                  {method.type === 'DIGITAL' && <Smartphone size={20} />}
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{method.label}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => handleCheckout('Deferred Payment', 'PENDING')}
              disabled={cart.length === 0 || !customerName || !customerLocation}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <Clock size={18} />
              <span>Settle as Credit (Unpaid)</span>
            </button>
          </div>
        </div>
      </div>

      {showReceiptModal && (
        <ReceiptModal 
          receipt={showReceiptModal} 
          onClose={() => setShowReceiptModal(null)} 
        />
      )}
    </div>
  );
};

const ReceiptModal = ({ receipt, onClose }: { receipt: Receipt, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-full print:w-full">
        <div className={`${receipt.status === 'PAID' ? 'bg-green-600' : 'bg-amber-600'} p-4 text-center text-white print:hidden`}>
          {receipt.status === 'PAID' ? <CheckCircle className="mx-auto mb-2" size={40} /> : <Clock className="mx-auto mb-2" size={40} />}
          <h3 className="text-xl font-bold">{receipt.status === 'PAID' ? 'Payment Confirmed' : 'Transaction Logged (Credit)'}</h3>
        </div>
        <div className="p-8 overflow-y-auto flex-1 font-mono text-sm leading-relaxed">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight">SuperMart AI POS</h2>
            <p className="text-gray-400 text-[10px] mt-1 italic font-bold">Official Invoice</p>
            <p className="text-gray-500 text-xs mt-4">Order ID: <span className="text-gray-900 font-bold">{receipt.id}</span></p>
            <p className="text-gray-500 text-xs">{new Date(receipt.timestamp).toLocaleString()}</p>
          </div>
          
          <div className="border-b border-dashed border-gray-200 mb-4 pb-2">
             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Description</span>
                <span>Amount</span>
             </div>
          </div>

          <div className="space-y-3 mb-6">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <span className="flex-1">
                   {item.quantity}x {item.name}
                   <p className="text-[10px] text-gray-400">@ ${item.priceAtSale.toFixed(2)} {item.discountApplied ? `(${item.discountApplied}% OFF)` : ''}</p>
                </span>
                <span className="font-bold">${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between font-black text-xl">
              <span>TOTAL</span>
              <span>${receipt.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1 text-gray-600 text-xs pt-2">
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-bold">{receipt.customerName}</span>
              </div>
              {receipt.customerLocation && (
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-bold truncate max-w-[150px]">{receipt.customerLocation}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-gray-600 text-xs items-center mt-2">
              <span>Method</span>
              <span className="font-bold">{receipt.paymentMethod}</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200 text-center opacity-50">
             <p className="text-[10px]">Thank you for shopping with us!</p>
             <p className="text-[9px] mt-1 font-bold">Visit supermart.ai for more offers</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex flex-col gap-2 print:hidden">
          <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"><Printer size={18} /> Print Voucher</button>
          <button onClick={onClose} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Start Next Sale</button>
        </div>
      </div>
    </div>
  );
};

export default POS;
