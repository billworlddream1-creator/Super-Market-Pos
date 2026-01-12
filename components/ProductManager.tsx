
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Sparkles, Trash2, Edit2, Save, X, Search, ScanBarcode, Camera, AlertTriangle, History, TrendingUp, Check, ChevronDown, Image as ImageIcon, Upload, PackageCheck, Tag, Percent } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import { generateProducts } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  lowStockThreshold: number;
  setLowStockThreshold: (val: number) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ 
  products, 
  setProducts, 
  lowStockThreshold, 
  setLowStockThreshold 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingHistory, setViewingHistory] = useState<Product | null>(null);
  const [aiCategory, setAiCategory] = useState(CATEGORIES[0]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'searching' | 'locked'>('idle');

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: CATEGORIES[0],
    price: 0,
    salePrice: undefined,
    quantityDiscountThreshold: undefined,
    quantityDiscountPercentage: undefined,
    stock: 0,
    description: '',
    barcode: '',
    imageUrl: ''
  });

  const handleGenerate = async (specificCategory?: string) => {
    setIsGenerating(true);
    try {
      const category = specificCategory || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const generatedItems = await generateProducts(category, 3);
      
      const productsToAdd: Product[] = generatedItems.map(item => ({
        id: uuidv4(),
        name: item.name || 'Unknown',
        category: item.category || category,
        price: item.price || 0,
        stock: item.stock || 0,
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        isAiGenerated: true,
        barcode: Math.floor(Math.random() * 1000000000000).toString()
      }));

      setProducts(prev => [...prev, ...productsToAdd]);
    } catch (err) {
      alert("Failed to generate products.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchRefill = () => {
    const lowStockItems = products.filter(p => p.stock <= lowStockThreshold);
    if (lowStockItems.length === 0) {
      alert("No products currently below the stock threshold.");
      return;
    }

    const refillValue = prompt(`Refill all ${lowStockItems.length} low-stock items. Enter the new stock count:`, "50");
    if (refillValue === null) return;

    const newStock = parseInt(refillValue);
    if (isNaN(newStock)) {
      alert("Please enter a valid number.");
      return;
    }

    setProducts(prev => prev.map(p => 
      p.stock <= lowStockThreshold ? { ...p, stock: newStock } : p
    ));
  };

  const handleAddManual = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product: Product = {
      id: uuidv4(),
      name: newProduct.name,
      category: newProduct.category || 'General',
      price: Number(newProduct.price),
      salePrice: newProduct.salePrice ? Number(newProduct.salePrice) : undefined,
      quantityDiscountThreshold: newProduct.quantityDiscountThreshold ? Number(newProduct.quantityDiscountThreshold) : undefined,
      quantityDiscountPercentage: newProduct.quantityDiscountPercentage ? Number(newProduct.quantityDiscountPercentage) : undefined,
      stock: Number(newProduct.stock),
      description: newProduct.description || '',
      imageUrl: newProduct.imageUrl || '',
      barcode: newProduct.barcode || '',
      isAiGenerated: false
    };
    setProducts(prev => [...prev, product]);
    setIsAdding(false);
    setNewProduct({ name: '', category: CATEGORIES[0], price: 0, salePrice: undefined, quantityDiscountThreshold: undefined, quantityDiscountPercentage: undefined, stock: 0, description: '', barcode: '', imageUrl: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSaveEdit = (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isNew) {
          setNewProduct(prev => ({ ...prev, imageUrl: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    setCameraActive(true);
    setScanStatus('searching');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setCameraActive(false);
      setScanStatus('idle');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
    setScanStatus('idle');
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cameraActive) {
      interval = setInterval(() => {
        if (scanStatus === 'searching' && Math.random() > 0.8) {
          setScanStatus('locked');
          setTimeout(() => {
            const mockBarcode = Math.floor(Math.random() * 1000000000000).toString();
            setSearchTerm(mockBarcode);
            if (isAdding) {
              setNewProduct(prev => ({ ...prev, barcode: mockBarcode }));
            }
            stopScanner();
          }, 800);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cameraActive, isAdding, scanStatus]);

  const filteredProducts = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    const exactBarcodeMatch = products.find(p => p.barcode === searchTerm);
    
    if (exactBarcodeMatch) {
      return [exactBarcodeMatch];
    }
    
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term))
    );
  }, [products, searchTerm]);

  const getPriceHistory = (basePrice: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(m => ({
      month: m,
      price: basePrice + (Math.random() * 2 - 1)
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inventory Management</h2>
          <div className="flex items-center space-x-2 mt-1">
             <span className="text-gray-500 text-sm">Low stock threshold:</span>
             <input 
               type="number" 
               className="w-16 px-2 py-0.5 border rounded text-sm font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
               value={lowStockThreshold}
               onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
             />
             <button 
                onClick={handleBatchRefill}
                className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-xs font-bold"
             >
                <PackageCheck size={14} />
                <span>Refill Low Stock</span>
             </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button 
            onClick={startScanner}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm transition-colors"
          >
            <ScanBarcode size={18} />
            <span>Scan Barcode</span>
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Add Manually</span>
          </button>

          <div className="flex items-center bg-white border border-indigo-200 p-1 rounded-xl shadow-sm">
            <div className="relative">
              <select 
                className="bg-transparent text-xs font-bold text-indigo-700 outline-none px-3 pr-8 py-2 appearance-none cursor-pointer"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
            </div>
            <button 
              onClick={() => handleGenerate(aiCategory)}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors disabled:opacity-70 text-xs font-bold"
            >
              <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
              <span>{isGenerating ? 'Gen...' : 'Gen by Category'}</span>
            </button>
          </div>

          <button 
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-70 font-bold"
          >
            <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} />
            <span>{isGenerating ? 'Dreaming...' : 'Quick AI Gen'}</span>
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-md w-full relative shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ScanBarcode className="text-blue-400" size={20}/>
                <h3 className="font-bold">Advanced Scanner</h3>
              </div>
              <button onClick={stopScanner} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                <X size={24}/>
              </button>
            </div>
            
            <div className="aspect-square bg-black relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`w-64 h-64 border-2 rounded-2xl transition-all duration-300 ${
                  scanStatus === 'locked' ? 'border-green-500 bg-green-500/10' : 'border-blue-500/50'
                }`}>
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  <div className={`absolute left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] transition-all duration-100 ${
                    scanStatus === 'locked' ? 'hidden' : 'animate-[scan_2s_ease-in-out_infinite]'
                  }`} style={{ top: '10%' }}></div>
                  {scanStatus === 'locked' && (
                    <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                      <Check className="text-green-500" size={64} />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  scanStatus === 'locked' ? 'bg-green-500 text-white' : 'bg-blue-600/80 text-white animate-pulse'
                }`}>
                  {scanStatus === 'locked' ? 'Barcode Locked' : 'Searching for Barcode...'}
                </span>
              </div>
            </div>
            <div className="p-6 bg-slate-900 border-t border-slate-700">
              <p className="text-slate-400 text-sm text-center mb-4">Position the barcode within the blue frame to scan.</p>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Or enter manually..." 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.value.length >= 8) {
                      setSearchTerm(e.target.value);
                      stopScanner();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{viewingHistory.name}</h3>
                <p className="text-sm text-slate-500">Price Trend (Last 6 Months)</p>
              </div>
              <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={24}/>
              </button>
            </div>
            <div className="p-8">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getPriceHistory(viewingHistory.price)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => `$${val.toFixed(2)}`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(val: number) => [`$${val.toFixed(2)}`, 'Price']} />
                    <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="text-indigo-600" size={20}/>
            Add New Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
              <input type="text" placeholder="Product Name *" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
              <select className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Regular Price ($)</label>
              <input type="number" placeholder="Price *" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Sale Price ($)</label>
              <input type="number" placeholder="Optional Sale Price" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.salePrice || ''} onChange={e => setNewProduct({...newProduct, salePrice: parseFloat(e.target.value) || undefined})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Discount Qty Threshold</label>
              <input type="number" placeholder="Min. quantity" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.quantityDiscountThreshold || ''} onChange={e => setNewProduct({...newProduct, quantityDiscountThreshold: parseInt(e.target.value) || undefined})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Discount (%)</label>
              <input type="number" placeholder="Percentage off" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.quantityDiscountPercentage || ''} onChange={e => setNewProduct({...newProduct, quantityDiscountPercentage: parseInt(e.target.value) || undefined})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
              <input type="number" placeholder="Stock" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Image URL or Upload</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://example.com/image.jpg" 
                  className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newProduct.imageUrl} 
                  onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} 
                />
                <button 
                  onClick={() => document.getElementById('new-product-image-upload')?.click()}
                  className="p-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Upload size={18} />
                </button>
                <input 
                  type="file" 
                  id="new-product-image-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
            <button onClick={handleAddManual} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all font-semibold">Save Product</button>
          </div>
        </div>
      )}

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search products by name, category or scan barcode..." 
          className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider">Product Info</th>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider">Category</th>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider">Price/Sale</th>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider">Discount</th>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider">Stock</th>
              <th className="px-6 py-5 font-bold text-slate-700 text-sm uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(product => (
              <EditableRow 
                key={product.id} 
                product={product} 
                isEditing={editingId === product.id}
                lowStockThreshold={lowStockThreshold}
                onEdit={() => setEditingId(product.id)}
                onCancel={() => setEditingId(null)}
                onSave={(updated) => handleSaveEdit(product.id, updated)}
                onDelete={() => handleDelete(product.id)}
                onViewHistory={() => setViewingHistory(product)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EditableRow: React.FC<{
  product: Product;
  isEditing: boolean;
  lowStockThreshold: number;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (p: Partial<Product>) => void;
  onDelete: () => void;
  onViewHistory: () => void;
}> = ({ product, isEditing, lowStockThreshold, onEdit, onCancel, onSave, onDelete, onViewHistory }) => {
  const [edited, setEdited] = useState(product);
  const isLowStock = product.stock <= lowStockThreshold;

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEdited(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/50">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center border border-slate-300">
                {edited.imageUrl ? (
                  <img src={edited.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-slate-400" />
                )}
                <button 
                  onClick={() => document.getElementById(`edit-upload-${product.id}`)?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <Upload size={14} />
                </button>
                <input 
                  type="file" 
                  id={`edit-upload-${product.id}`} 
                  className="hidden" 
                  onChange={handleEditImageUpload}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" value={edited.name} onChange={e => setEdited({...edited, name: e.target.value})} placeholder="Name" />
              <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[10px] font-mono" value={edited.imageUrl || ''} onChange={e => setEdited({...edited, imageUrl: e.target.value})} placeholder="Image URL" />
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <select className="p-2 border rounded-lg w-full text-sm" value={edited.category} onChange={e => setEdited({...edited, category: e.target.value})}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td className="px-6 py-4 space-y-1">
          <input type="number" step="0.01" className="w-24 p-2 border rounded-lg text-sm font-mono" value={edited.price} onChange={e => setEdited({...edited, price: parseFloat(e.target.value)})} placeholder="Price" />
          <input type="number" step="0.01" className="w-24 p-2 border rounded-lg text-sm font-mono" value={edited.salePrice || ''} onChange={e => setEdited({...edited, salePrice: parseFloat(e.target.value) || undefined})} placeholder="Sale" />
        </td>
        <td className="px-6 py-4 space-y-1">
          <input type="number" className="w-24 p-2 border rounded-lg text-xs" value={edited.quantityDiscountThreshold || ''} onChange={e => setEdited({...edited, quantityDiscountThreshold: parseInt(e.target.value) || undefined})} placeholder="Min Qty" />
          <input type="number" className="w-24 p-2 border rounded-lg text-xs" value={edited.quantityDiscountPercentage || ''} onChange={e => setEdited({...edited, quantityDiscountPercentage: parseInt(e.target.value) || undefined})} placeholder="Disc. %" />
        </td>
        <td className="px-6 py-4"><input type="number" className="w-24 p-2 border rounded-lg text-sm font-mono" value={edited.stock} onChange={e => setEdited({...edited, stock: parseInt(e.target.value)})} /></td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            <button onClick={() => onSave(edited)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Save size={18} /></button>
            <button onClick={onCancel} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"><X size={18} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-slate-50 transition-colors group ${isLowStock ? 'bg-red-50/30' : ''}`}>
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={24} className="text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-lg leading-tight truncate">{product.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">{product.barcode || 'NO BARCODE'}</span>
              {product.isAiGenerated && <span className="text-[8px] bg-indigo-50 text-indigo-600 font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">AI Gen</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-6">
        <div className="flex flex-col">
          <span className={`font-mono font-bold text-lg ${product.salePrice ? 'text-gray-400 line-through text-sm' : 'text-slate-800'}`}>
            ${product.price.toFixed(2)}
          </span>
          {product.salePrice && (
            <span className="font-mono font-black text-red-600 text-lg">
              ${product.salePrice.toFixed(2)}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-6">
        {product.quantityDiscountThreshold ? (
          <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
            {product.quantityDiscountPercentage}% OFF for {product.quantityDiscountThreshold}+
          </div>
        ) : (
          <span className="text-slate-300 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-6 font-bold text-lg text-slate-800">
        <div className="flex items-center gap-2">
          {product.stock}
          {isLowStock && <AlertTriangle size={16} className="text-amber-500 animate-pulse" />}
        </div>
      </td>
      <td className="px-6 py-6 text-right opacity-0 group-hover:opacity-100 transition-all">
        <div className="flex justify-end gap-1">
          <button onClick={onViewHistory} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Price History"><History size={18} /></button>
          <button onClick={onEdit} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
        </div>
      </td>
    </tr>
  );
};

export default ProductManager;
