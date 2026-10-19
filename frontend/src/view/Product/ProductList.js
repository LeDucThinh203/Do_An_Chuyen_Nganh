// src/view/Product/ProductList.js
import React, { lazy, Suspense, useEffect, useMemo, useState, useRef } from "react";
import { getStorefrontPage, deleteProduct } from "../../api";
import { Link, useNavigate } from "react-router-dom";
import { ProductGridSkeleton, SkeletonBlock } from "../common/Skeletons";
import Session from "../../Session/session";
import ThemeToggleBtn from "../common/ThemeToggleBtn";
import ProductCard from "./ProductCard";

const AdminSupportChatWidget = lazy(() => import("../Admin/AdminSupportChatWidget"));

const HOME_STORE_CACHE_KEY = "coolshop-storefront-home-v1";

const readStorefrontCache = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const writeStorefrontCache = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The page still works when browser storage is unavailable or full.
  }
};

export default function ProductList() {
  const [initialCache] = useState(() => readStorefrontCache(HOME_STORE_CACHE_KEY));
  const [products, setProducts] = useState(() => initialCache?.data || []);
  const [categories, setCategories] = useState(() => initialCache?.categories || []);
  const [productSizes, setProductSizes] = useState(() => initialCache?.productSizes || []);
  const [searchName, setSearchName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [cartCount, setCartCount] = useState(0);
  const [cartNotice, setCartNotice] = useState(null);
  const cartNoticeTimer = useRef(null);
  const [loading, setLoading] = useState(() => !initialCache);
  const [categoryVisibleCounts, setCategoryVisibleCounts] = useState({});
  const [nextCursor, setNextCursor] = useState(() => initialCache?.pagination?.nextCursor || null);
  const [hasMoreProducts, setHasMoreProducts] = useState(() => Boolean(initialCache?.pagination?.hasMore));
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);

  const navigate = useNavigate();
  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, []);

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

  const fetchData = async () => {
    const cached = readStorefrontCache(HOME_STORE_CACHE_KEY);
    if (cached) {
      setProducts(cached.data || []);
      setCategories(cached.categories || []);
      setProductSizes(cached.productSizes || []);
      setNextCursor(cached.pagination?.nextCursor || null);
      setHasMoreProducts(Boolean(cached.pagination?.hasMore));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const productPage = await getStorefrontPage({ limit: 24 });
      setProducts(productPage.data || []);
      setNextCursor(productPage.pagination?.nextCursor || null);
      setHasMoreProducts(Boolean(productPage.pagination?.hasMore));
      setCategories(productPage.categories || []);
      setProductSizes(productPage.productSizes || []);
      writeStorefrontCache(HOME_STORE_CACHE_KEY, productPage);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!nextCursor || loadingMoreProducts) return;
    try {
      setLoadingMoreProducts(true);
      const page = await getStorefrontPage({ limit: 24, cursor: nextCursor });
      setProducts((current) => [...current, ...(page.data || [])]);
      setProductSizes((current) => [...current, ...(page.productSizes || [])]);
      setNextCursor(page.pagination?.nextCursor || null);
      setHasMoreProducts(Boolean(page.pagination?.hasMore));
    } catch (err) {
      console.error("Không thể tải thêm sản phẩm:", err);
    } finally {
      setLoadingMoreProducts(false);
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

  const productSizesByProduct = useMemo(() => {
    const grouped = new Map();
    for (const item of productSizes) {
      const key = String(item.product_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return grouped;
  }, [productSizes]);

  const getAvailableSizes = (productId) => (productSizesByProduct.get(String(productId)) || [])
    .filter((item) => item.size != null)
    .map((item) => ({ id: item.id, size: item.size, stock: Number(item.stock ?? 0) }));

  const getStockForSize = (productId, sizeName) => {
    const match = (productSizesByProduct.get(String(productId)) || []).find((item) => item.size === sizeName);
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

    // Tính giá sau giảm
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

  const handleSearch = (term) => {
    setSearchName(term);
    setIsSearching(term.trim() !== "");
  };

  const handleImageClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchName.toLowerCase());
    
    // Lọc theo khoảng giá
    const discount = Number(p.discount_percent || 0);
    const finalPrice = discount > 0 ? p.price * (1 - discount / 100) : p.price;
    const matchesPrice = finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    
    // Lọc theo danh mục
    const matchesCategory = selectedCategory === "all" || String(p.category_id) === String(selectedCategory);
    
    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    const discountA = Number(a.discount_percent || 0);
    const discountB = Number(b.discount_percent || 0);
    const priceA = discountA > 0 ? a.price * (1 - discountA / 100) : a.price;
    const priceB = discountB > 0 ? b.price * (1 - discountB / 100) : b.price;
    
    if (sortOrder === "price-asc") return priceA - priceB;
    if (sortOrder === "price-desc") return priceB - priceA;
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    return 0; // default
  });

  // Featured products: những sản phẩm đang giảm giá
  const featuredProducts = filteredProducts
    .filter((p) => Number(p.discount_percent || 0) > 0)
    .slice(0, 5);
  // Phân loại sản phẩm theo danh mục
  const categorizedProducts = categories.map((cat) => {
    const catProducts = filteredProducts.filter((p) => p.category_id === cat.id);
    return { ...cat, products: catProducts };
  }).filter(cat => cat.products.length > 0);

  useEffect(() => {
    setCategoryVisibleCounts((prev) => {
      const next = { ...prev };
      categorizedProducts.forEach((cat) => {
        if (!next[cat.id]) {
          next[cat.id] = 4;
        } else {
          next[cat.id] = Math.min(next[cat.id], cat.products.length || 4);
        }
      });
      return next;
    });
  }, [categorizedProducts]);

  const handleLoadMoreCategory = (categoryId) => {
    setCategoryVisibleCounts((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] || 4) + 4,
    }));
  };

  const handleCollapseCategory = (categoryId) => {
    setCategoryVisibleCounts((prev) => ({
      ...prev,
      [categoryId]: 4,
    }));
  };

  const handleResetFilters = async () => {
    setSelectedCategory("all");
    setPriceRange([0, 5000000]);
    setSortOrder("default");
    setSearchName("");
    setIsSearching(false);
    await fetchData();
  };

  const handleReturnHome = () => {
    setSelectedCategory("all");
    setPriceRange([0, 5000000]);
    setSortOrder("default");
    setSearchName("");
    setIsSearching(false);
  };

  const handleQuickPrice = (min, max) => {
    setPriceRange([min, max]);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-transparent min-h-screen overflow-x-hidden">
      {/* Elevated Glass Header */}
      <Header
        user={user}
        handleLogout={handleLogout}
        products={products}
        onSearch={handleSearch}
        onResetFilters={handleReturnHome}
        cartCount={cartCount}
      />

      {/* Main Container */}
      <main className="store-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-32 pb-16">
        
        {loading ? (
          <div className="space-y-8">
            <SkeletonBlock className="w-full h-72 sm:h-96 lg:h-[480px] rounded-3xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
            </div>
            <ProductGridSkeleton count={8} />
          </div>
        ) : (
          <>
            <section className="home-video-banner" aria-label="Giới thiệu CoolShop">
              <div className="home-video-banner__content">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">CoolShop · Đồ thể thao</span>
                <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Sẵn sàng cho trận đấu tiếp theo.
                </h1>
                <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
                  Chọn trang phục, giày và phụ kiện phù hợp với phong cách thi đấu của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => scrollToSection("product-sections")}
                  className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-cyan-50"
                >
                  Khám phá sản phẩm <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>

            <section className="store-benefits" aria-label="Hỗ trợ mua sắm">
              <div><span className="store-benefits__icon">⌕</span><p><b>Tìm đúng món đồ</b><small>Lọc theo danh mục và khoảng giá</small></p></div>
              <div><span className="store-benefits__icon">↔</span><p><b>Chọn size rõ ràng</b><small>Xem trạng thái còn hàng ngay trên thẻ</small></p></div>
              <div><span className="store-benefits__icon">✓</span><p><b>Thanh toán thuận tiện</b><small>Chọn COD hoặc VNPay khi đặt hàng</small></p></div>
            </section>

            {/* ADMIN BAR (If Admin) */}
            {isAdmin && (
              <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛠️</span>
                  <div>
                    <h3 className="font-bold text-sm">Bảng Điều Khiển Quản Trị</h3>
                    <p className="text-xs text-blue-200">Quản lý kho hàng, tạo sản phẩm mới và cập nhật giá</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/add", { state: { returnTo: "/" } })}
                  className="bg-white text-blue-900 hover:bg-blue-50 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow transition flex items-center gap-2"
                >
                  <span>➕ Thêm Sản Phẩm Mới</span>
                </button>
              </div>
            )}

            {/* CATEGORY PILLS BAR */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh mục sản phẩm</h3>
                <span className="text-xs text-slate-500 font-medium">Chọn nhanh danh mục yêu thích</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === "all"
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-102"
                      : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  <span>⚡ Tất cả sản phẩm</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === "all" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const isSelected = String(selectedCategory) === String(cat.id);
                  const count = products.filter((p) => p.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(String(cat.id))}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-102"
                          : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SMART FILTER & SORT TOOLBAR */}
            <div className="mb-10 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                
                {/* Price quick chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1">Khoảng giá:</span>
                  <button
                    onClick={() => handleQuickPrice(0, 5000000)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      priceRange[0] === 0 && priceRange[1] === 5000000
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    Tất cả giá
                  </button>
                  <button
                    onClick={() => handleQuickPrice(0, 200000)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      priceRange[0] === 0 && priceRange[1] === 200000
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    Dưới 200.000đ
                  </button>
                  <button
                    onClick={() => handleQuickPrice(200000, 500000)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      priceRange[0] === 200000 && priceRange[1] === 500000
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    200k - 500k
                  </button>
                  <button
                    onClick={() => handleQuickPrice(500000, 5000000)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      priceRange[0] === 500000 && priceRange[1] === 5000000
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    Trên 500.000đ
                  </button>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá: Thấp đến Cao ↗</option>
                    <option value="price-desc">Giá: Cao đến Thấp ↘</option>
                    <option value="name-asc">Tên sản phẩm: A - Z</option>
                    <option value="name-desc">Tên sản phẩm: Z - A</option>
                  </select>
                </div>
              </div>

              {/* Status info bar */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {hasMoreProducts ? "Đã tải" : "Đang hiển thị"}: <b className="text-slate-800 font-bold">{filteredProducts.length}{hasMoreProducts ? "+" : ""}</b> sản phẩm
                  {isSearching && ` cho từ khóa "${searchName}"`}
                </span>
                
                <button
                  onClick={handleResetFilters}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
                >
                  <span>↺</span>
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            </div>

            {/* MAIN SECTIONS WRAPPER */}
            <div id="product-sections" className="space-y-12">
              
              {/* FEATURED / SALE PRODUCTS ROW */}
              {featuredProducts.length > 0 && (
                <div id="featured-row" className="sale-section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/30">
                        🔥
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                          Sản phẩm đang ưu đãi
                        </h2>
                        <p className="text-xs text-rose-600 font-bold tracking-wide">
                          Mức giá ưu đãi được cập nhật theo từng sản phẩm
                        </p>
                      </div>
                    </div>
                    
                    <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                      {featuredProducts.length} sản phẩm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {featuredProducts.map((product) => (
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
                </div>
              )}

              {/* SEARCH RESULTS HEADER */}
              {isSearching && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-blue-950">
                    🔍 Kết quả tìm kiếm cho: "{searchName}"
                  </h2>
                  <button
                    onClick={() => {
                      setSearchName("");
                      setIsSearching(false);
                    }}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Xóa tìm kiếm ✕
                  </button>
                </div>
              )}

              {/* CATEGORIZED PRODUCTS SECTIONS */}
              {categorizedProducts.map((cat) =>
                cat.products.length > 0 && (
                  <div key={cat.id} className="store-category-section relative space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600"></div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                          {cat.name}
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {cat.products.length}
                        </span>
                      </div>

                      <Link
                        to={`/category/${cat.id}`}
                        className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                      >
                        <span>Xem tất cả</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                      {cat.products.slice(0, categoryVisibleCounts[cat.id] || 4).map((product) => (
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

                    {/* Load more category buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {(categoryVisibleCounts[cat.id] || 4) < cat.products.length && (
                        <button
                          onClick={() => handleLoadMoreCategory(cat.id)}
                          className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold shadow-sm hover:shadow transition flex items-center gap-2"
                        >
                          <span>Xem thêm {Math.min(4, cat.products.length - (categoryVisibleCounts[cat.id] || 4))} sản phẩm</span>
                          <span>↓</span>
                        </button>
                      )}

                      {(categoryVisibleCounts[cat.id] || 4) > 4 && (
                        <button
                          onClick={() => handleCollapseCategory(cat.id)}
                          className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition"
                        >
                          Thu gọn
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* No Products Found */}
              {isSearching && filteredProducts.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
                  <div className="text-5xl mb-4">🛒</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy sản phẩm phù hợp</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                    Không có sản phẩm nào khớp với từ khóa "{searchName}". Vui lòng thử từ khóa khác hoặc xóa bộ lọc.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-md hover:bg-blue-700 transition"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}

            </div>
          </>
        )}

        {hasMoreProducts && (
          <div className="flex justify-center px-4 pb-10">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMoreProducts}
              className="rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingMoreProducts ? "Đang tải..." : "Tải thêm sản phẩm"}
            </button>
          </div>
        )}

      </main>

      {cartNotice && (
        <div className={`cart-toast cart-toast--${cartNotice.tone}`} role="status" aria-live="polite">
          <span aria-hidden="true">{cartNotice.tone === "error" ? "!" : "✓"}</span>
          {cartNotice.message}
        </div>
      )}
      {isAdmin && <Suspense fallback={null}><AdminSupportChatWidget forceAdmin /></Suspense>}
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

/* Unified Header component for ProductList */
function Header({ user, handleLogout, products = [], onSearch, onResetFilters, cartCount = 0 }) {
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

  const handleLogoClick = () => {
    setSearchTerm("");
    setSuggestions([]);
    if (onSearch) onSearch("");
    if (onResetFilters) onResetFilters();
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <header className="store-header fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="store-header__promo bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[12px] sm:text-xs py-1.5 px-4 font-medium tracking-wide">
        <div className="store-header__promo-inner max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="store-header__promo-badge inline-flex items-center justify-center bg-blue-500/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Thông tin
            </span>
            <span>Thanh toán khi nhận hàng hoặc qua VNPay • Theo dõi đơn trong tài khoản</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
            <Link to="/cart" className="hover:text-white transition">Đơn hàng của tôi</Link>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navbar */}
      <nav className="store-header__nav glass-nav border-b border-slate-200/70 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="store-header__inner max-w-7xl mx-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2 sm:flex sm:h-20 sm:gap-6 sm:px-6 sm:py-0 lg:px-8">
          
          {/* Brand Logo */}
          <button type="button" onClick={handleLogoClick} aria-label="Về trang chủ" className="store-header__brand flex flex-shrink-0 items-center gap-2.5 border-0 bg-transparent p-0 text-left group">
            <div className="store-header__mark w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
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
          </button>

          {/* Search Box with Suggestions */}
          <div className="store-header__search relative col-span-2 min-w-0 max-w-md sm:col-span-1 sm:flex-1" ref={searchRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm áo thể thao, quần chạy, phụ kiện..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                className="store-header__input w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSuggestions([]);
                    if (onSearch) onSearch("");
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl mt-2 z-50 max-h-80 overflow-y-auto p-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">
                  Gợi ý sản phẩm
                </div>
                {suggestions.map((p) => {
                  const price = Number(p.price || 0);
                  const discount = Number(p.discount_percent || 0);
                  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
                  return (
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
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-bold text-rose-600">
                            {Math.round(finalPrice).toLocaleString()} đ
                          </span>
                          {discount > 0 && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {Math.round(price).toLocaleString()} đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="store-header__actions col-start-2 row-start-1 flex flex-shrink-0 items-center justify-self-end gap-1 sm:col-start-auto sm:row-start-auto sm:gap-4">
            {/* Theme Toggle Button */}
            <ThemeToggleBtn variant="navbar" />

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition duration-200 flex items-center justify-center group"
              title="Giỏ hàng"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-md shadow-red-500/30 badge-pulse">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/80 transition shadow-sm bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center uppercase shadow-sm">
                    {user.username ? user.username.charAt(0) : "U"}
                  </div>
                  <span className="hidden sm:inline-block text-xs sm:text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <span className="hidden md:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {user.role === "admin" ? "Admin" : "Member"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-400 font-medium">Tài khoản đăng nhập</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.username}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {user.role === "admin" ? "Quản trị viên hệ thống" : "Khách hàng thân thiết"}
                      </span>
                    </div>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="text-base">⚡</span>
                        <span>Trang Quản Trị (Admin)</span>
                      </Link>
                    )}

                    {user.role !== "admin" && (
                      <Link
                        to="/user"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="text-base">👤</span>
                        <span>Hồ sơ & Đơn mua</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-slate-100"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span className="text-base">🚪</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-2 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-100/70 hover:text-blue-600 sm:px-3.5 sm:text-sm"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg sm:inline-flex sm:text-sm"
                >
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
