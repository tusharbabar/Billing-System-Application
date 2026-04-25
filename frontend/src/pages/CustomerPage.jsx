import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '',
    village: '', district: '', state: 'Maharashtra', gstin: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added');
      }
      setShowModal(false);
      setEditing(null);
      fetchCustomers();
    } catch (e) {
      toast.error('Error saving customer');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) ||
    c.village?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage farmer database and credit history</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', village: '', district: '', state: 'Maharashtra', gstin: '' }); }}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input type="text" placeholder="Search by name, phone or village..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid-3">
        {loading ? (
          <div className="loading-wrap" style={{ gridColumn: 'span 3' }}><div className="loader" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: 'span 3' }}><p>No customers found</p></div>
        ) : filtered.map(c => (
          <div key={c.id} className="card stat-card" style={{ padding: 20 }}>
            <div className="flex-between mb-3">
              <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>{c.name[0]}</div>
              <div className="flex gap-2">
                <button className="btn btn-icon btn-outline" onClick={() => { setEditing(c); setForm(c); setShowModal(true); }}><Edit2 size={14} /></button>
                <button className="btn btn-icon btn-danger" onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/customers/${c.id}`); fetchCustomers(); } }}><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
            <div className="flex items-center gap-2 text-muted mb-2" style={{ fontSize: 13 }}>
              <Phone size={14} /> {c.phone}
            </div>
            <div className="flex items-center gap-2 text-muted mb-2" style={{ fontSize: 13 }}>
              <MapPin size={14} /> {c.village}, {c.district}
            </div>
            {c.gstin && (
              <div className="mt-3 p-2 bg-card2 border rounded text-primary fw-bold" style={{ fontSize: 11 }}>
                GSTIN: {c.gstin}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Address</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Village</label>
                    <input type="text" value={form.village} onChange={e => setForm({...form, village: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input type="text" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

