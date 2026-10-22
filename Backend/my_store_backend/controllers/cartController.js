import db from '../db.js';

const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const getCartItems = async (accountId) => {
  const [rows] = await db.query(`
    SELECT
      c.product_sizes_id,
      p.id,
      p.name,
      p.image,
      p.price AS original_price,
      p.discount_percent,
      CASE
        WHEN p.discount_percent > 0 THEN ROUND(p.price * (100 - p.discount_percent) / 100, 2)
        ELSE p.price
      END AS price,
      s.size,
      c.quantity,
      ps.stock,
      (p.deleted_at IS NULL) AS available
    FROM cart c
    JOIN product_sizes ps ON ps.id = c.product_sizes_id
    JOIN product p ON p.id = ps.product_id
    JOIN sizes s ON s.id = ps.size_id
    WHERE c.account_id = ?
    ORDER BY c.updated_at DESC, c.id DESC
  `, [accountId]);

  return rows.map((item) => ({
    ...item,
    price: Number(item.price),
    original_price: Number(item.original_price),
    discount_percent: Number(item.discount_percent || 0),
    quantity: Number(item.quantity),
    stock: Number(item.stock || 0),
    available: item.available === true,
  }));
};

const withTransaction = async (callback) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Keep the original database error.
    }
    throw error;
  } finally {
    connection.release();
  }
};

const getProductSizeForUpdate = async (connection, productSizesId) => {
  const [rows] = await connection.query(`
    SELECT ps.id, ps.stock
    FROM product_sizes ps
    JOIN product p ON p.id = ps.product_id
    WHERE ps.id = ? AND p.deleted_at IS NULL
    FOR UPDATE OF ps
  `, [productSizesId]);
  return rows[0] || null;
};

export const getMyCart = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    return res.json({ cart: await getCartItems(req.user.id) });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể tải giỏ hàng.' });
  }
};

export const addCartItem = async (req, res) => {
  const productSizesId = positiveInteger(req.body?.product_sizes_id);
  const quantity = positiveInteger(req.body?.quantity ?? 1);
  if (!productSizesId || !quantity) {
    return res.status(400).json({ error: 'Sản phẩm, size hoặc số lượng không hợp lệ.' });
  }

  try {
    await withTransaction(async (connection) => {
      const variant = await getProductSizeForUpdate(connection, productSizesId);
      if (!variant) {
        const error = new Error('Sản phẩm hoặc size không còn tồn tại.');
        error.status = 404;
        throw error;
      }

      const [existingRows] = await connection.query(
        'SELECT quantity FROM cart WHERE account_id = ? AND product_sizes_id = ? FOR UPDATE',
        [req.user.id, productSizesId]
      );
      const currentQuantity = Number(existingRows[0]?.quantity || 0);
      if (currentQuantity + quantity > Number(variant.stock)) {
        const error = new Error(`Số lượng vượt quá tồn kho hiện tại (${variant.stock}).`);
        error.status = 409;
        throw error;
      }

      await connection.query(`
        INSERT INTO cart (account_id, product_sizes_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT (account_id, product_sizes_id)
        DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity, updated_at = NOW()
      `, [req.user.id, productSizesId, quantity]);
    });

    return res.status(200).json({ cart: await getCartItems(req.user.id) });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Không thể thêm sản phẩm vào giỏ.' });
  }
};

export const updateCartItem = async (req, res) => {
  const productSizesId = positiveInteger(req.params.productSizesId);
  const quantity = positiveInteger(req.body?.quantity);
  if (!productSizesId || !quantity) {
    return res.status(400).json({ error: 'Size sản phẩm hoặc số lượng không hợp lệ.' });
  }

  try {
    await withTransaction(async (connection) => {
      const variant = await getProductSizeForUpdate(connection, productSizesId);
      if (!variant) {
        const error = new Error('Sản phẩm hoặc size không còn tồn tại.');
        error.status = 404;
        throw error;
      }
      if (quantity > Number(variant.stock)) {
        const error = new Error(`Số lượng vượt quá tồn kho hiện tại (${variant.stock}).`);
        error.status = 409;
        throw error;
      }

      const [meta, rows] = await connection.query(`
        UPDATE cart SET quantity = ?, updated_at = NOW()
        WHERE account_id = ? AND product_sizes_id = ?
        RETURNING id
      `, [quantity, req.user.id, productSizesId]);
      if (!meta.affectedRows && !rows.length) {
        const error = new Error('Không tìm thấy sản phẩm trong giỏ hàng.');
        error.status = 404;
        throw error;
      }
    });

    return res.json({ cart: await getCartItems(req.user.id) });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Không thể cập nhật giỏ hàng.' });
  }
};

export const removeCartItem = async (req, res) => {
  const productSizesId = positiveInteger(req.params.productSizesId);
  if (!productSizesId) return res.status(400).json({ error: 'Size sản phẩm không hợp lệ.' });

  try {
    await db.query('DELETE FROM cart WHERE account_id = ? AND product_sizes_id = ?', [req.user.id, productSizesId]);
    return res.json({ cart: await getCartItems(req.user.id) });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể xóa sản phẩm khỏi giỏ hàng.' });
  }
};

export const clearMyCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE account_id = ?', [req.user.id]);
    return res.json({ cart: [] });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể làm trống giỏ hàng.' });
  }
};

export const mergeGuestCart = async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || items.length > 500) {
    return res.status(400).json({ error: 'Danh sách giỏ hàng không hợp lệ hoặc vượt quá giới hạn.' });
  }

  let skipped = 0;
  try {
    await withTransaction(async (connection) => {
      for (const item of items) {
        const productId = positiveInteger(item?.product_id ?? item?.id);
        const size = String(item?.size || '').trim();
        const quantity = positiveInteger(item?.quantity);
        if (!productId || !size || !quantity) {
          skipped += 1;
          continue;
        }

        const [variants] = await connection.query(`
          SELECT ps.id, ps.stock
          FROM product_sizes ps
          JOIN product p ON p.id = ps.product_id
          JOIN sizes s ON s.id = ps.size_id
          WHERE p.id = ? AND s.size = ? AND p.deleted_at IS NULL
          FOR UPDATE OF ps
        `, [productId, size]);
        const variant = variants[0];
        if (!variant || Number(variant.stock) < 1) {
          skipped += 1;
          continue;
        }

        const [existingRows] = await connection.query(
          'SELECT quantity FROM cart WHERE account_id = ? AND product_sizes_id = ? FOR UPDATE',
          [req.user.id, variant.id]
        );
        const currentQuantity = Number(existingRows[0]?.quantity || 0);
        const mergedQuantity = Math.min(Number(variant.stock), currentQuantity + quantity);
        if (mergedQuantity <= currentQuantity) {
          skipped += 1;
          continue;
        }

        await connection.query(`
          INSERT INTO cart (account_id, product_sizes_id, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT (account_id, product_sizes_id)
          DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
        `, [req.user.id, variant.id, mergedQuantity]);
      }
    });

    return res.json({ cart: await getCartItems(req.user.id), skipped });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể đồng bộ giỏ hàng.' });
  }
};
