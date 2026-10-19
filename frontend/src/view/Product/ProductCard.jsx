import React from "react";
import { Link } from "react-router-dom";

const resolveImage = (image) => {
  if (!image) return "/images/placeholder.png";
  const value = String(image).trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return encodeURI(value);
  return `/images/${encodeURIComponent(value)}`;
};

export default function ProductCard({
  product,
  availableSizes = [],
  selectedSize,
  onSizeSelect,
  handleAddToCart,
  handleDelete,
  handleImageClick,
  isAdmin,
}) {
  const price = Number(product.price || 0);
  const discount = Number(product.discount_percent || 0);
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const canPurchase = availableSizes.some((size) => Number(size.stock) > 0);
  const selectedSizeAvailable = availableSizes.some((size) => size.size === selectedSize && Number(size.stock) > 0);

  return (
    <article className="product-card group">
      <div className="product-card__media">
        <button
          type="button"
          className="product-card__image-link"
          onClick={() => handleImageClick(product.id)}
          aria-label={`Xem chi tiết ${product.name}`}
        >
          <img
            src={resolveImage(product.image)}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/placeholder.png";
            }}
          />
        </button>
        {discount > 0 && <span className="product-card__badge">-{Math.round(discount)}%</span>}
        {!canPurchase && <span className="product-card__stock">Tạm hết hàng</span>}
        <div className="product-card__size-overlay">
          <div className="product-card__sizes" aria-label="Chọn kích cỡ">
            <span className="product-card__size-label">Size</span>
            {availableSizes.length ? (
              availableSizes.map((size) => {
                const outOfStock = Number(size.stock) <= 0;
                const isSelected = selectedSize === size.size;
                return (
                  <button
                    key={size.id}
                    type="button"
                    disabled={outOfStock}
                    aria-pressed={isSelected}
                    aria-label={`${size.size}${outOfStock ? ", hết hàng" : `, còn ${size.stock}`}`}
                    title={outOfStock ? "Hết hàng" : `Còn ${size.stock} sản phẩm`}
                    onClick={() => onSizeSelect(product.id, size.size)}
                    className={`product-card__size${isSelected ? " is-selected" : ""}${outOfStock ? " is-unavailable" : ""}`}
                  >
                    {size.size}
                  </button>
                );
              })
            ) : (
              <span className="product-card__size-pending">Đang cập nhật</span>
            )}
          </div>
        </div>
      </div>

      <div className="product-card__body">
        <button
          type="button"
          className="product-card__name"
          onClick={() => handleImageClick(product.id)}
          title={product.name}
        >
          {product.name}
        </button>

        <div className="product-card__price-row">
          <span className={discount > 0 ? "product-card__price product-card__price--sale" : "product-card__price"}>
            {Math.round(finalPrice).toLocaleString("vi-VN")} ₫
          </span>
          {discount > 0 && <span className="product-card__old-price">{Math.round(price).toLocaleString("vi-VN")} ₫</span>}
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            disabled={!selectedSizeAvailable}
            onClick={() => handleAddToCart(product)}
            className="product-card__add"
          >
            {!canPurchase ? "Tạm hết hàng" : selectedSizeAvailable ? "Thêm vào giỏ" : "Chọn size để mua"}
          </button>
          {isAdmin && (
            <>
              <Link to={`/edit/${product.id}`} className="product-card__admin" aria-label="Sửa sản phẩm" title="Sửa sản phẩm">Sửa</Link>
              <button type="button" className="product-card__delete" onClick={() => handleDelete(product.id)} aria-label="Xóa sản phẩm" title="Xóa sản phẩm">Xóa</button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
