// Show the demo shortcuts by default. Build-time environment variables can
// override these values when a deployment uses different test accounts.
export const demoLoginAccounts = [
  {
    label: "Đăng nhập Admin",
    email: process.env.REACT_APP_DEMO_ADMIN_EMAIL || "admin@admin.com",
    password: process.env.REACT_APP_DEMO_ADMIN_PASSWORD || "123456",
  },
  {
    label: "Đăng nhập User",
    email: process.env.REACT_APP_DEMO_USER_EMAIL || "user@user.com",
    password: process.env.REACT_APP_DEMO_USER_PASSWORD || "123456",
  },
];
