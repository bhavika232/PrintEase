import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { registerUser } from '../services/api';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await registerUser(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <UserPlus size={26} color="#F0E7D5" />
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join PrintEase to manage your print requests</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {globalError && <div className={styles.error}>{globalError}</div>}

          <Input
            label="Full Name"
            icon={User}
            type="text"
            name="name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            label="Password"
            icon={Lock}
            type="password"
            name="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            name="confirmPassword"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
