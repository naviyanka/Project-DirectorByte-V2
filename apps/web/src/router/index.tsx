import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
const SignInPage = React.lazy(() => import('../pages/auth/SignInPage').then(m => ({ default: m.SignInPage })));
const SignUpPage = React.lazy(() => import('../pages/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = React.lazy(() => import('../pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OnboardingPage = React.lazy(() => import('../pages/auth/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const OAuthCallbackPage = React.lazy(() => import('../pages/auth/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));
const HomePage = React.lazy(() => import('../pages/home/HomePage').then(m => ({ default: m.HomePage })));
const ProjectsPage = React.lazy(() => import('../pages/home/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const StudioPage = React.lazy(() => import('../pages/studio/StudioPage').then(m => ({ default: m.StudioPage })));
const SettingsPage = React.lazy(() => import('../pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PricingPage = React.lazy(() => import('../pages/subscription/PricingPage').then(m => ({ default: m.PricingPage })));
const CheckoutPage = React.lazy(() => import('../pages/subscription/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = React.lazy(() => import('../pages/subscription/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));
const SupportHomePage = React.lazy(() => import('../pages/support/SupportHomePage').then(m => ({ default: m.SupportHomePage })));
const CategoryPage = React.lazy(() => import('../pages/support/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ArticlePage = React.lazy(() => import('../pages/support/ArticlePage').then(m => ({ default: m.ArticlePage })));
const TicketListPage = React.lazy(() => import('../pages/support/TicketListPage').then(m => ({ default: m.TicketListPage })));
const NewTicketPage = React.lazy(() => import('../pages/support/NewTicketPage').then(m => ({ default: m.NewTicketPage })));
const TicketDetailPage = React.lazy(() => import('../pages/support/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const AdminLoginPage = React.lazy(() => import('../pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminOverviewPage = React.lazy(() => import('../pages/admin/Overview/OverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const UserListPage = React.lazy(() => import('../pages/admin/Users/UserListPage').then(m => ({ default: m.UserListPage })));
const UserDetailPage = React.lazy(() => import('../pages/admin/Users/UserDetailPage').then(m => ({ default: m.UserDetailPage })));
const SubscriptionListPage = React.lazy(() => import('../pages/admin/Subscriptions/SubscriptionListPage').then(m => ({ default: m.SubscriptionListPage })));
const PlanListPage = React.lazy(() => import('../pages/admin/Plans/PlanListPage').then(m => ({ default: m.PlanListPage })));
const AdminTicketListPage = React.lazy(() => import('../pages/admin/SupportTickets/AdminTicketListPage').then(m => ({ default: m.AdminTicketListPage })));
const AdminSettingsPage = React.lazy(() => import('../pages/admin/SystemSettings/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AuditLogPage = React.lazy(() => import('../pages/admin/AuditLog/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const LandingPage = React.lazy(() => import('../pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const SharedProjectPage = React.lazy(() => import('../pages/shared/SharedProjectPage').then(m => ({ default: m.SharedProjectPage })));
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout';
import { RequireAuth, RequireGuest, RequireOnboarding } from './AuthGuards';
import { RequireAdminAuth } from './AdminGuards';
import { InstallGuard } from './InstallGuard/InstallGuard';
const InstallPage = React.lazy(() => import('../pages/install/InstallPage').then(m => ({ default: m.InstallPage })));
import { AppLayout } from '../layouts/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/install',
    element: <InstallGuard><InstallPage /></InstallGuard>,
  },
  {
    path: '/',
    element: <InstallGuard><LandingPage /></InstallGuard>,
  },
  {
    path: '/shared/:token',
    element: <InstallGuard><SharedProjectPage /></InstallGuard>,
  },
  {
    path: '/checkout',
    element: (
      <InstallGuard><RequireAuth>
        <CheckoutPage />
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/checkout/success',
    element: (
      <InstallGuard><RequireAuth>
        <CheckoutSuccessPage />
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/pricing',
    element: <InstallGuard><PricingPage /></InstallGuard>,
  },
  {
    path: '/support',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <SupportHomePage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/support/category/:slug',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <CategoryPage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/support/article/:slug',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <ArticlePage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/support/tickets',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <TicketListPage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/support/tickets/new',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <NewTicketPage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/support/tickets/:id',
    element: (
      <InstallGuard><RequireAuth>
        <AppLayout>
          <TicketDetailPage />
        </AppLayout>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/login',
    element: <InstallGuard><AdminLoginPage /></InstallGuard>,
  },
  {
    path: '/admin',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <AdminOverviewPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <UserListPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/users/:id',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <UserDetailPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/subscriptions',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <SubscriptionListPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/plans',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <PlanListPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/support',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <AdminTicketListPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <AdminSettingsPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <InstallGuard><RequireAdminAuth>
        <AdminLayout>
          <AuditLogPage />
        </AdminLayout>
      </RequireAdminAuth></InstallGuard>
    ),
  },
  {
    path: '/settings/*',
    element: (
      <InstallGuard><RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/signin',
    element: (
      <InstallGuard><RequireGuest>
        <SignInPage />
      </RequireGuest></InstallGuard>
    ),
  },
  {
    path: '/signup',
    element: (
      <InstallGuard><RequireGuest>
        <SignUpPage />
      </RequireGuest></InstallGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <InstallGuard><RequireGuest>
        <ForgotPasswordPage />
      </RequireGuest></InstallGuard>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <InstallGuard><RequireGuest>
        <ResetPasswordPage />
      </RequireGuest></InstallGuard>
    ),
  },
  {
    path: '/verify-email',
    element: <InstallGuard><VerifyEmailPage /></InstallGuard>,
  },
  {
    path: '/oauth/callback',
    element: <InstallGuard><OAuthCallbackPage /></InstallGuard>,
  },
  {
    path: '/onboarding',
    element: (
      <InstallGuard><RequireAuth>
        <OnboardingPage />
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/home',
    element: (
      <InstallGuard><RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/projects',
    element: (
      <InstallGuard><RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <ProjectsPage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth></InstallGuard>
    ),
  },
  {
    path: '/studio/:projectId',
    element: (
      <InstallGuard><RequireAuth>
        <RequireOnboarding>
          <StudioPage />
        </RequireOnboarding>
      </RequireAuth></InstallGuard>
    ),
  },
  // Fallback
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
