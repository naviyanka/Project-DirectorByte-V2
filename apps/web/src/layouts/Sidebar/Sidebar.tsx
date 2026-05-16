import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Film, 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  History, 
  CreditCard, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/styles';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/home' },
    { label: 'Projects', icon: Film, path: '/projects' },
  ];

  const studioItems = [
    { label: 'New Project', icon: PlusCircle, path: '/new', isAction: true },
    { label: 'Active Studio', icon: Film, path: '/studio/proj-1' },
  ];

  const adminItems = [
    { label: 'Admin Center', icon: ShieldCheck, path: '/admin' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Subscription', icon: CreditCard, path: '/subscription' },
    { label: 'Support', icon: HelpCircle, path: '/support' },
  ];

  return (
    <aside className={cn(
      styles.sidebar,
      sidebarCollapsed ? styles.collapsed : styles.expanded,
      sidebarOpen && styles.mobileOpen
    )}>
      {/* Logo Section */}
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Film className={styles.logoIcon} />
          {!sidebarCollapsed && <span className={styles.logoText}>DirectorByte</span>}
        </div>
      </div>

      {/* Main Nav */}
      <nav className={styles.nav}>
        <div className={styles.section}>
          {!sidebarCollapsed && <span className={styles.sectionLabel}>Main</span>}
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              {...item} 
              collapsed={sidebarCollapsed} 
            />
          ))}
        </div>

        <div className={styles.section}>
          {!sidebarCollapsed && <span className={styles.sectionLabel}>Studio</span>}
          {studioItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              {...item} 
              collapsed={sidebarCollapsed} 
            />
          ))}
        </div>

        {isAdmin && (
          <div className={styles.section}>
            {!sidebarCollapsed && <span className={styles.sectionLabel}>Admin</span>}
            {adminItems.map((item) => (
              <SidebarItem 
                key={item.path} 
                {...item} 
                collapsed={sidebarCollapsed} 
                variant="admin"
              />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className={styles.footer}>
        {bottomItems.map((item) => (
          <SidebarItem 
            key={item.path} 
            {...item} 
            collapsed={sidebarCollapsed} 
          />
        ))}
        
        <button className={styles.collapseToggle} onClick={toggleCollapse}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ 
  label, 
  icon: Icon, 
  path, 
  collapsed,
  variant = 'default',
  isAction
}: { 
  label: string; 
  icon: any; 
  path: string; 
  collapsed: boolean;
  variant?: 'default' | 'admin';
  isAction?: boolean;
}) {
  const { openModal } = useUIStore();

  if (isAction) {
    return (
      <button 
        onClick={() => openModal('new-project')}
        className={cn(
          styles.navItem,
          collapsed && styles.itemCollapsed
        )}
        title={collapsed ? label : undefined}
      >
        <Icon size={20} className={styles.itemIcon} />
        {!collapsed && <span className={styles.itemLabel}>{label}</span>}
      </button>
    );
  }

  return (
    <NavLink 
      to={path} 
      className={({ isActive }) => cn(
        styles.navItem,
        isActive && styles.active,
        isActive && variant === 'admin' && styles.activeAdmin,
        collapsed && styles.itemCollapsed
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className={styles.itemIcon} />
      {!collapsed && <span className={styles.itemLabel}>{label}</span>}
    </NavLink>
  );
}
