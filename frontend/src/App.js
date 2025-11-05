import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ProductList from "./view/Product/ProductList";
import AddProduct from "./view/Product/AddProduct";
import EditProduct from "./view/Product/EditProduct";

export default function App() {
  return (
    <Router>
      <div className="bg-gray-50 min-h-screen font-sans">
        {/* Navbar */}
        <nav className="bg-white shadow-sm fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
            <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-wide">
              CoolShop 
            </Link>
            <div className="flex space-x-6 text-gray-700 font-medium">
              <Link to="/" className="hover:text-blue-500 transition">Trang chủ</Link>
              <Link to="/add" className="hover:text-blue-500 transition">Thêm sản phẩm</Link>
            </div>
          </div>
        </nav>

        <div className="pt-24 px-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/add" element={<AddProduct />} />
            <Route path="/edit/:id" element={<EditProduct />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
