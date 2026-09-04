// src/view/Product/ProductLoadMore.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getAllProducts, getAllCategories, getAllSizes, getAllProductSizes, deleteProduct } from "../../api";
import { ProductGridSkeleton, SkeletonBlock } from "../common/Skeletons";
import Session from "../../Session/session";
import AdminSupportChatWidget from "../Admin/AdminSupportChatWidget";

export default function ProductLoadMore() {
  const { categoryId } = useParams();
  const normalizedCategoryId = String(categoryId);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(8);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [sortOrder, setSortOrder] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodData, catData, sizesData, productSizesData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
        getAllSizes(),
        getAllProductSizes()
      ]);
      
      setProducts(prodData);
      setSizes(sizesData);
      setProductSizes(productSizesData);
      
      const currentCategory = catData.find(c => String(c.id) === normalizedCategoryId);
      setCategory(currentCategory);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    } finally {
      setLoading(false);
    }
  }, [normalizedCategoryId]);

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, [fetchData]);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
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
      return size ? { id: ps.id, size: size.size, stock: Number(ps.stock ?? 0) } : null;
    }).filter(Boolean);
  };

  const getStockForSize = (productId, sizeName) => {
    const match = productSizes.find(ps => ps.product_id === productId && (sizes.find(s => s.id === ps.size_id)?.size === sizeName));
    return Number(match?.stock ?? 0);
  };

  const handleAddToCart = (product, sizeOverride = null) => {
    const selectedSize = sizeOverride || selectedSizes[product.id];
    
    if (!selectedSize) {
      alert("⚠️ Vui lòng chọn size trước khi thêm vào giỏ hàng!");
      return;
    }

    const stock = getStockForSize(product.id, selectedSize);
    if (stock <= 0) {
      alert("❌ Size này đã hết hàng. Vui lòng chọn size khác.");
      return;
    }

    const discount = Number(product.discount_percent || 0);
    const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        alert(`❌ Bạn đã thêm tối đa ${stock} sản phẩm size ${selectedSize}!`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        price: finalPrice,
        original_price: product.price,
        discount_percent: discount,
        size: selectedSize,
        quantity: 1 
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(`🛒 Đã thêm "${product.name}" (Size: ${selectedSize}) vào giỏ hàng!`);
  };

  const handleLogout = () => {
    Session.logout();
    navigate("/login");
  };

  const handleImageClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = String(p.category_id) === normalizedCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const discount = Number(p.discount_percent || 0);
    const finalPrice = discount > 0 ? p.price * (1 - discount / 100) : p.price;
    const matchesPrice = finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    
    return matchesCategory && matchesSearch && matchesPrice;
  }).sort((a, b) => {
    const discountA = Number(a.discount_percent || 0);
    const discountB = Number(b.discount_percent || 0);
    const priceA = discountA > 0 ? a.price * (1 - discountA / 100) : a.price;
    const priceB = discountB > 0 ? b.price * (1 - discountB / 100) : b.price;
    
    if (sortOrder === "price-asc") return priceA - priceB;
    if (sortOrder === "price-desc") return priceB - priceA;
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleCollapse = () => {
    setVisibleCount(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen overflow-x-hidden">
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products.filter(p => String(p.category_id) === normalizedCategoryId)}
        onSearch={setSearchTerm}
        cartCount={cartCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        {loading ? (
          <div className="space-y-6">
            <SkeletonBlock className="h-12 w-1/3 rounded-2xl" />
            <SkeletonBlock className="h-6 w-1/4 rounded-xl" />
            <ProductGridSkeleton count={8} />
          </div>
        ) : (
          <>
            {/* Category Hero Header */}
            <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                  <Link to="/" className="hover:text-white transition">Trang chủ</Link>
                  <span>›</span>
                  <span className="text-white">Danh mục</span>
                  <span>›</span>
                  <span className="text-blue-400 font-bold">{category?.name || "Danh mục"}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                      {category?.name || "Bộ sưu tập"}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1">
                      Khám phá những thiết kế thể thao hiện đại, chất liệu bền bỉ và thoải mái nhất.
                    </p>
                  </div>

                  <div className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{filteredProducts.length} Sản phẩm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Sắp xếp:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến Cao ↗</option>
                  <option value="price-desc">Giá: Cao đến Thấp ↘</option>
                  <option value="name-asc">Tên: A - Z</option>
                  <option value="name-desc">Tên: Z - A</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  onClick={() => navigate("/add", { state: { returnTo: `/category/${categoryId}` } })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <span>➕ Thêm sản phẩm vào danh mục</span>
                </button>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {visibleProducts.map((product) => (
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

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold text-sm shadow-xl shadow-blue-500/25 hover:scale-105 transition duration-200"
                    >
                      Xem thêm sản phẩm ({filteredProducts.length - visibleProducts.length} còn lại) ▼
                    </button>
                  </div>
                )}

                {/* Collapse Button */}
                {visibleCount > 8 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleCollapse}
                      className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold text-xs transition"
                    >
                      Thu gọn về 8 sản phẩm ▲
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
                <div className="text-5xl mb-4">🛒</div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có sản phẩm nào trong danh mục này</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Vui lòng quay lại sau hoặc khám phá các danh mục sản phẩm khác của chúng tôi.
                </p>
                <Link
                  to="/"
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-md hover:bg-blue-700 transition inline-block"
                >
                  Về trang chủ
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {isAdmin && <AdminSupportChatWidget forceAdmin />}
    </div>
  );
}

// Resolve image URL
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png';
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    const parts = trimmed.split('/');
    return parts.map((part, idx) => idx === 0 ? part : encodeURIComponent(part)).join('/');
  }
  return `/images/${encodeURIComponent(trimmed)}`;
};

/* Unified Header component */
function Header({ user, handleLogout, products = [], onSearch, cartCount = 0 }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef();
  const dropdownRef = useRef();
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
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[12px] sm:text-xs py-1.5 px-4 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center justify-center bg-blue-500/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Ưu đãi
            </span>
            <span>🔥 FREESHIP TOÀN QUỐC CHO ĐƠN TỪ 299K • ĐỔI TRẢ 60 NGÀY TẬN NƠI</span>
          </div>
        </div>
      </div>

      <nav className="glass-nav border-b border-slate-200/70 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">
                COOLSHOP
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold -mt-1">
                Pro Athletic
              </span>
            </div>
          </Link>

          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm trong danh mục..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl mt-2 z-50 max-h-80 overflow-y-auto p-2">
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/70 cursor-pointer transition"
                    onClick={() => handleSelectSuggestion(p.name)}
                  >
                    <img
                      src={resolveImage(p.image)}
                      alt={p.name}
                      onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                      className="w-11 h-11 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/cart"
              className="relative p-2.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition group"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-md shadow-red-500/30 badge-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/80 transition shadow-sm bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                    {user.username ? user.username.charAt(0) : "U"}
                  </div>
                  <span className="hidden sm:inline-block text-xs sm:text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                    {user.username}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50">
                    <Link
                      to={user.role === "admin" ? "/admin" : "/user"}
                      className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {user.role === "admin" ? "🛠️ Trang Quản Trị" : "👤 Hồ sơ cá nhân"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

/* ProductCard Component */
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
  const [overlayOpen, setOverlayOpen] = useState(false);

  const price = Number(product.price || 0);
  const discount = Number(product.discount_percent || 0);
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 hover:border-blue-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col w-full min-w-0 group">
      <div 
        className="relative overflow-hidden aspect-square cursor-pointer bg-slate-100"
        onClick={() => handleImageClick(product.id)}
        onMouseEnter={() => setOverlayOpen(true)}
        onMouseLeave={() => setOverlayOpen(false)}
      >
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          onError={(e) => { e.target.src = '/images/placeholder.png'; }}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
        />

        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md shadow-red-500/25">
              -{discount}%
            </span>
          </div>
        )}

        <div
          className={`absolute inset-x-2 bottom-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white p-2.5 transition-all duration-300 ease-out z-10 ${
            overlayOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] font-bold text-slate-300 mb-1.5">
            Chọn kích cỡ (Size):
          </div>

          {availableSizes.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((sizeObj) => {
                  const out = Number(sizeObj.stock) <= 0;
                  const isSelected = selectedSize === sizeObj.size;
                  return (
                    <button
                      key={sizeObj.id}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all ${
                        out 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed line-through' 
                          : isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-white/50'
                            : 'bg-white/20 text-white hover:bg-white/35'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (out) return;
                        onSizeSelect(product.id, sizeObj.size);
                      }}
                      aria-disabled={out}
                      title={out ? 'Hết hàng' : `Còn ${sizeObj.stock} sản phẩm`}
                    >
                      {sizeObj.size}
                    </button>
                  );
                })}
              </div>

              {selectedSize && (
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-1.5 rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  <span>🛒 Thêm vào giỏ hàng</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Đang cập nhật kích cỡ</div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-600 transition leading-snug h-8 sm:h-10"
            onClick={() => handleImageClick(product.id)}
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className={`text-sm sm:text-base font-black ${discount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {Math.round(finalPrice).toLocaleString()} đ
            </span>
            {discount > 0 && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through font-normal">
                {Math.round(price).toLocaleString()} đ
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
          {availableSizes.length > 0 && selectedSize ? (
            <button
              onClick={() => handleAddToCart(product)}
              className="flex-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs py-2 rounded-xl transition duration-200 flex items-center justify-center gap-1.5"
            >
              <span>🛒</span>
              <span>Thêm (Size {selectedSize})</span>
            </button>
          ) : (
            <button
              onClick={() => handleImageClick(product.id)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 rounded-xl border border-slate-200/60 transition flex items-center justify-center gap-1"
            >
              <span>Xem chi tiết</span>
              <span>→</span>
            </button>
          )}

          {isAdmin && (
            <div className="flex gap-1.5">
              <Link
                to={`/edit/${product.id}`}
                className="text-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-2 rounded-xl transition"
                title="Sửa sản phẩm"
              >
                ✏️
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product.id);
                }}
                className="text-center text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-2 rounded-xl transition"
                title="Xóa sản phẩm"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
