// src/view/Product/ProductLoadMore.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProductsPage, getAllCategories, getAllSizes, deleteProduct } from "../../api";
import { ProductGridSkeleton, SkeletonBlock } from "../common/Skeletons";
import Session from "../../Session/session";
import AdminSupportChatWidget from "../Admin/AdminSupportChatWidget";
import ThemeToggleBtn from "../common/ThemeToggleBtn";
import ProductCard from "./ProductCard";

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
  const [cartNotice, setCartNotice] = useState(null);
  const cartNoticeTimer = useRef(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [sortOrder, setSortOrder] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productPage, catData, sizesData] = await Promise.all([
        getProductsPage({ limit: 24, categoryId: normalizedCategoryId }),
        getAllCategories(),
        getAllSizes()
      ]);
      setProducts(productPage.data || []);
      setNextCursor(productPage.pagination?.nextCursor || null);
      setHasMoreProducts(Boolean(productPage.pagination?.hasMore));
      setSizes(sizesData);
      setProductSizes(productPage.productSizes || []);
      
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

  const notifyCart = (message, tone = "success") => {
    window.clearTimeout(cartNoticeTimer.current);
    setCartNotice({ message, tone });
    cartNoticeTimer.current = window.setTimeout(() => setCartNotice(null), 2600);
  };

  useEffect(() => () => window.clearTimeout(cartNoticeTimer.current), []);

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
      notifyCart("Vui lòng chọn size trước khi thêm vào giỏ hàng.", "error");
      return;
    }

    const stock = getStockForSize(product.id, selectedSize);
    if (stock <= 0) {
      notifyCart("Size này đã hết hàng. Vui lòng chọn size khác.", "error");
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
        notifyCart(`Bạn đã đạt số lượng tối đa còn trong kho (${stock}, size ${selectedSize}).`, "error");
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
    notifyCart(`Đã thêm ${product.name} · Size ${selectedSize} vào giỏ hàng.`);
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
  const hasMore = visibleCount < filteredProducts.length || hasMoreProducts;

  const handleLoadMore = async () => {
    if (visibleCount < filteredProducts.length) {
      setVisibleCount(prev => prev + 8);
      return;
    }
    if (!nextCursor || loadingMoreProducts) return;
    try {
      setLoadingMoreProducts(true);
      const page = await getProductsPage({ limit: 24, categoryId: normalizedCategoryId, cursor: nextCursor });
      setProducts(current => [...current, ...(page.data || [])]);
      setProductSizes(current => [...current, ...(page.productSizes || [])]);
      setNextCursor(page.pagination?.nextCursor || null);
      setHasMoreProducts(Boolean(page.pagination?.hasMore));
      setVisibleCount(prev => prev + 8);
    } catch (err) {
      console.error("Không thể tải thêm sản phẩm:", err);
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  const handleCollapse = () => {
    setVisibleCount(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-transparent min-h-screen overflow-x-hidden">
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products.filter(p => String(p.category_id) === normalizedCategoryId)}
        onSearch={setSearchTerm}
        cartCount={cartCount}
      />

      <div className="category-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-32 pb-16">
        {loading ? (
          <div className="space-y-6">
            <SkeletonBlock className="h-12 w-1/3 rounded-2xl" />
            <SkeletonBlock className="h-6 w-1/4 rounded-xl" />
            <ProductGridSkeleton count={8} />
          </div>
        ) : (
          <>
            {/* Category Hero Header */}
            <div className="category-hero mb-8 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden">
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
                    <span>{filteredProducts.length}{hasMoreProducts ? "+" : ""} sản phẩm{hasMoreProducts ? " đã tải" : ""}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
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
                      {loadingMoreProducts
                        ? "Đang tải..."
                        : visibleCount < filteredProducts.length
                          ? `Xem thêm sản phẩm (${filteredProducts.length - visibleProducts.length} còn lại) ▼`
                          : "Tải thêm sản phẩm ▼"}
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
                {hasMoreProducts && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMoreProducts}
                    className="ml-3 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {loadingMoreProducts ? "Đang tải..." : "Tải thêm kết quả"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {cartNotice && (
        <div className={`cart-toast cart-toast--${cartNotice.tone}`} role="status" aria-live="polite">
          <span aria-hidden="true">{cartNotice.tone === "error" ? "!" : "✓"}</span>
          {cartNotice.message}
        </div>
      )}
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
              Thông tin
            </span>
            <span>Thanh toán khi nhận hàng hoặc qua VNPay • Theo dõi đơn trong tài khoản</span>
          </div>
        </div>
      </div>

      <nav className="glass-nav border-b border-slate-200/70 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2 sm:flex sm:h-20 sm:gap-6 sm:px-6 sm:py-0 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">
                COOLSHOP
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold -mt-1">
                Đồ thể thao
              </span>
            </div>
          </Link>

          <div className="relative col-span-2 min-w-0 max-w-md sm:col-span-1 sm:flex-1" ref={searchRef}>
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

          <div className="col-start-2 row-start-1 flex flex-shrink-0 items-center justify-self-end gap-1 sm:col-start-auto sm:row-start-auto sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggleBtn variant="navbar" />

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
                <Link to="/login" className="px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 sm:px-3.5 sm:text-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="hidden rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:inline-flex sm:text-sm">
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
