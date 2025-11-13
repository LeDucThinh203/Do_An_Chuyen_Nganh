import db from '../../db.js';
import { embedText, cosineSim } from './embeddings.js';

const parseVec = (s) => {
  try { return JSON.parse(s); } catch { return null; }
};

const getAssetBase = () => {
  // Images are served from frontend, not backend
  return 'http://localhost:3000'; // Frontend URL
};

export const normalizeImage = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const base = getAssetBase();
  // Images are in /images/ folder in frontend
  if (img.startsWith('/')) return `${base}${img}`;
  return `${base}/images/${img}`;
};

export const upsertProductEmbedding = async (product) => {
  const text = `${product.name}\n${product.description || ''}`.trim();
  const vec = await embedText(text);
  await db.query(
    `REPLACE INTO product_embeddings (product_id, embedding) VALUES (?, ?)`,
    [product.id, JSON.stringify(vec)]
  );
};

export const ensureEmbeddingsForProducts = async (limit = 200) => {
  // Compute embeddings for products missing cache, bounded by limit
  const [missing] = await db.query(`
    SELECT p.* FROM product p
    LEFT JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE pe.product_id IS NULL
    LIMIT ?
  `, [limit]);
  
  if (missing.length === 0) return 0;
  
  // Generate embeddings with rate limiting (max 10 concurrent to avoid API throttle)
  const concurrentLimit = parseInt(process.env.EMBEDDING_CONCURRENT_LIMIT || '3');
  const delayBetweenBatches = parseInt(process.env.EMBEDDING_BATCH_DELAY || '500');
  
  let completed = 0;
  for (let i = 0; i < missing.length; i += concurrentLimit) {
    const batch = missing.slice(i, i + concurrentLimit);
    
    await Promise.all(
      batch.map(p => upsertProductEmbedding(p)
        .then(() => completed++)
        .catch(e => console.warn(`Failed embedding for product ${p.id}:`, e.message))
      )
    );
    
    // Delay between batches to respect rate limits (especially for free tier)
    if (i + concurrentLimit < missing.length) {
      await new Promise(r => setTimeout(r, delayBetweenBatches));
    }
  }
  
  return completed;
};

