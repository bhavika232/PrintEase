import styles from './Table.module.css';
import { InboxIcon } from 'lucide-react';

export default function Table({ columns, data, emptyMessage = 'No data available', renderRow }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className={styles.emptyRow}>
              <td colSpan={columns.length}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <InboxIcon size={32} strokeWidth={1.5} />
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, i) => renderRow(item, i))
          )}
        </tbody>
      </table>
    </div>
  );
}
