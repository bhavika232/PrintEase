import styles from './Input.module.css';

export default function Input({ label, icon: Icon, error, light = false, type = 'text', className = '', ...props }) {
  const isSelect = type === 'select';

  return (
    <div className={styles.inputGroup}>
      {label && <label className={`${styles.label} ${light ? styles.labelDark : ''}`}>{label}</label>}
      <div className={styles.inputWrapper}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        {isSelect ? (
          <select
            className={`${styles.input} ${styles.select} ${Icon ? styles.hasIcon : ''} ${light ? styles.inputLight : ''} ${className}`}
            {...props}
          >
            {props.children}
          </select>
        ) : (
          <input
            type={type}
            className={`${styles.input} ${Icon ? styles.hasIcon : ''} ${light ? styles.inputLight : ''} ${className}`}
            {...props}
          />
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
