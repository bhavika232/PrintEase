import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getAllRequests, updateRequestStatus, getCurrentUser } from '../services/api';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getAllRequests();
    setRequests(data);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setLoadingId(id);
    await updateRequestStatus(id, newStatus);
    await fetchData();
    setLoadingId(null);
  };

  const columns = ['Req ID', 'User ID', 'File', 'Copies', 'Color', 'Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={idx}>
      <td style={{ fontWeight: 500 }}>{item.id}</td>
      <td>User {item.userId}</td>
      <td>{item.fileName}</td>
      <td>{item.copies}</td>
      <td>{item.color}</td>
      <td><Badge status={item.status} /></td>
      <td>
        <div className={styles.actions}>
          {item.status === 'Pending' && (
            <Button
              size="small"
              variant="warning"
              onClick={() => handleStatusUpdate(item.id, 'Processing')}
              disabled={loadingId === item.id}
            >
              Process
            </Button>
          )}
          {item.status === 'Processing' && (
            <Button
              size="small"
              variant="success"
              onClick={() => handleStatusUpdate(item.id, 'Completed')}
              disabled={loadingId === item.id}
            >
              Complete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Admin Control Panel</h1>
          <p>Manage and process user print requests efficiently.</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={requests}
        emptyMessage="No print requests in the system."
        renderRow={renderRow}
      />
    </div>
  );
}
