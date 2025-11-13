import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Tạo JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Xác thực JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware xác thực - yêu cầu đăng nhập
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Không tìm thấy token xác thực' });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Lưu thông tin user vào request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Xác thực thất bại' });
  }
};

/**
 * Middleware kiểm tra quyền admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập. Yêu cầu quyền admin' });
  }

  next();
};

/**
 * Middleware kiểm tra quyền user hoặc admin
 */
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  next();
};

/**
 * Middleware kiểm tra user có phải là chính họ hoặc admin
 */
export const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  const userId = parseInt(req.params.id);
  
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập tài nguyên này' });
  }

  next();
};

/**
 * Middleware xác thực tùy chọn - không bắt buộc đăng nhập
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

export default {
  generateToken,
  verifyToken,
  authenticate,
  requireAdmin,
  requireUser,
  requireSelfOrAdmin,
  optionalAuth
};
