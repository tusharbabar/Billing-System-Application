import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Users, IndianRupee, Clock, Search, ArrowRight, 
  Phone, Calendar, AlertCircle, TrendingUp, Filter,
  Download, UserCheck, MessageSquare, X, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PendingDues() {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Settle Modal State
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const res = await api.get('/reports/pending-dues');
      setDues(res.data.data);
    } catch (e) {
      toast.error('Failed to load pending dues');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settleAmount || parseFloat(settleAmount) <= 0) return toast.error('Enter a valid amount');
    
    setIsSettling(true);
    try {
      await api.post('/bills/settle', {
        customer_name: selectedCustomer.customer_name,
        customer_phone: selectedCustomer.customer_phone,
        amount_paid: settleAmount,
        payment_method: paymentMethod
      });
      toast.success('Payment settled successfully!');
      setShowSettleModal(false);
      setSettleAmount('');
      fetchDues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed');
    } finally {
      setIsSettling(false);
    }
  };

  const sendReminder = (customer) => {
    const message = `Hello ${customer.customer_name}, this is a friendly reminder from SHRI NIGMANAD KRUSHI SEVA KENDRA regarding your outstanding balance of ₹${parseFloat(customer.total_due).toLocaleString('en-IN')}. Please settle it at your earliest convenience. Thank you!`;
    const phone = customer.customer_phone?.replace(/\D/g, '');
    if (!phone) return toast.error('No phone number available');
    
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredDues = dues.filter(d => 
    d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.customer_phone?.includes(search)
  );

  const totalPending = dues.reduce((acc, curr) => acc + parseFloat(curr.total_due), 0);

  if (loading) return (
    <div className="modern-loader-wrap">
      <div className="modern-loader"></div>
      <p>Fetching outstanding balances...</p>
    </div>
  );

  return (
    <div className="modern-page animate-fadeIn">
      <div className="dashboard-header-v2">
        <div className="welcome-section">
          <div className="greeting">Financial Status</div>
          <h1 className="modern-title">Pending <span className="text-gradient">Collections</span></h1>
        </div>
        <div className="flex gap-3">
           <button className="btn btn-outline" style={{ borderRadius: 12 }}>
             <Download size={16} /> Export PDF
           </button>
           <div className="glass-card flex items-center gap-3 px-4 py-2" style={{ borderRadius: 14 }}>
              <div className="flex flex-col">
                <span className="text-dim text-xs uppercase fw-800">Total Outstanding</span>
                <span className="text-danger fw-800 text-lg">₹{totalPending.toLocaleString('en-IN')}</span>
              </div>
              <div className="stat-icon-wrap bg-danger-glow text-danger">
                <IndianRupee size={20} />
              </div>
           </div>
        </div>
      </div>

      <div className="toolbar flex-between mb-8">
        <div className="search-bar glass-card">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by customer name or mobile number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-icon glass-card"><Filter size={18}/></button>
          <button className="btn btn-primary">
            <UserCheck size={16}/> Bulk Settlement
          </button>
        </div>
      </div>

      <div className="pending-grid-modern">
        {filteredDues.length === 0 ? (
          <div className="glass-card col-span-full text-center py-20" style={{ borderRadius: 24 }}>
            <div className="modern-empty-icon mx-auto mb-6">✅</div>
            <h3 className="text-xl fw-800 mb-2">No Outstanding Payments</h3>
            <p className="text-dim max-w-sm mx-auto">Great! Your customers have cleared all their dues. Keep up the good work!</p>
          </div>
        ) : (
          filteredDues.map((due, i) => (
            <div key={i} className="glass-card pending-card-modern hover-up">
              <div className="card-top">
                <div className="avatar-v2">
                  {due.customer_name?.[0] || 'C'}
                  <div className="v2-ring"></div>
                </div>
                <div className="card-info">
                  <h3 className="fw-800 text-lg">{due.customer_name}</h3>
                  <div className="info-pills">
                    <span className="pill"><Phone size={10} /> {due.customer_phone || 'N/A'}</span>
                    <span className="pill"><Calendar size={10} /> {new Date(due.last_bill_date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <button 
                  className="btn-icon-v2 ms-auto" 
                  onClick={() => sendReminder(due)}
                  title="Send WhatsApp Reminder"
                >
                  <MessageSquare size={18} className="text-success" />
                </button>
              </div>

              <div className="card-middle">
                <div className="due-amount-wrap">
                  <div className="amount-label">Amount Outstanding</div>
                  <div className="amount-val">₹{parseFloat(due.total_due).toLocaleString('en-IN')}</div>
                </div>
                <div className="due-stats">
                  <div className="due-stat-box">
                    <span className="d-val">{due.bill_count}</span>
                    <span className="d-lab">Bills</span>
                  </div>
                </div>
              </div>

              <div className="card-bottom">
                <button 
                  className="btn-modern-primary w-100" 
                  style={{ height: 44, fontSize: 13 }}
                  onClick={() => {
                    setSelectedCustomer(due);
                    setSettleAmount(due.total_due);
                    setShowSettleModal(true);
                  }}
                >
                   Settle Payment <ArrowRight size={14} />
                </button>
              </div>
              
              <div className="card-accent-bg"></div>
            </div>
          ))
        )}
      </div>

      {/* Settle Modal */}
      {showSettleModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal modal-sm animate-slideUp">
            <div className="modal-header">
              <h3 className="modal-title">Settle Dues</h3>
              <button className="modal-close" onClick={() => setShowSettleModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSettle}>
              <div className="modal-body">
                <div className="flex items-center gap-4 mb-6 p-4 bg-primary-glow rounded-xl border border-primary-light/10">
                  <div className="avatar-v2" style={{ width: 44, height: 44, fontSize: 16 }}>
                    {selectedCustomer.customer_name?.[0]}
                  </div>
                  <div>
                    <h4 className="fw-800">{selectedCustomer.customer_name}</h4>
                    <p className="text-xs text-dim">Total Pending: ₹{parseFloat(selectedCustomer.total_due).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount to Receive (₹)</label>
                  <div className="search-bar focus-within">
                    <IndianRupee size={16} />
                    <input 
                      type="number" 
                      value={settleAmount} 
                      onChange={(e) => setSettleAmount(e.target.value)} 
                      step="0.01"
                      required 
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI / Online Transfer</option>
                    <option value="card">Card Payment</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowSettleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSettling}>
                  {isSettling ? 'Processing...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
