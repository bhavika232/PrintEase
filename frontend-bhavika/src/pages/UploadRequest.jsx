import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Hash, Palette, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { submitPrintRequest, getCurrentUser } from '../services/api';
import styles from './UploadRequest.module.css';

const defaultForm = { fileName: '', copies: 1, color: 'BW', pageRange: 'All' };

export default function UploadRequest() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.fileName.trim()) errs.fileName = 'File name is required';
    if (!form.copies || form.copies < 1) errs.copies = 'At least 1 copy required';
    if (!form.pageRange.trim()) errs.pageRange = 'Page range is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await submitPrintRequest({ ...form, copies: parseInt(form.copies) });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setSubmitted(false);
    setErrors({});
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>New Print Request</h1>
        <p>Fill in the details below and we'll get your document printed.</p>
      </div>

      <div className={styles.card}>
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.success}>
              <CheckCircle size={22} />
              Your print request has been submitted successfully!
            </div>
            <div className={styles.actions}>
              <Button onClick={() => navigate('/orders')} variant="primary">View My Orders</Button>
              <Button onClick={handleReset} variant="secondary">Submit Another</Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.sectionLabel}>Document Details</div>

            <Input
              label="File Name"
              icon={FileText}
              type="text"
              name="fileName"
              placeholder="e.g. Assignment_1.pdf"
              value={form.fileName}
              onChange={handleChange}
              error={errors.fileName}
            />

            <div className={styles.row}>
              <Input
                label="Number of Copies"
                icon={Hash}
                type="number"
                name="copies"
                placeholder="1"
                min="1"
                max="100"
                value={form.copies}
                onChange={handleChange}
                error={errors.copies}
              />
              <Input
                label="Page Range"
                icon={BookOpen}
                type="text"
                name="pageRange"
                placeholder="e.g. 1-10 or All"
                value={form.pageRange}
                onChange={handleChange}
                error={errors.pageRange}
              />
            </div>

            <div className={styles.divider} />
            <div className={styles.sectionLabel}>Print Options</div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', fontWeight: 500 }}>
                Color Mode
              </label>
              <div className={styles.colorToggle}>
                {['BW', 'Color'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.colorOption} ${form.color === opt ? styles.colorOptionActive : ''}`}
                    onClick={() => setForm({ ...form, color: opt })}
                  >
                    <Palette size={16} />
                    {opt === 'BW' ? 'Black & White' : 'Full Color'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.actions}>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={16} /> Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
