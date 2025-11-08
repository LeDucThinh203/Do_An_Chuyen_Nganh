import React, { useEffect, useState } from "react";
import { getAllProducts, deleteProduct } from "../../api";
import { Link } from "react-router-dom";
import Session from "../../Session/session";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const isAdmin = Session.isAdmin(); // Kiểm tra role admin

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error("Lấy danh sách sản phẩm thất bại:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("🗑️ Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Xóa sản phẩm thất bại:", err);
      }
    }
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`🛒 Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 15);
  };

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner Video */}
      <div className="relative w-full h-64 sm:h-80 lg:h-[400px] overflow-hidden mb-10">
        <video
          src="https://media3.coolmate.me/uploads/videos/banner_chaybo_coolfast.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <h1 className="text-white text-3xl sm:text-5xl font-bold uppercase tracking-wide text-center">
            Khám phá sản phẩm mới
          </h1>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight uppercase">
          Sản phẩm mới nhất
        </h2>
        {isAdmin && (
          <Link
            to="/add"
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
          >
            + Thêm sản phẩm
          </Link>
        )}
      </div>

      {/* Danh sách sản phẩm */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {visibleProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
          >
            <div className="relative overflow-hidden h-64">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 rounded-full">
                {Number(product.price).toLocaleString()} ₫
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-3">
                  {product.description || "Không có mô tả"}
                </p>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col gap-2 mt-5">
                {/* Nút thêm vào giỏ luôn hiển thị */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full text-center text-sm font-medium text-white bg-green-500 px-4 py-2 rounded-full hover:bg-green-600 transition"
                >
                  🛒 Thêm vào giỏ
                </button>

                {/* Admin mới thấy nút Sửa/Xóa */}
                {isAdmin && (
                  <div className="flex gap-3">
                    <Link
                      to={`/edit/${product.id}`}
                      className="flex-1 text-center text-sm font-medium text-white bg-blue-500 px-4 py-2 rounded-full hover:bg-blue-600 transition"
                    >
                      Sửa
                    </Link>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 text-center text-sm font-medium text-red-600 border border-red-600 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < products.length && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLoadMore}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
          >
            Xem thêm ▼
          </button>
        </div>
      )}

      {products.length === 0 && (
        <div className="col-span-full text-center py-20 text-gray-400 text-lg">
          🛒 Chưa có sản phẩm nào. Hãy thêm mới ngay!
        </div>
      )}
    </div>
  );
}