export const semanticSearchProducts = async (query, topK = 5) => {
  const qVec = await embedText(query);
  
  // OPTIMIZATION: Improved keyword extraction with better matching
  const allWords = query.toLowerCase()
    .split(' ')
    .filter(w => w.length > 1)
    .filter(w => !['tôi', 'muốn', 'xem', 'cho', 'cần', 'có', 'thể', 'mua', 'của', 'dưới', 'duoi', 'trên', 'tren', 'không', 'khong', 'ko'].includes(w));
  
  // PRIORITY 1: Category keywords (HIGHEST priority - defines product type)
  const categoryKeywords = allWords.filter(w => 
    ['áo', 'ao', 'quần', 'quan', 'giày', 'giay', 'găng', 'gang', 'bóng', 'bong'].includes(w)
  );
  
  // PRIORITY 2: Brand/Team keywords (team names, specific brands)
  const importantKeywords = allWords.filter(w => 
    ['mu', 'barca', 'barcelona', 'real', 'madrid', 'arsenal', 'chelsea', 'liverpool', 
     'nike', 'adidas', 'puma', 'miami', 'messi', 'ronaldo'].includes(w)
  );
  
  console.log(`[Search] Query: "${query}" → allWords: [${allWords.join(', ')}]`);
  console.log(`[Search] Category keywords: [${categoryKeywords.join(', ')}], Brand keywords: [${importantKeywords.join(', ')}]`);
  
  // Generic keywords
  const keywords = allWords.slice(0, 5);
  
  // Build conditions with PRIORITY on category keywords
  let likeConditions = '';
  let likeParams = [];
  
  // If BOTH category AND brand keywords exist → must have BOTH in name (AND logic)
  if (categoryKeywords.length > 0 && importantKeywords.length > 0) {
    const categoryConditions = categoryKeywords.map(() => 'p.name LIKE CONCAT("%", ?, "%")').join(' AND ');
    const brandConditions = importantKeywords.map(() => 'p.name LIKE CONCAT("%", ?, "%")').join(' AND ');
    likeConditions = `(${categoryConditions}) AND (${brandConditions})`;
    likeParams = [...categoryKeywords, ...importantKeywords];
    
    console.log(`[Search] Category + Brand filter: category=[${categoryKeywords.join(', ')}] AND brand=[${importantKeywords.join(', ')}] MUST be in product name`);
  }
  // Else if only category keyword exists (e.g., "giày"), it MUST be in product name
  else if (categoryKeywords.length > 0) {
    const categoryConditions = categoryKeywords.map(() => 'p.name LIKE CONCAT("%", ?, "%")').join(' AND ');
    likeConditions = categoryConditions;
    likeParams = categoryKeywords;
    
    console.log(`[Search] Category filter: ${categoryKeywords.join(', ')} MUST be in product name`);
  }
  // Else if there are important keywords (e.g., "MU"), they must be in name OR description
  else if (importantKeywords.length > 0) {
    const requiredConditions = importantKeywords.map(() => 
      '(p.name LIKE CONCAT("%", ?, "%") OR p.description LIKE CONCAT("%", ?, "%"))'
    ).join(' AND ');
    likeConditions = requiredConditions;
    likeParams = importantKeywords.flatMap(k => [k, k]);
    
    console.log(`[Search] Brand filter: ${importantKeywords.join(', ')}`);
  }
  // Else use generic keyword search
  else if (keywords.length > 0) {
    likeConditions = keywords.map(() => '(p.name LIKE CONCAT("%", ?, "%") OR p.description LIKE CONCAT("%", ?, "%"))').join(' OR ');
    likeParams = keywords.flatMap(k => [k, k]);
  }
  
  // Fetch candidates with LIKE prefilter
  const [candidates] = await db.query(
    `SELECT p.id, p.name, p.description, p.price, p.discount_percent, p.image, p.category_id, pe.embedding,
            GROUP_CONCAT(DISTINCT s.size ORDER BY s.id SEPARATOR ', ') as sizes,
            GROUP_CONCAT(DISTINCT CONCAT(s.size, ':', ps.stock) ORDER BY s.id SEPARATOR ', ') as stock_by_size
     FROM product p
     LEFT JOIN product_embeddings pe ON pe.product_id = p.id
     LEFT JOIN product_sizes ps ON ps.product_id = p.id
     LEFT JOIN sizes s ON s.id = ps.size_id
     ${likeConditions ? `WHERE ${likeConditions}` : ''}
     GROUP BY p.id, p.name, p.description, p.price, p.discount_percent, p.image, p.category_id, pe.embedding
     LIMIT 100`,
    likeParams
  );
  
  let pool = candidates;
  
  // Compute similarity with keyword boosting
  const scored = pool.map((r) => {
    const v = parseVec(r.embedding);
    const image = normalizeImage(r.image);
    
    if (!v || v.length === 0) return { ...r, image, score: 0, matchType: 'none' };
    
    let score = cosineSim(qVec, v);
    let matchType = 'related'; // Default: related product
    
    const nameLower = (r.name || '').toLowerCase();
    const descLower = (r.description || '').toLowerCase();
    const combined = nameLower + ' ' + descLower;
    
    // PRIORITY 1: Category keywords MUST be in product name
    if (categoryKeywords.length > 0) {
      const hasAllCategoryInName = categoryKeywords.every(keyword => nameLower.includes(keyword));
      
      if (!hasAllCategoryInName) {
        // If category keyword not in name, reject this product
        return { ...r, image, score: 0, matchType: 'none' };
      }
      
      // If ALSO has important brand keywords, BOTH must be in name
      if (importantKeywords.length > 0) {
        const hasImportantInName = importantKeywords.every(keyword => nameLower.includes(keyword));
        
        if (!hasImportantInName) {
          // Has category (áo) but NOT brand (mu) → reject (prevent showing Arsenal when asking for MU)
          return { ...r, image, score: 0, matchType: 'none' };
        }
        
        // Has BOTH category + brand in name → EXACT match
        matchType = 'exact';
        score += 5.0; // Big boost for exact match (2.0 category + 3.0 brand)
      } else {
        // Only category keyword, no brand specified
        score += 2.0;
        matchType = 'partial';
      }
    }
    // PRIORITY 2: Important brand keywords (if no category keyword)
    else if (importantKeywords.length > 0) {
      // Check if ALL important keywords are present
      const hasAllImportant = importantKeywords.every(keyword => combined.includes(keyword));
      
      if (!hasAllImportant) {
        return { ...r, image, score: 0, matchType: 'none' }; // Reject if missing important keyword
      }
      
      // Additional check: important keyword must be in NAME (not just description)
      const hasImportantInName = importantKeywords.every(keyword => nameLower.includes(keyword));
      
      if (hasImportantInName) {
        // If has all important keywords IN NAME, it's an EXACT match
        matchType = 'exact';
        score += 3.0; // Huge boost for exact match
      } else {
        // Has in description but not name - just related
        matchType = 'related';
        score += 0.5;
      }
    }
    
    // BOOST score for exact keyword matches
    keywords.forEach(keyword => {
      const nameWords = nameLower.split(/\s+/);
      const descWords = descLower.split(/\s+/);
      
      if (nameWords.includes(keyword)) {
        score += 0.5; // Big boost for exact word in name
        if (matchType === 'related') matchType = 'partial'; // Upgrade to partial match
      } else if (nameLower.includes(keyword)) {
        score += 0.2; // Smaller boost for substring in name
      }
      
      if (descWords.includes(keyword)) {
        score += 0.1; // Small boost for exact word in description
      }
    });
    
    return { ...r, image, score, matchType };
  }).sort((a, b) => b.score - a.score);

  // STRATEGY: Return EXACT matches if found, otherwise return RELATED products
  const exactMatches = scored.filter(p => p.matchType === 'exact' && p.score > 3.0);
  
  if (exactMatches.length > 0) {
    // Found exact match(es) - return ONLY exact matches (limit to topK)
    console.log(`[Search] Found ${exactMatches.length} exact match(es) for "${query}"`);
    return exactMatches.slice(0, Math.min(topK, 1)); // Return max 1 exact match
  }
  
  // No exact matches - look for related products in same category
  console.log(`[Search] No exact match for "${query}", searching for related products...`);
  
  // Strategy 1: If we have candidates from keyword search with decent scores, use them
  if (pool.length > 0) {
    const threshold = 0.3; // Lower threshold for related products
    const relevant = scored.filter(p => p.score > threshold && p.matchType !== 'none');
    if (relevant.length >= topK) {
      console.log(`[Search] Found ${relevant.length} related products from keyword search`);
      return relevant.slice(0, topK);
    }
    // Return whatever we have if less than topK
    if (relevant.length > 0) {
      console.log(`[Search] Found ${relevant.length} related products (partial match)`);
      return relevant;
    }
  }
  
  // IMPORTANT: If brand keyword was specified but no results → DON'T fallback to category suggestions
  // (User asked for "áo Barca", don't show Arsenal!)
  if (importantKeywords.length > 0) {
    console.log(`[Search] Brand keyword "${importantKeywords.join(', ')}" specified but no products found. No fallback.`);
    return [];
  }
  
  // Strategy 2: Category-based suggestions (ONLY if no brand keyword specified)
  console.log(`[Search] Searching for category-based suggestions...`);
  
  // Enhanced category detection
  const categoryMap = {
    'áo': 11,           // Áo (Bộ đồ category)
    'ao': 11,
    'shirt': 11,
    'jersey': 11,
    'quần': 11,         // Quần (cũng trong Bộ đồ)
    'quan': 11,
    'shorts': 11,
    'giày': 12,         // Giày
    'giay': 12,
    'shoes': 12,
    'boots': 12,
    'găng': 15,         // Găng tay (Phụ kiện)
    'gang': 15,
    'gloves': 15,
    'bóng': 13,         // Bóng đá
    'bong': 13,
    'ball': 13
  };
  
  const queryLower = query.toLowerCase();
  let categoryId = null;
  
  // Find matching category
  for (const [keyword, catId] of Object.entries(categoryMap)) {
    if (queryLower.includes(keyword)) {
      categoryId = catId;
      console.log(`[Search] Detected category ${catId} from keyword "${keyword}" in query "${query}"`);
      break;
    }
  }
  
  if (categoryId) {
    const [relatedByCategory] = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.discount_percent, p.image, pe.embedding,
              GROUP_CONCAT(DISTINCT s.size ORDER BY s.id SEPARATOR ', ') as sizes,
              GROUP_CONCAT(DISTINCT CONCAT(s.size, ':', ps.stock) ORDER BY s.id SEPARATOR ', ') as stock_by_size
       FROM product p
       LEFT JOIN product_embeddings pe ON pe.product_id = p.id
       LEFT JOIN product_sizes ps ON ps.product_id = p.id
       LEFT JOIN sizes s ON s.id = ps.size_id
       WHERE p.category_id = ?
       GROUP BY p.id, p.name, p.description, p.price, p.discount_percent, p.image, pe.embedding
       ORDER BY p.price ASC
       LIMIT ?`,
      [categoryId, topK]
    );
    
    if (relatedByCategory && relatedByCategory.length > 0) {
      console.log(`[Search] Category fallback SUCCESS: Found ${relatedByCategory.length} products in category ${categoryId}`);
      return relatedByCategory.map(r => ({
        ...r,
        image: normalizeImage(r.image),
        score: 0.25,
        matchType: 'category'
      }));
    } else {
      console.log(`[Search] Category fallback FAILED: No products in category ${categoryId}`);
    }
  } else {
    console.log(`[Search] No category detected in query "${query}"`);
  }
  
  // Strategy 3: Last resort - return top scored products if any
  console.log(`[Search] Last resort: returning top scored products`);
  const threshold = 0.2;
  const relevant = scored.filter(p => p.score > threshold);
  return (relevant.length >= topK ? relevant : scored).slice(0, topK);
};;
