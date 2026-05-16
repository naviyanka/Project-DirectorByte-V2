import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Ticket, 
  Settings, 
  ShieldCheck, 
  Bell, 
  Search, 
  LogOut,
  ChevronRight,
  Database,
  Globe,
  LifeBuoy,
  FileText,
  History
} from 'lucide-react';
import { NavLink, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdminStore } from '../../store/admin.store';
import { cn } from '../../utils/styles';
import { slideUp } from '../../lib/motion';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      { path: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
      { path: '/admin/subscriptions', label: 'Subscriptions', icon: <CreditCard size={18} /> },
      { path: '/admin/promo-codes', label: 'Promo Codes', icon: <Ticket size={18} /> },
    ]
  },
  {
    label: 'CONFIGURATION',
    items: [
      { path: '/admin/services', label: 'API & Services', icon: <Database size={18} /> },
      { path: '/admin/content', label: 'Content', icon: <FileText size={18} /> },
      { path: '/admin/settings', label: 'System Settings', icon: <Settings size={18} /> },
    ]
  },
  {
    label: 'SUPPORT',
    items: [
      { path: '/admin/support', label: 'Support Tickets', icon: <LifeBuoy size={18} />, badge: 3 },
      { path: '/admin/announcements', label: 'Announcements', icon: <Bell size={18} /> },
    ]
  },
  {
    label: 'SECURITY',
    items: [
      { path: '/admin/audit', label: 'Audit Log', icon: <History size={18} /> },
    ]
  }
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();

  const handleExit = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.container}>
      <a href="#admin-content" className="skip-link">Skip to admin content</a>
      
      {/* Top Admin Banner */}
      <header className={styles.banner}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-surface-950" />
          <span className="font-black text-sm uppercase tracking-widest text-surface-950">
            Admin Mode — DirectorByte Admin Center
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-950 text-warning-500 flex items-center justify-center text-[10px] font-bold">
              {admin?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-surface-950">{admin?.username}</span>
          </div>
          <button onClick={handleExit} className={styles.exitButton}>
            <LogOut size={14} />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      <div className={styles.wrapper}>
        {/* Admin Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🛡️</div>
              <span>Admin Center</span>
            </div>
          </div>

          <nav className={styles.nav}>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className={styles.navGroup}>
                <div className={styles.groupLabel}>{group.label}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) => cn(styles.navItem, isActive && styles.active)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    <ChevronRight size={14} className={styles.chevron} />
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main id="admin-content" className={styles.main}>
          <div className={styles.content}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideUp}
                style={{ width: '100%' }}
              >
                {children || outlet}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
