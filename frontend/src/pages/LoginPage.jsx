import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@krushiseva.com', password: 'Admin@123' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back to Krushi Seva! 🌱');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-login-container">
      <div className="login-visual-side">
        <div className="visual-content">
          <div className="badge badge-success mb-4" style={{ padding: '6px 16px' }}>
            <ShieldCheck size={14} /> Official Billing Portal
          </div>
          <h1 className="display-title">Empowering <span className="text-primary-light">Agriculture</span> with Smart Tech.</h1>
          <p className="display-subtitle">Streamline your Krushi Seva Kendra operations with India's most advanced retail billing & stock management platform.</p>
          
          <div className="visual-stats">
            <div className="v-stat">
              <span className="v-val">100%</span>
              <span className="v-lab">Secure</span>
            </div>
            <div className="v-stat">
              <span className="v-val">GST</span>
              <span className="v-lab">Compliant</span>
            </div>
          </div>
        </div>
        <div className="floating-elements">
          <div className="float-item leaf-1">🍃</div>
          <div className="float-item leaf-2">🌱</div>
          <div className="float-item leaf-3">🌾</div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="glass-card login-card-v2">
          <div className="login-header">
            <div className="modern-logo-wrap">
              <div className="logo-icon-lg">🌾</div>
            </div>
            <h2>Welcome Back</h2>
            <p>Access your dashboard with credentials</p>
          </div>

          {error && (
            <div className="alert-banner danger mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email" 
                  value={form.email} 
                  placeholder="name@krushiseva.com"
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex-between mb-2">
                <label style={{ marginBottom: 0 }}>Password</label>
                <span className="text-primary pointer" style={{ fontSize: 11 }}>Forgot Password?</span>
              </div>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  placeholder="••••••••"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(p => !p)}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-modern-primary w-100 mt-2" disabled={loading}>
              {loading ? <span className="loader-sm" /> : <><Leaf size={18} /> Log In to Portal</>}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <span className="text-primary fw-600 pointer">Contact Admin</span></p>
           
          </div>
        </div>
      </div>
    </div>
  );
}
