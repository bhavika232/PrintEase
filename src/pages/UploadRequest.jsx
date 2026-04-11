import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Palette, BookOpen, CheckCircle, ArrowLeft, UploadCloud } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { submitPrintRequest, getCurrentUser } from '../services/api';
import styles from './UploadRequest.module.css';

const defaultForm = { copies: 1, color: 'BW', pageRange: 'All' };

export default function UploadRequest() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [globalError, setGlobalError] = useState('');
  
  const fileInputRef = useRef(null);

  if (!user) { navigate('/login'); return null; }

  useEffect(() => {
    // Live Cost Calculation
    // BW = ₹2, Color = ₹10
    const price = form.color === 'Color' ? 10 : 2;
    setEstimatedCost(parseInt(form.copies || 0) * price);
  }, [form.copies, form.color]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setGlobalError('');
  };
  
  const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
          setFile(selectedFile);
          setErrors({ ...errors, file: '' });
          setGlobalError('');
      }
  };

  const validate = () => {
    const errs = {};
    if (!file) errs.file = 'Please upload a PDF or image file';
    if (!form.copies || form.copies < 1) errs.copies = 'At least 1 copy required';
    if (!form.pageRange.trim()) errs.pageRange = 'Page range is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    // Check local balance as a safety net
    if (user.balance < estimatedCost) {
        setGlobalError(`Insufficient balance. Cost is ₹${estimatedCost} but you only have ₹${user.balance}. Please top up your wallet.`);
        return;
    }
    
    setLoading(true);
    try {
      await submitPrintRequest({ ...form, copies: parseInt(form.copies), fileName: file.name }, file);
      setSubmitted(true);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setSubmitted(false);
    setErrors({});
    setGlobalError('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>New Print Request</h1>
        <p>Upload your document and customize print properties.</p>
      </div>

      <div className={styles.card}>
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.success}>
              <CheckCircle size={22} />
              Your print request has been submitted successfully! Cost deducted: ₹{estimatedCost}.
            </div>
            <div className={styles.actions}>
              <Button onClick={() => navigate('/orders')} variant="primary">View My Orders</Button>
              <Button onClick={handleReset} variant="secondary">Submit Another</Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {globalError && <div style={{background: '#451010', color: '#ffb3b3', padding: '12px', borderRadius: '8px', border: '1px solid #731c1c', fontSize: '0.9rem'}}>{globalError}</div>}
            
            <div className={styles.sectionLabel}>Document Real Upload</div>
            
            <div style={{marginBottom: '20px'}}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Select File
                </label>
                <div style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'var(--surface)'}}>
                    <UploadCloud size={32} color="var(--purple-main)" style={{marginBottom: '10px'}} />
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange} 
                        style={{display: 'block', margin: '0 auto', color: 'var(--text-main)'}} 
                    />
                    {errors.file && <div style={{color: 'var(--error)', fontSize: '0.8rem', marginTop: '10px'}}>{errors.file}</div>}
                </div>
            </div>

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
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)'}}>
                <div>
                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Estimated Cost</div>
                    <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--purple-light)'}}>₹{estimatedCost}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Wallet Balance</div>
                    <div style={{fontSize: '1.1rem', fontWeight: '600', color: user.balance >= estimatedCost ? 'var(--success)' : 'var(--error)'}}>₹{user.balance || 0}</div>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.actions}>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Pay & Submit'}
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
