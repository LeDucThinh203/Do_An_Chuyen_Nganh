// src/view/Product/ProductList.js
import React, { useEffect, useState, useRef } from "react";
import { getAllProducts, deleteProduct, getAllCategories, getAllSizes, getAllProductSizes } from "../../api";
import { Link, useNavigate } from "react-router-dom";
import { ProductGridSkeleton, SkeletonBlock } from "../common/Skeletons";
import Session from "../../Session/session";
import AdminSupportChatWidget from "../Admin/AdminSupportChatWidget";
import ThemeToggleBtn from "../common/ThemeToggleBtn";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryVisibleCounts, setCategoryVisibleCounts] = useState({});

  const navigate = useNavigate();
  const user = Session.getUser();
  const isAdmin = Session.isAdmin();

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    } finally {
      setLoading(false);
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
    const result = availableProductSizes.map(ps => {
      const size = sizes.find(s => s.id === ps.size_id);
      const stock = Number(ps.stock ?? 0);
      return size ? { id: ps.id, size: size.size, stock } : null;
    }).filter(Boolean);
    return result;
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

    // Tính giá sau giảm
    const discount = Number(product.discount_percent || 0);
    const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        alert(`❌ Bạn đã thêm tối đa ${stock} sản phẩm size ${selectedSize} (đã hết trong kho)!`);
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
        onResetFilters={handleResetFilters}
        cartCount={cartCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        
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
            {/* HERO VIDEO SHOWCASE WITH FLOATING BUBBLE METRICS */}
            <section className="relative w-full h-[460px] sm:h-[520px] lg:h-[560px] rounded-3xl overflow-hidden mb-12 shadow-2xl border border-slate-200/60 group">
              <video
                src="https://media3.coolmate.me/uploads/videos/banner_chaybo_coolfast.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
              />
              
              {/* Premium Subtle Gradient Overlay - Anchored at the bottom so video is completely visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-4 sm:p-8 lg:p-10 pointer-events-none">
                <div className="max-w-2xl bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-3 sm:space-y-4 pointer-events-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 text-xs font-bold shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>⚡ BỘ SƯU TẬP THỂ THAO 2026 • PRO PERFORMANCE</span>
                  </div>

                  <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight drop-shadow-md">
                    Bứt Phá Giới Hạn •{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300">
                      Tự Tin Tỏa Sáng
                    </span>
                  </h1>

                  <p className="text-slate-200 text-xs sm:text-sm font-medium max-w-xl drop-shadow line-clamp-2 sm:line-clamp-none">
                    Khám phá chất liệu vải thoáng khí Dry-Fit siêu nhẹ, co giãn 4 chiều kháng khuẩn cho cảm giác thoải mái trọn vẹn cả ngày dài.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => scrollToSection('product-sections')}
                      className="px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-600/40 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      <span>Khám Phá Mua Sắm</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>

                    <button
                      onClick={() => scrollToSection('featured-row')}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md text-white font-bold text-xs sm:text-sm rounded-full border border-white/30 hover:border-white/60 transition-all duration-200 flex items-center gap-1.5 hover:scale-105"
                    >
                      <span>Ưu Đãi Hot Hôm Nay 🔥</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* INTERACTIVE BUBBLE METRICS STRIP */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-12">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20 group-hover:scale-110 transition flex-shrink-0">
                  🚀
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-base sm:text-lg">2 Giờ</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Hỏa tốc</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Giao nội thành siêu nhanh</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20 group-hover:scale-110 transition flex-shrink-0">
                  🔄
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-base sm:text-lg">60 Ngày</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Đổi trả</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Miễn phí tận nơi 100%</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20 group-hover:scale-110 transition flex-shrink-0">
                  💎
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-base sm:text-lg">50,000+</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Athletes</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Vận động viên tin dùng</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 sm:p-5 rounded-3xl border border-purple-200/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition flex items-center gap-3.5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xl shadow-md shadow-purple-500/20 group-hover:scale-110 transition flex-shrink-0">
                  🎁
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-base sm:text-lg">CoolClub</span>
                    <span className="text-[10px] font-bold text-purple-600 uppercase">VIP</span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">Tích điểm & giảm giá 10%</p>
                </div>
              </div>
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
                  Đang hiển thị: <b className="text-slate-800 font-bold">{filteredProducts.length}</b> sản phẩm
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
            <div id="product-sections" className="space-y-16">
              
              {/* FEATURED / SALE PRODUCTS ROW */}
              {featuredProducts.length > 0 && (
                <div id="featured-row" className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50/70 via-red-50/40 to-white border border-rose-100/80 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/30">
                        🔥
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                          Sản Phẩm Giảm Giá Nổi Bật
                        </h2>
                        <p className="text-xs text-rose-600 font-bold tracking-wide">
                          ƯU ĐÃI ĐẾN 50% • SỐ LƯỢNG CÓ HẠN
                        </p>
                      </div>
                    </div>
                    
                    <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                      Flash Sale Đang Diễn Ra
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
                  <div key={cat.id} className="relative space-y-6">
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

      </main>

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

  const handleLogoClick = async () => {
    setSearchTerm("");
    setSuggestions([]);
    if (onSearch) onSearch("");
    if (onResetFilters) {
      await onResetFilters();
    }
    navigate("/");
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
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[12px] sm:text-xs py-1.5 px-4 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center justify-center bg-blue-500/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Ưu đãi
            </span>
            <span>🔥 FREESHIP TOÀN QUỐC CHO ĐƠN TỪ 299K • ĐỔI TRẢ 60 NGÀY TẬN NƠI</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
            <span className="hover:text-white transition cursor-pointer">Hotline: 1900 272737</span>
            <span className="text-slate-600">•</span>
            <span className="hover:text-white transition cursor-pointer">Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navbar */}
      <nav className="glass-nav border-b border-slate-200/70 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Logo */}
          <div onClick={handleLogoClick} className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0">
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
          </div>

          {/* Search Box with Suggestions */}
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm áo thể thao, quần chạy, phụ kiện..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
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
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 rounded-full transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg transition duration-200"
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

/* LUXURY PRODUCT CARD COMPONENT */
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
      
      {/* Product Image Box */}
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

        {/* Badges Top Left & Right */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discount > 0 && (
            <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full shadow-md shadow-red-500/25 tracking-wide">
              -{Math.round(discount)}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md">
              HOT
            </span>
          )}
        </div>

        {/* Quick Size Overlay Slider */}
        <div
          className={`absolute inset-x-2 bottom-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white p-2.5 transition-all duration-300 ease-out z-10 ${
            overlayOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
            <span>Chọn kích cỡ (Size):</span>
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

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-600 transition leading-snug h-8 sm:h-10"
            onClick={() => handleImageClick(product.id)}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Pricing Row */}
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

        {/* Action button */}
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