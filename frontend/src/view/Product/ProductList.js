// src/view/Product/ProductList.js
import React, { useEffect, useState, useRef } from "react";
import { getAllProducts, deleteProduct, getAllCategories, getAllSizes, getAllProductSizes } from "../../api";
import { Link, useNavigate } from "react-router-dom";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [visibleCounts, setVisibleCounts] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});

  const navigate = useNavigate();
  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodData, catData, sizesData, productSizesData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllSizes(),
        getAllProductSizes()
      ]);
      
      setProducts(prodData);
      setCategories(catData);
      setSizes(sizesData);
      setProductSizes(productSizesData);

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

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const getAvailableSizes = (productId) => {
    const availableProductSizes = productSizes.filter(ps => ps.product_id === productId);
    return availableProductSizes.map(ps => {
      const size = sizes.find(s => s.id === ps.size_id);
      return size ? { id: ps.id, size: size.size } : null;
    }).filter(Boolean);
  };

  const handleAddToCart = (product) => {
    const selectedSize = selectedSizes[product.id];
    
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn size trước khi thêm vào giỏ hàng!");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        size: selectedSize,
        quantity: 1 
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`🛒 Đã thêm "${product.name}" (Size: ${selectedSize}) vào giỏ hàng!`);
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

  const handleSearch = (term) => {
    setSearchName(term);
    setIsSearching(term.trim() !== "");
  };

  const handleImageClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchName.toLowerCase())
  );

  // Phân loại sản phẩm theo danh mục (cả khi đang tìm kiếm)
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
    (p) =>
      !categorizedProducts.some((cat) =>
        cat.products.some((prod) => prod.id === p.id)
      )
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products}
        onSearch={handleSearch}
      />

      <div className="relative w-full h-64 sm:h-80 lg:h-[400px] overflow-hidden mt-20 mb-4">
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

      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 mb-10 flex justify-end">
          <button
            onClick={() => navigate("/add")}
            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            ➕ Thêm sản phẩm
          </button>
        </div>
      )}

      {/* Khi đang tìm kiếm, hiển thị theo danh mục */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-10">
        {isSearching && (
          <h2 className="text-3xl font-bold mb-6">
            Kết quả tìm kiếm cho "{searchName}"
          </h2>
        )}

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
                        availableSizes={getAvailableSizes(product.id)}
                        selectedSize={selectedSizes[product.id]}
                        onSizeSelect={handleSizeSelect}
                        handleAddToCart={handleAddToCart}
                        handleDelete={handleDelete}
                        handleImageClick={handleImageClick}
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
                    availableSizes={getAvailableSizes(product.id)}
                    selectedSize={selectedSizes[product.id]}
                    onSizeSelect={handleSizeSelect}
                    handleAddToCart={handleAddToCart}
                    handleDelete={handleDelete}
                    handleImageClick={handleImageClick}
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

        {/* Nếu không tìm thấy sản phẩm */}
        {isSearching &&
          filteredProducts.length === 0 && (
            <p className="text-gray-500 text-lg text-center py-10">
              🛒 Không tìm thấy sản phẩm nào.
            </p>
          )}
      </div>
    </div>
  );
}

/* Header và ProductCard giữ nguyên */
function Header({ user, handleLogout, products = [], onSearch }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef();
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = products
      .filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6);
    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (name) => {
    setSearchTerm(name);
    setSuggestions([]);
    if (onSearch) onSearch(name);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (onSearch) onSearch(searchTerm);
    }
  };

  const handleLogoClick = () => {
    setSearchTerm("");
    if (onSearch) onSearch("");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <span
            onClick={handleLogoClick}
            className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-wide cursor-pointer"
          >
            CoolShop
          </span>
        </div>

        <div className="relative w-1/2 sm:w-2/5 md:w-1/2" ref={searchRef}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 z-50 max-h-64 overflow-y-auto">
              {suggestions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectSuggestion(p.name)}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 text-sm text-left">
                    <p className="truncate">{p.name}</p>
                    <p className="text-red-600">
                      {Number(p.price).toLocaleString()} ₫
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-5 text-gray-700 font-medium">
          <Link to="/cart" className="hover:text-yellow-500 transition">
            🛒 Giỏ hàng
          </Link>

          {user?.username ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 hover:text-blue-500 transition font-medium"
              >
                Xin chào,<span>{user.username}</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md py-2 z-[9999] text-left">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                    >
                      🛠 Thông tin tài khoản quản trị viên
                    </Link>
                  )}
                  {user.role === "user" && (
                    <Link
                      to="/user"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                    >
                      👤 Thông tin tài khoản người dùng
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-red-600"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-500 transition">
                Login
              </Link>
              <Link to="/register" className="hover:text-green-500 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const ProductCard = ({ 
  product, 
  availableSizes, 
  selectedSize, 
  onSizeSelect, 
  handleAddToCart, 
  handleDelete, 
  handleImageClick, 
  isAdmin 
}) => {
  const discountedPrice = product.khuyen_mai > 0 
    ? product.price - (product.price * product.khuyen_mai / 100)
    : product.price;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col relative group">
      {/* Badge NEW nếu sản phẩm mới */}
      <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
        NEW
      </div>

      {/* Image Container */}
      <div 
        className="relative overflow-hidden cursor-pointer bg-gray-100"
        onClick={() => handleImageClick(product.id)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-80 object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        
        {/* Overlay nút Add to Cart khi hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
            disabled={availableSizes.length > 0 && !selectedSize}
            className={`w-full text-center text-sm font-medium px-4 py-3 rounded-lg transition ${
              availableSizes.length > 0 && !selectedSize
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {availableSizes.length > 0 && !selectedSize ? "Chọn size" : "Thêm nhanh vào giỏ hàng +"}
          </button>
        </div>
      </div>

      {/* Size Selection - Đặt ngay dưới hình ảnh */}
      {availableSizes.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2">
            {availableSizes.map((sizeObj) => (
              <button
                key={sizeObj.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSizeSelect(product.id, sizeObj.size);
                }}
                className={`min-w-[45px] px-3 py-2 text-sm font-medium border rounded-md transition ${
                  selectedSize === sizeObj.size
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
                }`}
              >
                {sizeObj.size}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            className="text-base font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600 line-clamp-2"
            onClick={() => handleImageClick(product.id)}
          >
            {product.name}
          </h3>
          
          {/* Price Section */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {discountedPrice.toLocaleString()}₫
            </span>
            {product.khuyen_mai > 0 && (
              <>
                <span className="text-sm font-bold text-white bg-red-500 px-2 py-0.5 rounded">
                  -{product.khuyen_mai}%
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {Number(product.price).toLocaleString()}₫
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <Link
              to={`/edit/${product.id}`}
              className="flex-1 text-center text-sm font-medium text-white bg-blue-500 px-3 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Sửa
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product.id);
              }}
              className="flex-1 text-center text-sm font-medium text-white bg-red-500 px-3 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Session = {
  setUser(id, username, role = "user", email = "") {
    const user = { id, username, role, email };
    localStorage.setItem("user", JSON.stringify(user));
  },
  isLoggedIn() {
    return localStorage.getItem("user") !== null;
  },
  isAdmin() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role === "admin";
  },
  getUser() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.username ? user : null;
  },
  logout() {
    localStorage.removeItem("user");
  }
};