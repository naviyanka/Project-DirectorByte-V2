# Admin Center Guide

Welcome to the DirectorByte Admin Center. This guide explains how to manage the platform, users, and system settings.

---

## 1. Getting Started

### Accessing the Portal
1. Navigate to: `http://localhost:3000/admin/login` (Development) or `https://app.directorbyte.com/admin/login` (Production).
2. Enter your admin username and password.
3. Every action you perform is recorded in the **Audit Log** for security.

⚠️ **Security Warning**: Never share your admin credentials. Use strong passwords and rotate them regularly.

---

## 2. User Management

The **Users** section allows you to find, inspect, and manage every account on the platform.

### Finding a User
- Use the search bar to find users by **email** or **display name**.
- Filter the list by **Status** (Active, Suspended, Banned) or **Plan**.

### Common Actions
- **View Profile**: Click a user row to see their subscription status, usage history, and recent activity.
- **Suspend/Ban**: Use these actions to block access for users violating terms.
- **Sign In As**: Allows you to see the application exactly as the user does (useful for troubleshooting).
- **Reset Password**: Send a password reset link directly to the user's email.

---

## 3. Subscriptions & Billing

Manage how users access paid features and track platform revenue.

### Manual Assignments
If you need to give a user a paid plan (e.g., for testing or as a courtesy):
1. Go to the user's profile.
2. Click **Assign Subscription**.
3. Select the plan and billing cycle.
4. The user will receive access immediately without being charged.

### Credit Adjustments
You can manually add or remove "Credits" from a user's account in the **Usage** tab of their profile. A reason is required for every adjustment.

---

## 4. Content & Support

### Help Articles
Write and edit articles for the public [Help Center](/support).
- Articles support **Markdown** for formatting.
- Set an article to **Published** to make it visible to users.

### Support Tickets
Manage user inquiries in the **Tickets** dashboard.
- **Priority**: Tickets are ranked from Normal to Urgent.
- **Replies**: Responding to a ticket sends an email to the user automatically.
- **Internal Notes**: Use these to leave comments for other admins that the user cannot see.

---

## 5. System Settings

### Maintenance Mode
If you need to perform system upgrades:
1. Go to **Settings > System**.
2. Toggle **Maintenance Mode** to ON.
3. Users will see a maintenance message, and most features will be disabled.

### Feature Flags
Enable or disable features platform-wide without a code deployment.
- `registration_open`: Set to OFF to stop new signups.
- `google_drive`: Disable Drive integration if the API is experiencing issues.

---

## 6. Security & Auditing

### Audit Log
The Audit Log is a permanent record of all admin activity. Use it to:
- Investigate who changed a user's plan.
- Review recent configuration changes.
- Ensure compliance with internal security policies.

### AI Provider Keys
Managed AI keys for paid plans are updated in **Settings > API Providers**. After updating a key, always use the **Test Connection** button to verify it's working correctly.
