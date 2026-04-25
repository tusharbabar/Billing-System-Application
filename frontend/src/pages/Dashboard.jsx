import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  LayoutDashboard, TrendingUp, Users, Package, AlertTriangle,
  IndianRupee, ShoppingCart, FileText, ArrowUpRight, Clock,
  DollarSign, Activity, Zap, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00e676', '#ffea00', '#00e5ff', '#ff5252', '#d500f9'];

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data.data);
      } catch (e) {
        toast.error('Failed to sync dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="modern-loader-wrap">
      <div className="modern-loader"></div>
      <p>Synchronizing Portal Data...</p>
    </div>
  );

  if (!data) return <div className="empty-state"><h3>Connection Error</h3><p>Could not reach the server.</p></div>;

  const stats = [
    { label: "Today's Revenue", val: fmt(data.today_sales?.total), icon: <IndianRupee size={24}/>, color: 'var(--primary)', trend: '+12% from yesterday' },
    { label: "Active Customers", val: data.total_customers, icon: <Users size={24}/>, color: '#00e5ff', trend: 'Growing community' },
    { label: "Total Products", val: data.total_products, icon: <Package size={24}/>, color: '#ffea00', trend: `${data.low_stock_count} low stock` },
    { label: "Pending Dues", val: fmt(data.pending_dues), icon: <Clock size={24}/>, color: '#ff5252', trend: 'Requires attention' },
  ];

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header-v2">
        <div className="welcome-section">
          <div className="greeting">Good Day, Administrator 👋</div>
          <h1 className="modern-title">Performance <span className="text-gradient">Overview</span></h1>
        </div>
        <div className="quick-actions">
          <div className="live-badge"><div className="dot"></div> System Live</div>
          <div className="date-pill">
            <Clock size={14} />
            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="stats-container-v2">
        {stats.map((s, i) => (
          <div key={i} className="glass-card stat-item-v2 hover-up">
            <div className="stat-header">
              <div className="stat-icon-wrap" style={{ color: s.color, backgroundColor: `${s.color}15` }}>
                {s.icon}
              </div>
              <div className="stat-trend"><TrendingUp size={12}/> {s.trend}</div>
            </div>
            <div className="stat-main">
              <div className="stat-value-v2">{s.val}</div>
              <div className="stat-label-v2">{s.label}</div>
            </div>
            <div className="stat-bg-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts-grid">
        <div className="glass-card chart-main">
          <div className="chart-header">
            <h3>Monthly Growth</h3>
            <div className="flex gap-2">
              <span className="badge badge-neutral">Last 6 Months</span>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthly_sales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card top-selling">
          <div className="chart-header">
            <h3>Top Categories</h3>
          </div>
          <div className="product-ranking">
            {data.top_products?.map((p, i) => (
              <div key={i} className="ranking-item">
                <div className="ranking-info">
                  <span className="rank-name">{p.product_name}</span>
                  <span className="rank-val">{fmt(p.total_amount)}</span>
                </div>
                <div className="rank-bar-wrap">
                  <div className="rank-bar" style={{ 
                    width: `${Math.min(100, (p.total_amount / (data.top_products[0]?.total_amount || 1)) * 100)}%`,
                    backgroundColor: COLORS[i % COLORS.length]
                  }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline w-100 mt-4" style={{ borderRadius: 12 }}>Detailed Analytics <ArrowUpRight size={14}/></button>
        </div>
      </div>

      <div className="glass-card recent-bills-card mt-4">
        <div className="chart-header flex-between">
          <h3>Latest Transactions</h3>
          <button className="btn btn-sm btn-outline">History <ChevronRight size={14}/></button>
        </div>
        <div className="table-container no-border">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Bill Identifier</th>
                <th>Purchaser</th>
                <th>Filing Date</th>
                <th>Net Amount</th>
                <th>Transaction Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_bills?.map(bill => (
                <tr key={bill.id}>
                  <td><div className="bill-pill">{bill.bill_number}</div></td>
                  <td>
                    <div className="flex gap-2">
                      <div className="avatar-sm">{bill.customer_name?.[0] || 'W'}</div>
                      {bill.customer_name || 'Walk-in Customer'}
                    </div>
                  </td>
                  <td>{new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td><span className="fw-700">{fmt(bill.total_amount)}</span></td>
                  <td>
                    <span className={`modern-badge ${bill.payment_status}`}>
                      <Zap size={10} /> {bill.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
