import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ClipboardList, ChevronRight, FileText, Clock, Settings, CheckCircle } from 'lucide-react';
import { getCurrentUser, getUserStats } from '../services/api';
import styles from './UserDashboard.module.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0 });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getUserStats().then(setStats);
  }, []);

  const statCards = [
    { label: 'Total Requests', value: stats.total, icon: <FileText size={22} color="#F0E7D5" />, iconClass: styles.statIconTotal },
    { label: 'Pending', value: stats.pending, icon: <Clock size={22} color="#e8a74e" />, iconClass: styles.statIconPending },
    { label: 'Processing', value: stats.processing, icon: <Settings size={22} color="#5b9bd5" />, iconClass: styles.statIconProcessing },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle size={22} color="#5dba6e" />, iconClass: styles.statIconCompleted },
  ];

  const actions = [
    {
      icon: <Upload size={26} color="#F0E7D5" />,
      title: 'Upload Document',
      desc: 'Submit a new print request quickly',
      path: '/upload',
    },
    {
      icon: <ClipboardList size={26} color="#F0E7D5" />,
      title: 'View My Orders',
      desc: 'Track all your print request statuses',
      path: '/orders',
    },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>
          Welcome back, <span>{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className={styles.welcomeSub}>Here's a quick overview of your print activity.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {statCards.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.iconClass}`}>{s.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.sectionTitle}>Quick Actions</div>
      <div className={styles.actionsRow}>
        {actions.map((a) => (
          <div key={a.path} className={styles.actionCard} onClick={() => navigate(a.path)}>
            <div className={styles.actionIconWrap}>{a.icon}</div>
            <div>
              <div className={styles.actionTitle}>{a.title}</div>
              <div className={styles.actionDesc}>{a.desc}</div>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </div>
        ))}
      </div>
    </div>
  );
}
