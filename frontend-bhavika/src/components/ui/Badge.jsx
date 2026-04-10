import styles from './Badge.module.css';

export default function Badge({ status }) {
  const statusKey = status?.toLowerCase() || 'pending';

  return (
    <span className={`${styles.badge} ${styles[statusKey]}`}>
      <span className={styles.dot}></span>
      {status}
    </span>
  );
}
