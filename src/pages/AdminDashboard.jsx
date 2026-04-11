import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getAllRequests, updateRequestStatus, getCurrentUser } from '../services/api';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const data = await getAllRequests();
        setRequests(data);
    } catch (e) {
        console.error(e);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setLoadingId(id);
    try {
        await updateRequestStatus(id, newStatus);
        await fetchData();
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingId(null);
    }
  };

  // Filter requests based on search query and status filter
  const filteredRequests = requests.filter(req => {
      const matchesSearch = (req.userName && req.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (req.fileName && req.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (req.id && req.id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      
      return matchesSearch && matchesStatus;
  });

  const columns = ['Req ID', 'User', 'File', 'Cost', 'Copies', 'Color', 'Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={idx}>
      <td style={{ fontWeight: 500 }}>{item.id}</td>
      <td>{item.userName}</td>
      <td>{item.fileName}</td>
      <td>₹{item.cost || 0}</td>
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
          <p>Search, filter, and process live user print requests.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
             <Input 
                 icon={Search} 
                 placeholder="Search by ID, User, or File Name..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ marginBottom: 0 }}
             />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Filter size={18} color="var(--text-muted)" />
              <select 
                  className={styles.selectFilter} 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
              </select>
          </div>
      </div>

      <Table
        columns={columns}
        data={filteredRequests}
        emptyMessage="No print requests match your filters."
        renderRow={renderRow}
      />
    </div>
  );
}
