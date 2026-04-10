import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size, fullWidth, className = '', ...props }) {
  const classes = [
    styles.btn,
    styles[variant],
    size === 'small' && styles.small,
    fullWidth && styles.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
