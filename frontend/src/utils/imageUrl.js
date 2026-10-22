const PLACEHOLDER_IMAGE = "/images/placeholder.png";

const normalizeFilename = (value) => {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original text if an old database value contains malformed escapes.
  }

  return decoded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const IMAGE_ALIASES = new Map([
  ["Quả Bóng Đá AKpro AF2000 Số 5.jpg", "qua-bong-da-akpro-af2000-5.jpg"],
  ["Đội tuyển Argentina (Argentina) - trang phục sân nhà (home kit) 2022-2024.jpg", "argentina-home-2022-2024.jpg"],
  ["Gloves Adidas Predator GL Pro Soccer Goalie Goalkeeper Gloves HH8745 Choosing Size New.jpg", "gloves-adidas-predator-gl-pro-soccer-goalie-hh8745.jpg"],
  ["Găng tay thủ môn Kaiwin GUNNER - Màu xanh da.jpg", "gang-tay-kaiwin-gunner-xanh-da.jpg"],
  ["Găng Tay Thủ Môn Reusch Attrakt Fusion Carbon® 3D 5570998 7784.jpg.png", "gang-tay-reusch-attrakt-fusion-carbon-3d-5570998-7784.png"],
  ["đội tuyển Tây Ban Nha năm 2016 - 2018 .jpg", "doi_tuyen_Tay_Ban_Nha_nam_2016-2018.jpg"],
  ["Screenshot 2025-05-09 233810.png", "Screenshot2025-05-09233810.png"],
].map(([source, target]) => [normalizeFilename(source), target]));

const getFilename = (value) => {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original text if an old database value contains malformed escapes.
  }

  return decoded.split(/[?#]/, 1)[0].split(/[\\/]/).filter(Boolean).pop() || "";
};

const getOrigin = () => (typeof window === "undefined" ? "https://localhost" : window.location.origin);

export const resolveImageUrl = (source) => {
  const value = String(source || "").trim();
  if (!value) return PLACEHOLDER_IMAGE;

  const alias = IMAGE_ALIASES.get(normalizeFilename(getFilename(value)));
  if (alias) return `/images/${alias}`;

  if (/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
    return PLACEHOLDER_IMAGE;
  }

  try {
    const origin = getOrigin();
    const path = /^https?:\/\//i.test(value)
      ? value
      : value.startsWith("/")
        ? value
        : `/images/${value}`;
    const url = new URL(path, origin);

    if (url.username || url.password) return PLACEHOLDER_IMAGE;

    if (url.protocol === "http:") {
      const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      const currentProtocol = typeof window === "undefined" ? "https:" : window.location.protocol;
      if (!isLocalhost && currentProtocol === "https:") url.protocol = "https:";
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") return PLACEHOLDER_IMAGE;

    if (url.origin === origin) return `${url.pathname}${url.search}${url.hash}`;
    return url.href;
  } catch {
    return PLACEHOLDER_IMAGE;
  }
};

export const handleImageError = (event) => {
  const image = event.currentTarget;
  if (!image || image.dataset.imageFallbackApplied === "true") return;

  image.dataset.imageFallbackApplied = "true";
  image.src = PLACEHOLDER_IMAGE;
};

const VNPAY_HOSTS = new Set(["sandbox.vnpayment.vn", "pay.vnpay.vn"]);

export const resolveVnpayPaymentUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || !VNPAY_HOSTS.has(url.hostname) || url.username || url.password) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
};
