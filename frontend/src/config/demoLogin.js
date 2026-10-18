export const demoLoginEnabled = process.env.REACT_APP_ENABLE_DEMO_LOGIN === "true";

export const demoLoginAccounts = demoLoginEnabled
  ? [
      {
        label: "Đăng nhập Admin",
        email: process.env.REACT_APP_DEMO_ADMIN_EMAIL || "",
        password: process.env.REACT_APP_DEMO_ADMIN_PASSWORD || "",
      },
      {
        label: "Đăng nhập User",
        email: process.env.REACT_APP_DEMO_USER_EMAIL || "",
        password: process.env.REACT_APP_DEMO_USER_PASSWORD || "",
      },
    ].filter((account) => account.email && account.password)
  : [];
