import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Save } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { getCurrentUser, topUpUser, updateProfile } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [profileForm, setProfileForm] = useState({ name: '', password: '' });
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setProfileForm({ name: user.name, password: '' });
  }, [user, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await updateProfile(profileForm.name, profileForm.password);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await topUpUser(parseFloat(topUpAmount));
      setMsg(`Successfully added ₹${topUpAmount} to your wallet!`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Profile & Wallet</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and account balance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          
          {/* Profile Settings Card */}
          <Card>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} color="var(--purple-main)" /> Personal Details
              </h2>
              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <Input 
                      label="Full Name" 
                      name="name" 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} 
                  />
                  <Input 
                      label="New Password (Optional)" 
                      type="password" 
                      name="password" 
                      placeholder="Leave blank to keep current" 
                      value={profileForm.password} 
                      onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} 
                  />
                  <Button type="submit" disabled={loading}>
                      <Save size={16} /> Save Changes
                  </Button>
              </form>
          </Card>

          {/* Wallet Card */}
          <Card>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={20} color="var(--success)" /> Wallet Management
              </h2>
              
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Current Balance</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{user.balance || 0}</div>
              </div>

              <form onSubmit={handleTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <Input 
                      label="Top Up Amount (₹)" 
                      type="number" 
                      min="10" 
                      value={topUpAmount} 
                      onChange={(e) => setTopUpAmount(e.target.value)} 
                  />
                  <Button type="submit" variant="secondary" disabled={loading}>
                      <CreditCard size={16} /> Add Funds (Sandbox)
                  </Button>
              </form>
          </Card>
      </div>

      {msg && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--surface)', border: '1px solid var(--purple-light)', borderRadius: '8px', color: 'var(--purple-light)', textAlign: 'center' }}>
              {msg}
          </div>
      )}
    </div>
  );
}
