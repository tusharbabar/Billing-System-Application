import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useReactToPrint } from 'react-to-print';
import { 
  Plus, Trash2, Search, UserPlus, IndianRupee, 
  ChevronRight, Save, Printer, ArrowLeft, Leaf,
  Users, ShoppingCart, Package, X, MapPin, Phone,
  CheckCircle2, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function BillingPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchCust, setSearchCust] = useState('');
  const [searchProd, setSearchProd] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  
  const [items, setItems] = useState([]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');

  // New Customer Modal State
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', village: '', address: '' });
  const [savingCust, setSavingCust] = useState(false);

  // Success Modal State
  const [lastBill, setLastBill] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: lastBill ? `Invoice_${lastBill.bill_number}` : 'Invoice',
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      setCustomers(cRes.data.data);
      setProducts(pRes.data.data);
    } catch (e) {
      toast.error('Failed to load data');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name) return toast.error('Name is required');
    setSavingCust(true);
    try {
      const res = await api.post('/customers', newCust);
      toast.success('Customer added!');
      const freshCust = { ...newCust, id: res.data.id };
      setCustomers([...customers, freshCust]);
      setSelectedCust(freshCust);
      setSearchCust(freshCust.name);
      setShowCustModal(false);
      setNewCust({ name: '', phone: '', village: '', address: '' });
    } catch (err) {
      toast.error('Failed to add customer');
    } finally {
      setSavingCust(false);
    }
  };

  const addItem = (product) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      toast.error('Product already in cart');
      return;
    }
    if (product.stock_quantity <= 0) {
      toast.error('Product out of stock');
      return;
    }

    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      hsn_code: product.hsn_code,
      unit: product.unit,
      quantity: 1,
      unit_price: product.selling_price,
      gst_rate: product.gst_rate,
      discount_percent: 0,
      stock: product.stock_quantity
    }]);
  };

  const removeItem = (id) => setItems(items.filter(i => i.product_id !== id));

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.product_id === id) {
        let val = parseFloat(value) || 0;
        if (field === 'quantity' && val > item.stock) {
          toast.error(`Only ${item.stock} available`);
          val = item.stock;
        }
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((acc, item) => {
    const discounted = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
    return acc + discounted;
  }, 0);

  const totalGst = items.reduce((acc, item) => {
    const discounted = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
    return acc + (discounted * (item.gst_rate / 100));
  }, 0);

  const totalAmount = subtotal + totalGst - (parseFloat(totalDiscount) || 0);

  const handleSubmit = async () => {
    if (!selectedCust && !searchCust) return toast.error('Select customer');
    if (items.length === 0) return toast.error('Cart is empty');

    try {
      const actualPaid = parseFloat(amountPaid || 0);
      const payload = {
        customer_id: selectedCust?.id,
        customer_name: selectedCust?.name || searchCust,
        customer_phone: selectedCust?.phone,
        customer_address: selectedCust?.address || selectedCust?.village,
        customer_gstin: selectedCust?.gstin,
        bill_date: new Date(),
        items,
        payment_method: paymentMethod,
        payment_status: actualPaid >= totalAmount ? 'paid' : (actualPaid > 0 ? 'partial' : 'pending'),
        amount_paid: actualPaid,
        total_discount: totalDiscount,
        notes
      };

      const res = await api.post('/bills', payload);
      
      // Fetch the full bill for preview
      const billRes = await api.get(`/bills/${res.data.id}`);
      setLastBill(billRes.data.data);
      setShowSuccessModal(true);

      toast.success(`Bill Generated: ${res.data.bill_number}`);
      setItems([]); setSelectedCust(null); setSearchCust(''); setAmountPaid(''); setTotalDiscount(0);
      setNotes('');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const handleWhatsAppSend = () => {
    if (!lastBill || !lastBill.customer_phone) {
      toast.error('Customer phone number is missing!');
      return;
    }
    
    let phone = lastBill.customer_phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const message = `Hello ${lastBill.customer_name},\n\nThank you for your purchase at *SHRI NIGMANAD KRUSHI SEVA KENDRA*!\n\n*Bill No:* ${lastBill.bill_number}\n*Date:* ${new Date(lastBill.bill_date).toLocaleDateString('en-IN')}\n\n*Total Amount:* ₹${parseFloat(lastBill.total_amount).toFixed(2)}\n*Amount Paid:* ₹${parseFloat(lastBill.amount_paid).toFixed(2)}\n*Remaining Due:* ₹${parseFloat(lastBill.amount_due).toFixed(2)}\n\nThank you for visiting! 🌱`;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('billing.create_new_bill')}</h1>
          <p className="page-subtitle">{t('billing.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            <ArrowLeft size={16} /> {t('billing.reset')}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Save size={16} /> {t('billing.save_bill')}
          </button>
        </div>
      </div>

      <div className="billing-grid">
        <div className="billing-main">
          <div className="card billing-panel" style={{ marginBottom: '24px', position: 'relative', zIndex: 10 }}>
            <div className="flex-between mb-4">
              <h3 className="flex items-center gap-2"><Users size={18} className="text-primary" /> {t('billing.customer_info')}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowCustModal(true)}>
                <UserPlus size={14} /> {t('billing.new_customer')}
              </button>
            </div>
            
            <div className="search-bar">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={t('billing.search_customer')}
                value={selectedCust ? selectedCust.name : searchCust}
                onChange={(e) => { setSearchCust(e.target.value); setSelectedCust(null); }}
              />
              {searchCust && !selectedCust && (
                <div className="search-dropdown card">
                  {customers.filter(c => 
                    c.name.toLowerCase().includes(searchCust.toLowerCase()) || 
                    c.phone?.includes(searchCust)
                  ).slice(0, 5).map(c => (
                    <div key={c.id} className="dropdown-item" onClick={() => { setSelectedCust(c); setSearchCust(c.name); }}>
                      <div className="fw-bold">{c.name}</div>
                      <div className="text-dim" style={{ fontSize: 11 }}>{c.phone} | {c.village}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCust && (
              <div className="selected-customer-details mt-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1"><Phone size={14} /> {selectedCust.phone || 'No phone'}</div>
                  <div className="flex items-center gap-1"><MapPin size={14} /> {selectedCust.village || 'No village'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="card billing-panel" style={{ flex: 1 }}>
            <h3 className="mb-4 flex items-center gap-2"><ShoppingCart size={18} className="text-primary" /> {t('billing.items_in_bill')}</h3>
            <div className="table-container">
              <table className="bill-items-table">
                <thead>
                  <tr>
                    <th>{t('billing.product')}</th>
                    <th style={{ width: 100 }}>{t('billing.qty')}</th>
                    <th style={{ width: 120 }}>{t('billing.rate')}</th>
                    <th style={{ width: 80 }}>{t('billing.gst_percent')}</th>
                    <th style={{ width: 120 }}>{t('billing.total')}</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="empty-row">{t('billing.cart_empty')}</td></tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.product_id}>
                        <td>
                          <div className="fw-bold">{item.product_name}</div>
                          <div className="text-dim" style={{ fontSize: 10 }}>HSN: {item.hsn_code}</div>
                        </td>
                        <td>
                          <input type="number" value={item.quantity} onChange={e => updateItem(item.product_id, 'quantity', e.target.value)} min="1" />
                        </td>
                        <td>
                          <div className="flex items-center gap-1">₹<input type="number" value={item.unit_price} onChange={e => updateItem(item.product_id, 'unit_price', e.target.value)} /></div>
                        </td>
                        <td className="text-center">{item.gst_rate}%</td>
                        <td className="fw-bold">
                          ₹{((item.unit_price * item.quantity * (1 - (item.discount_percent/100))) * (1 + (item.gst_rate/100))).toFixed(2)}
                        </td>
                        <td>
                          <button className="btn-icon text-danger" onClick={() => removeItem(item.product_id)}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="billing-side">
          <div className="card billing-panel">
            <h3 className="mb-4 flex items-center gap-2"><Package size={18} className="text-primary" /> {t('billing.quick_select')}</h3>
            <div className="search-bar mb-3">
              <Search size={16} />
              <input type="text" placeholder={t('billing.search_product')} value={searchProd} onChange={e => setSearchProd(e.target.value)} />
            </div>
            <div className="product-list">
              {products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase())).slice(0, 10).map(p => (
                <div key={p.id} className="product-item" onClick={() => addItem(p)}>
                  <div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-meta">₹{p.selling_price} | Stock: {p.stock_quantity}</div>
                  </div>
                  <Plus size={16} className="text-primary" />
                </div>
              ))}
            </div>
          </div>

          <div className="card bill-summary-card">
            <h3 className="mb-4 text-primary">{t('billing.payment_summary')}</h3>
            <div className="summary-row"><span>{t('billing.subtotal')}</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>{t('billing.gst_amount')}</span><span className="text-success">+ ₹{totalGst.toFixed(2)}</span></div>
            <div className="summary-row">
              <span>{t('billing.extra_discount')}</span>
              <input type="number" value={totalDiscount} onChange={e => setTotalDiscount(e.target.value)} className="summary-input" />
            </div>
            <div className="divider"></div>
            <div className="summary-row total"><span>{t('billing.grand_total')}</span><span>₹{totalAmount.toFixed(2)}</span></div>
            
            <div className="form-group mt-4">
              <label>{t('billing.payment_method')}</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI / Online</option>
                <option value="credit">Credit (Udhar)</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('billing.received_amount')}</label>
              <div className="search-bar">
                <IndianRupee size={14} />
                <input type="number" placeholder={totalAmount.toFixed(2)} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-100 mt-4" onClick={handleSubmit}>
              <Printer size={18} /> {t('billing.generate_bill')}
            </button>
          </div>
        </div>
      </div>

      {/* Success & Print Modal */}
      {showSuccessModal && lastBill && (
        <div className="modal-overlay">
          <div className="modal modal-lg animate-fadeIn">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-success" size={24} />
                <h3 className="modal-title">Bill Generated Successfully</h3>
              </div>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body no-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div ref={componentRef} style={{ padding: '10px' }}>
                <div className="invoice-header">
                  <div className="invoice-company">
                    <h1>SHRI NIGMANAD KRUSHI SEVA KENDRA</h1>
                    <p>At post Nimgoan Tq Shirur Kasar, Dist Beed</p>
                    <p><strong>Owner:</strong> Tushar Babar</p>
                    <p>GSTIN: 27AABCK1234A1Z5</p>
                  </div>
                  <div className="invoice-meta">
                    <div className="bill-no">{lastBill.bill_number}</div>
                    <p>Date: {new Date(lastBill.bill_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex-between mb-6 mt-4">
                  <div>
                    <label className="text-dim text-xs uppercase fw-800">Bill To:</label>
                    <p className="fw-800 text-lg">{lastBill.customer_name}</p>
                    <p className="text-muted">{lastBill.customer_address}</p>
                    <p className="text-muted">{lastBill.customer_phone}</p>
                  </div>
                </div>

              <table className="bill-items-table mb-6">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>GST%</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name} <br/><small className="text-muted">HSN: {item.hsn_code}</small></td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>₹{item.unit_price}</td>
                      <td>{item.gst_rate}%</td>
                      <td>₹{parseFloat(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid-2">
                <div className="glass-card p-4">
                  <p className="text-dim text-xs uppercase fw-800 mb-2">Notes:</p>
                  <p className="text-sm italic">{lastBill.notes || 'No notes added'}</p>
                </div>
                <div className="bill-summary">
                  <div className="bill-summary-row"><span>Subtotal</span><span>₹{parseFloat(lastBill.subtotal).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span>GST Amount</span><span>₹{parseFloat(lastBill.total_gst).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span>Discount</span><span>- ₹{parseFloat(lastBill.total_discount).toFixed(2)}</span></div>
                  <div className="bill-summary-row total"><span>Grand Total</span><span>₹{parseFloat(lastBill.total_amount).toFixed(2)}</span></div>
                  <div className="divider opacity-10"></div>
                  <div className="bill-summary-row"><span>Amount Paid</span><span className="text-success">₹{parseFloat(lastBill.amount_paid).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span className="fw-800">Remaining Balance</span><span className="text-danger fw-800">₹{parseFloat(lastBill.amount_due).toFixed(2)}</span></div>
                </div>
              </div>
              </div>
            </div>
            <div className="modal-footer flex-between">
              <p className="text-dim text-xs">Press Ctrl+P to print if the button doesn't work.</p>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setShowSuccessModal(false)}>Close</button>
                <button className="btn" style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }} onClick={handleWhatsAppSend}>
                  <Send size={16} /> {t('billing.whatsapp')}
                </button>
                <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> {t('billing.print_save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showCustModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">Add New Customer</h3>
              <button className="modal-close" onClick={() => setShowCustModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Village / Town</label>
                  <input type="text" value={newCust.village} onChange={e => setNewCust(p => ({ ...p, village: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingCust}>
                  {savingCust ? 'Saving...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
