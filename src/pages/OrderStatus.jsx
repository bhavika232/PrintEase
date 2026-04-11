import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getUserRequests, getCurrentUser, downloadReceipt } from '../services/api';
import styles from './OrderStatus.module.css';

export default function OrderStatus() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    // Initial fetch
    fetchData();

    // Short-Polling for realtime notifications every 5 seconds
    timerRef.current = setInterval(() => {
        fetchData(true);
    }, 5000);

    return () => {
        if(timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchData = async (isBackground = false) => {
    try {
        const data = await getUserRequests();
        setRequests(prev => {
            // Check if there's an update to trigger a basic browser notification
            if (isBackground && prev.length > 0) {
                const completedNow = data.filter(r => r.status === 'Completed');
                const completedBefore = prev.filter(r => r.status === 'Completed');
                if (completedNow.length > completedBefore.length) {
                    if (Notification.permission === 'granted') {
                        new Notification("PrintEase", { body: "One of your print requests is ready!" });
                    }
                }
            }
            return data;
        });
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
      // Ask for notification permissions on load
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission();
      }
  }, []);

  const columns = ['Request ID', 'File Name', 'Copies', 'Color', 'Date', 'Status', 'Receipt'];

  const renderRow = (item, idx) => (
    <tr key={idx}>
      <td style={{ fontWeight: 500 }}>{item.id}</td>
      <td>{item.fileName}</td>
      <td>{item.copies}</td>
      <td>{item.color}</td>
      <td>{item.createdAt}</td>
      <td><Badge status={item.status} /></td>
      <td>
        {item.status === 'Completed' ? (
            <Button size="small" variant="secondary" onClick={() => downloadReceipt(item.id)}>
                <Download size={14} /> PDF
            </Button>
        ) : (
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>-</span>
        )}
      </td>
    </tr>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>My Orders</h1>
          <p>Track the status of your print requests.</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Plus size={18} /> New Request
        </Button>
      </div>

      <Table
        columns={columns}
        data={requests}
        emptyMessage="You haven't made any print requests yet."
        renderRow={renderRow}
      />
    </div>
  );
}
