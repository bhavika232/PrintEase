import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Printer, LayoutDashboard, Upload, ClipboardList, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/api';
import styles from './Layout.module.css';

export default function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Printer size={20} color="#F0E7D5" />
          </div>
          PrintEase
        </div>

        <div className={styles.navLinks}>
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck size={17} />
              Admin Panel
            </NavLink>
          ) : (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>
              <NavLink to="/upload" className={linkClass}>
                <Upload size={17} />
                Upload
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                <ClipboardList size={17} />
                Orders
              </NavLink>
            </>
          )}
          <NavLink to="/profile" className={linkClass}>
              <UserIcon size={17} />
              Profile & Wallet
          </NavLink>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
