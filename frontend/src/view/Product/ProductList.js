import React, { useEffect, useState } from "react";
import { getAllProducts, deleteProduct, getAllCategories } from "../../api";
import { Link } from "react-router-dom";
import Session from "../../Session/session";
import Header from "../Header/Header";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [visibleCounts, setVisibleCounts] = useState({});
  const isAdmin = Session.isAdmin();
  const user = Session.getUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const prodData = await getAllProducts();
      const catData = await getAllCategories();
      setProducts(prodData);
      setCategories(catData);

      const initialCounts = {};
      catData.forEach((cat) => (initialCounts[cat.id] = 3));
      initialCounts["uncategorized"] = 3;
      setVisibleCounts(initialCounts);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
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
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`🛒 Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleLogout = () => {
    Session.logout();
    window.location.reload();
  };

  const handleLoadMore = (catId) => {
    setVisibleCounts((prev) => ({ ...prev, [catId]: prev[catId] + 3 }));
  };

  const handleCollapse = (catId) => {
    setVisibleCounts((prev) => ({ ...prev, [catId]: 3 }));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const categorizedProducts = categories.map((cat) => {
    let catProducts = [];
    if (cat.description) {
      const keywords = cat.description
        .split(";")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k);
      catProducts = filteredProducts.filter((p) =>
        keywords.some((kw) => p.name.toLowerCase().includes(kw))
      );
    }
    return { ...cat, products: catProducts };
  });

  const uncategorized = filteredProducts.filter(
    (p) => !categorizedProducts.some((cat) => cat.products.some((prod) => prod.id === p.id))
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        user={user}
        handleLogout={handleLogout}
        onSearch={(term) => setSearchName(term)}
        products={products} // Truyền products cho Header để gợi ý search
      />

      {/* Banner */}
      <div className="relative w-full h-64 sm:h-80 lg:h-[400px] overflow-hidden mt-20 mb-10">
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

      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {categorizedProducts.map(
          (cat) =>
            cat.products.length > 0 && (
              <div key={cat.id}>
                <h2 className="text-3xl font-bold mb-6">{cat.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {cat.products
                    .slice(0, visibleCounts[cat.id] || 3)
                    .map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        handleAddToCart={handleAddToCart}
                        handleDelete={handleDelete}
                        isAdmin={isAdmin}
                      />
                    ))}
                </div>
                <div className="flex justify-center mt-5 gap-4">
                  {visibleCounts[cat.id] < cat.products.length && (
                    <button
                      onClick={() => handleLoadMore(cat.id)}
                      className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
                    >
                      Xem thêm ▼
                    </button>
                  )}
                  {visibleCounts[cat.id] > 3 && (
                    <button
                      onClick={() => handleCollapse(cat.id)}
                      className="bg-gray-300 text-black px-6 py-2 rounded-full hover:bg-gray-400 transition"
                    >
                      Thu gọn ▲
                    </button>
                  )}
                </div>
              </div>
            )
        )}

        {uncategorized.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Khác</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {uncategorized
                .slice(0, visibleCounts["uncategorized"] || 3)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    handleAddToCart={handleAddToCart}
                    handleDelete={handleDelete}
                    isAdmin={isAdmin}
                  />
                ))}
            </div>
            <div className="flex justify-center mt-5 gap-4">
              {visibleCounts["uncategorized"] < uncategorized.length && (
                <button
                  onClick={() => handleLoadMore("uncategorized")}
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
                >
                  Xem thêm ▼
                </button>
              )}
              {visibleCounts["uncategorized"] > 3 && (
                <button
                  onClick={() => handleCollapse("uncategorized")}
                  className="bg-gray-300 text-black px-6 py-2 rounded-full hover:bg-gray-400 transition"
                >
                  Thu gọn ▲
                </button>
              )}
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 text-lg">
            🛒 Không tìm thấy sản phẩm nào.
          </div>
        )}
      </div>
    </div>
  );
}

// Resolve image URL for products:
// - If image is an absolute URL (http/https) -> keep it
// - If image starts with '/' -> treat as absolute path
// - Otherwise, assume it's stored in frontend's `public/images` and prefix `/images/`
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png'; // optional fallback
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return encodeURI(trimmed);
  return `/images/${encodeURI(trimmed)}`;
};

const ProductCard = ({ product, handleAddToCart, handleDelete, isAdmin }) => (
  <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col">
    <div className="relative overflow-hidden h-64">
      <img
        src={resolveImage(product.image)}
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
      <div className="flex flex-col gap-2 mt-5">
        <button
          onClick={() => handleAddToCart(product)}
          className="w-full text-center text-sm font-medium text-white bg-green-500 px-4 py-2 rounded-full hover:bg-green-600 transition"
        >
          🛒 Thêm vào giỏ
        </button>
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
);
