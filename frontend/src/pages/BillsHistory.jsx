import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useReactToPrint } from 'react-to-print';
import { 
  Boxes, Search, Calendar, ChevronRight, 
  Printer, Trash2, Eye, X, Filter 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillsHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: selectedBill ? `Invoice_${selectedBill.bill_number}` : 'Invoice',
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data.data);
    } catch (e) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm('Are you sure? This will restore stock for all items in this bill.')) return;
    try {
      await api.delete(`/bills/${id}`);
      toast.success('Bill deleted and stock restored');
      fetchBills();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const viewBill = async (id) => {
    try {
      const res = await api.get(`/bills/${id}`);
      setSelectedBill(res.data.data);
      setShowModal(true);
    } catch (e) {
      toast.error('Failed to load bill details');
    }
  };

  const filtered = bills.filter(b => 
    b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing History</h1>
          <p className="page-subtitle">View and manage all generated invoices</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by bill number or customer name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <button className="btn btn-outline"><Filter size={16} /> Filters</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-5"><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No bills found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id}>
                  <td><span className="fw-bold text-primary">{b.bill_number}</span></td>
                  <td>{new Date(b.bill_date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="fw-bold">{b.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{b.customer_phone}</div>
                  </td>
                  <td><span className="fw-bold">₹{parseFloat(b.total_amount).toFixed(2)}</span></td>
                  <td>
                    <span className={`badge ${b.payment_status === 'paid' ? 'badge-success' : b.payment_status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td><span className="badge badge-neutral">{b.payment_method}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-icon btn-outline" onClick={() => viewBill(b.id)}><Eye size={14} /></button>
                      <button className="btn btn-icon btn-outline" title="Print" onClick={() => viewBill(b.id)}><Printer size={14} /></button>
                      <button className="btn btn-icon btn-danger" onClick={() => deleteBill(b.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedBill && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Bill Details - {selectedBill.bill_number}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
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
                    <div className="bill-no">{selectedBill.bill_number}</div>
                    <p>Date: {new Date(selectedBill.bill_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex-between mb-4 mt-4">
                <div>
                  <label>Bill To:</label>
                  <p className="fw-bold">{selectedBill.customer_name}</p>
                  <p className="text-muted">{selectedBill.customer_address}</p>
                  <p className="text-muted">{selectedBill.customer_phone}</p>
                </div>
              </div>

              <div className="table-container mb-4">
                <table className="bill-items-table">
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
                    {selectedBill.items.map((item, i) => (
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
              </div>

              <div className="grid-2">
                <div className="card card-sm bg-card2">
                  <p className="text-muted mb-2">Notes:</p>
                  <p style={{ fontStyle: 'italic' }}>{selectedBill.notes || 'No notes added'}</p>
                </div>
                <div className="bill-summary">
                  <div className="bill-summary-row"><span>Subtotal</span><span>₹{parseFloat(selectedBill.subtotal).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span>GST</span><span>₹{parseFloat(selectedBill.total_gst).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span>Discount</span><span>- ₹{parseFloat(selectedBill.total_discount).toFixed(2)}</span></div>
                  <div className="bill-summary-row total"><span>Grand Total</span><span>₹{parseFloat(selectedBill.total_amount).toFixed(2)}</span></div>
                  <div className="divider opacity-10"></div>
                  <div className="bill-summary-row"><span>Paid Amount</span><span className="text-success">₹{parseFloat(selectedBill.amount_paid).toFixed(2)}</span></div>
                  <div className="bill-summary-row"><span className="fw-800">Balance Due</span><span className="text-danger fw-800">₹{parseFloat(selectedBill.amount_due).toFixed(2)}</span></div>
                </div>
              </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Print / Save PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
