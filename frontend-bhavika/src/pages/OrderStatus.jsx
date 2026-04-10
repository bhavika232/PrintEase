import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getUserRequests, getCurrentUser } from '../services/api';
import styles from './OrderStatus.module.css';

export default function OrderStatus() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getUserRequests().then(setRequests);
  }, []);

  const columns = ['Request ID', 'File Name', 'Copies', 'Color', 'Date', 'Status'];

  const renderRow = (item, idx) => (
    <tr key={idx}>
      <td style={{ fontWeight: 500 }}>{item.id}</td>
      <td>{item.fileName}</td>
      <td>{item.copies}</td>
      <td>{item.color}</td>
      <td>{item.createdAt}</td>
      <td><Badge status={item.status} /></td>
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
