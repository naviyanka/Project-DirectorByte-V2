import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { notificationsService } from '../../services/notifications.service';
import { Button } from '../../design-system/components/Button/Button';
import { Badge } from '../../design-system/components/Badge/Badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuPortal,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../../design-system/components/DropdownMenu/DropdownMenu';
import { cn } from '../../utils/styles';
import styles from './Topbar.module.css';

import { useLocation, Link, useNavigate } from 'react-router-dom';

export function Topbar() {
  const { toggleSidebar, sidebarCollapsed, openModal } = useUIStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications({ unreadOnly: true }),
    refetchInterval: 30000, // Poll every 30s
    enabled: isAuthenticated
  });

  const unreadCount = notifications?.length || 0;

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      const name = path.charAt(0).toUpperCase() + path.slice(1);
      return { name, url };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className={cn(
      styles.topbar,
      sidebarCollapsed ? styles.collapsed : styles.expanded
    )}>
      <div className={styles.left}>
        <button className={styles.menuToggle} onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        
        <div className={styles.breadcrumbs}>
          <Link to="/home" className={styles.breadcrumbItem}>Home</Link>
          {breadcrumbs.map((bc, i) => (
            bc.name !== 'Home' && (
              <React.Fragment key={bc.url}>
                <span className={styles.separator}>/</span>
                <Link to={bc.url} className={cn(styles.breadcrumbItem, i === breadcrumbs.length - 1 && styles.activeBc)}>
                  {bc.name}
                </Link>
              </React.Fragment>
            )
          ))}
        </div>
      </div>

      <div className={styles.right}>
        {/* Global Search Trigger */}
        <button 
          className={styles.searchTrigger}
          onClick={() => openModal('global-search')}
        >
          <Search size={18} />
          <span>Search...</span>
          <kbd className={styles.kbd}>⌘K</kbd>
        </button>

        <div className={styles.actions}>
          <button className={styles.iconButton}>
            <Bell size={20} />
            {unreadCount > 0 && <Badge dot variant="brand" className={styles.notifBadge} />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles.userTrigger}>
                <div className={styles.avatar}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className={styles.dropdown}>
                <DropdownMenuLabel>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{user?.name}</p>
                    <p className={styles.userEmail}>{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/settings?tab=profile')}>
                  <User size={16} /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <SettingsIcon size={16} /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/support')}>
                  <HelpCircle size={16} /> Support
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOut size={16} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
