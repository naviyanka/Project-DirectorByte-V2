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
import { AppLayout } from '../layouts/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/shared/:token',
    element: <SharedProjectPage />,
  },
  {
    path: '/checkout',
    element: (
      <RequireAuth>
        <CheckoutPage />
      </RequireAuth>
    ),
  },
  {
    path: '/checkout/success',
    element: (
      <RequireAuth>
        <CheckoutSuccessPage />
      </RequireAuth>
    ),
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    path: '/support',
    element: (
      <RequireAuth>
        <AppLayout>
          <SupportHomePage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/support/category/:slug',
    element: (
      <RequireAuth>
        <AppLayout>
          <CategoryPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/support/article/:slug',
    element: (
      <RequireAuth>
        <AppLayout>
          <ArticlePage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/support/tickets',
    element: (
      <RequireAuth>
        <AppLayout>
          <TicketListPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/support/tickets/new',
    element: (
      <RequireAuth>
        <AppLayout>
          <NewTicketPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/support/tickets/:id',
    element: (
      <RequireAuth>
        <AppLayout>
          <TicketDetailPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <AdminOverviewPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <UserListPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/users/:id',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <UserDetailPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/subscriptions',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <SubscriptionListPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/plans',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <PlanListPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/support',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <AdminTicketListPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <AdminSettingsPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <RequireAdminAuth>
        <AdminLayout>
          <AuditLogPage />
        </AdminLayout>
      </RequireAdminAuth>
    ),
  },
  {
    path: '/settings/*',
    element: (
      <RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth>
    ),
  },
  {
    path: '/signin',
    element: (
      <RequireGuest>
        <SignInPage />
      </RequireGuest>
    ),
  },
  {
    path: '/signup',
    element: (
      <RequireGuest>
        <SignUpPage />
      </RequireGuest>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <RequireGuest>
        <ForgotPasswordPage />
      </RequireGuest>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <RequireGuest>
        <ResetPasswordPage />
      </RequireGuest>
    ),
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallbackPage />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <OnboardingPage />
      </RequireAuth>
    ),
  },
  {
    path: '/home',
    element: (
      <RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth>
    ),
  },
  {
    path: '/projects',
    element: (
      <RequireAuth>
        <RequireOnboarding>
          <AppLayout>
            <ProjectsPage />
          </AppLayout>
        </RequireOnboarding>
      </RequireAuth>
    ),
  },
  {
    path: '/studio/:projectId',
    element: (
      <RequireAuth>
        <RequireOnboarding>
          <StudioPage />
        </RequireOnboarding>
      </RequireAuth>
    ),
  },
  // Fallback
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
