import styles from './Card.module.css';

export default function Card({ children, className = '', clickable = false, flat = false, light = false, onClick, ...props }) {
  const classes = [
    styles.card,
    clickable && styles.cardClickable,
    flat && styles.cardFlat,
    light && styles.cardLight,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
