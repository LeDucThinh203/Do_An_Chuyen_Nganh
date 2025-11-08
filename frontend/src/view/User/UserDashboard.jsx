import React, { useState } from "react";
import UserInfo from "./UserInfo";
import ChangePassword from "./ChangePassword";
import ManageAddress from "./ManageAddress";
import Address from "./Address"; // import component mới

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("info"); // info | password | manageAddress | addressList

  const renderContent = () => {
    if (activeTab === "info") return <UserInfo />;
    if (activeTab === "password") return <ChangePassword />;
    if (activeTab === "manageAddress") return <ManageAddress />;
    if (activeTab === "addressList") return <Address />;
  };

  return (
    <div className="max-w-6xl mx-auto mt-20 flex gap-6">
      {/* Sidebar */}
      <div className="flex flex-col w-48 bg-gray-100 p-4 rounded shadow-md space-y-4">
        <button
          className={`p-2 rounded ${activeTab === "info" ? "bg-blue-600 text-white" : "hover:bg-blue-200"}`}
          onClick={() => setActiveTab("info")}
        >
          Thông tin người dùng
        </button>
        <button
          className={`p-2 rounded ${activeTab === "password" ? "bg-blue-600 text-white" : "hover:bg-blue-200"}`}
          onClick={() => setActiveTab("password")}
        >
          Đổi mật khẩu
        </button>
        <button
          className={`p-2 rounded ${activeTab === "manageAddress" ? "bg-blue-600 text-white" : "hover:bg-blue-200"}`}
          onClick={() => setActiveTab("manageAddress")}
        >
          Cập nhật địa chỉ
        </button>
        <button
          className={`p-2 rounded ${activeTab === "addressList" ? "bg-blue-600 text-white" : "hover:bg-blue-200"}`}
          onClick={() => setActiveTab("addressList")}
        >
          Danh sách địa chỉ
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
