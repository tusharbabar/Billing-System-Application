import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Package, Search, Plus, Edit2, Trash2, 
  AlertTriangle, Filter, MoreVertical, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '', brand: '', category_id: '', unit: 'Kg',
    purchase_price: '', selling_price: '', gst_rate: '5',
    hsn_code: '', stock_quantity: '0', min_stock_alert: '10'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ]);
      setProducts(pRes.data.data);
      setCategories(cRes.data.data);
    } catch (e) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product added');
      }
      setShowModal(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      toast.error('Error saving product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchData();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const filtered = products.filter(p => 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())) &&
    (filterCat ? p.category_id == filterCat : true)
  );

  return (
    <div className="product-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Inventory</h1>
          <p className="page-subtitle">Manage seeds, fertilizers, and agrochemicals</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditing(null); setForm({ name: '', brand: '', category_id: '', unit: 'Kg', purchase_price: '', selling_price: '', gst_rate: '5', hsn_code: '', stock_quantity: '0', min_stock_alert: '10' }); }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input type="text" placeholder="Search by name or brand..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="text-muted hide-mobile" style={{ marginLeft: 'auto', fontSize: 13 }}>
          Showing {filtered.length} products
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Prices (P/S)</th>
                <th>GST</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-5"><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="fw-bold">{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.brand} | HSN: {p.hsn_code}</div>
                  </td>
                  <td><span className="badge badge-neutral">{p.category_name}</span></td>
                  <td>
                    <div className={`stock-indicator ${p.stock_quantity <= p.min_stock_alert ? 'critical' : 'good'}`}>
                      {p.stock_quantity} {p.unit}
                    </div>
                  </td>
                  <td>
                    <div className="text-muted" style={{ fontSize: 11 }}>P: ₹{p.purchase_price}</div>
                    <div className="fw-bold text-primary">S: ₹{p.selling_price}</div>
                  </td>
                  <td>{p.gst_rate}%</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-icon btn-outline" onClick={() => { setEditing(p); setForm(p); setShowModal(true); }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-icon btn-danger" onClick={() => deleteProduct(p.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Brand</label>
                    <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Unit (e.g. Kg, Liter)</label>
                    <input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Purchase Price</label>
                    <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Selling Price</label>
                    <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>GST Rate (%)</label>
                    <select value={form.gst_rate} onChange={e => setForm({...form, gst_rate: e.target.value})}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>HSN Code</label>
                    <input type="text" value={form.hsn_code} onChange={e => setForm({...form, hsn_code: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Stock Qty</label>
                    <input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} disabled={editing} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
