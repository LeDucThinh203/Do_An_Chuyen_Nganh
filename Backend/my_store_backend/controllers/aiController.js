import { getChatModelWithTools, getFastModelWithTools } from '../services/ai/gemini.js';
import { ensureEmbeddingsForProducts, semanticSearchProducts } from '../services/ai/vectorStore.js';
import { saveMessage, getRecentMessages, recallLongTermMemory, upsertLongTermMemory, clearUserAiData } from '../services/ai/memory.js';
import { deleteOrderTracking, getOrderTracking } from '../services/ai/memory.js';
import { toolDeclarations, toolsImpl } from '../services/ai/tools.js';
import { 
  SYSTEM_PROMPT, 
  buildContextBlocks, 
  formatConversationHistory,
  PRODUCT_KEYWORDS,
  OFF_TOPIC_KEYWORDS,
  GREETING_KEYWORDS,
  SMALL_TALK_KEYWORDS,
  isDeclineOrGoodbyeMessage,
  getGoodbyeResponse
} from '../services/ai/prompts.js';

// Helper: create a deterministic short session id if not provided
const ensureSessionId = (sessionId, userId) => {
  if (sessionId) return sessionId;
  if (userId) return `u-${userId}`;
  return `anon-${Math.random().toString(36).slice(2, 10)}`;
};

export const chat = async (req, res) => {
  try {
    const { message, userId = null, sessionId = null, topK: inputTopK = 5, fast = false } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    
    console.log(`[AI] Request: userId=${userId}, message="${message}"`);
    
    const sid = ensureSessionId(sessionId, userId);

    // OPTIMIZATION 1: Early exit for decline/goodbye/thanks - DO NOT search products or call tools
    if (isDeclineOrGoodbyeMessage(message)) {
      console.log(`[AI] Detected decline/goodbye/thanks intent: "${message}"`);
      const text = getGoodbyeResponse();
      
      // CRITICAL: Delete order tracking when user declines to buy
      await deleteOrderTracking(sid);
      console.log(`[AI] Deleted order tracking for session ${sid} (user declined)`);
      
      // Save conversation without calling any tools
      await saveMessage({ session_id: sid, user_id: userId, role: 'user', content: message });
      await saveMessage({ session_id: sid, user_id: userId, role: 'assistant', content: text });
      
      return res.json({
        sessionId: sid,
        text,
        tools: [],
        context: { products: [], intent: 'goodbye' }
      });
    }

    // Speed-aware params
    const topK = Math.max(1, fast ? Math.min(inputTopK, 3) : inputTopK);

    // Check if message is about products (skip for greetings, small talk, ORDER queries, POLICY queries)
    const isProductQuery = (msg) => {
      const lower = msg.toLowerCase();
      
      // HIGHEST PRIORITY: Context-specific questions about products = NOT a new product search
      const contextSpecificPatterns = [
        // Order confirmation patterns
        /\b(lấy|lay|đặt|dat|mua)\s+(tôi|cho\s+tôi|cho\s*tôi)?\s*(áo|ao|sản phẩm|san pham|cái|sp)?\s*(này|nay|đó|do|kia)\b/i,
        /\bok\s+(lấy|lay|đặt|dat|mua)/i,
        /\b(lấy|lay|đặt|dat|mua)\s+luôn/i,
        
        // Size selection by body measurements (height-weight)
        /\b\d+m?\d*\s*-?\s*\d+kg/i,
        
        // Size and quantity input (size L đi, 1 cái, 2 chiếc...)
        /\bsize\s+[smlxSMLX0-9]+\s+(đi|di|thôi|thoi|nha|nhé|nhe)\b/i,
        /\b\d+\s+(cái|cai|chiếc|chiec|áo|ao|đôi|doi)\b/i,
        
        // Product detail inquiries (material, washing, features) about "this product" / "the shirt"
        // Pattern: (áo|sản phẩm|cái) + (này|đó) + question OR question about (áo|sp) with context words
        /\b(áo|ao|sản phẩm|san pham|cái|cai|đôi|doi)\s*(này|nay|đó|do|kia)?\s+(chất liệu|chat lieu|có|co|giặt|giat|bền|ben|thế nào|the nao|j\s+vậy|vay)/i,
        /\b(chất liệu|chat lieu|giặt máy|giat may|giặt|giat|vải|vai|material)\s+(gì|gi|j|nào|nao|như thế nào|nhu the nao|thế nào|the nao)/i,
        /\b(có|co)\s+(giặt máy|giat may|giặt|giat|machine wash|wash)\s+(được|duoc|đc|dc|không|ko|ko)\b/i
      ];
      
      if (contextSpecificPatterns.some(pattern => pattern.test(lower))) {
        console.log(`[AI] Detected context-specific question (not product search): "${msg}"`);
        return false;
      }
      
      // Greetings and small talk - NO product search (check FIRST, highest priority)
      if (GREETING_KEYWORDS.some(g => lower.includes(g)) && msg.length < 25) {
        console.log(`[AI] Detected greeting: "${msg}"`);
        return false;
      }
      if (SMALL_TALK_KEYWORDS.some(s => lower.includes(s)) && msg.length < 20) {
        console.log(`[AI] Detected small talk: "${msg}"`);
        return false;
      }
      
      // ❌ KHÔNG search products nếu hỏi về đơn hàng
      const orderKeywords = ['đơn hàng', 'don hang', 'đơn của tôi', 'đơn', 'order', 'giao hàng', 'giao hang', 'giao chưa', 'ship'];
      if (orderKeywords.some(k => lower.includes(k))) {
        console.log(`[AI] Detected order inquiry - NO product search: "${msg}"`);
        return false;
      }
      
      // ❌ KHÔNG search nếu hỏi về chính sách/hỗ trợ
      const policyKeywords = [
        'bao lâu', 'bao lau', 'khi nào', 'khi nao', 'mất bao lâu', 'mat bao lau',
        'mấy ngày', 'may ngay', 'bao nhiêu ngày', 'bao nhieu ngay',
        'phí ship', 'phi ship', 'phí giao hàng', 'phi giao hang',
        'giao hàng tới', 'giao hang toi', 'ship tới', 'ship toi',
        'thanh toán', 'thanh toan', 'payment', 'cod',
        'chính sách', 'chinh sach', 'policy', 'đổi trả', 'doi tra', 'return',
        'bảo hành', 'bao hanh', 'warranty', 'bảo quản', 'bao quan'
      ];
      
      // Special detection for delivery time questions
      const deliveryTimePatterns = [
        /\b(tầm|tam|khoảng|khoang|mất|mat)\s*(bao lâu|bao lau|mấy ngày|may ngay|bao nhiêu ngày|bao nhieu ngay)/i,
        /\b(hàng|hang|đơn|don)\s+(giao|ship)\s+(tới|toi|đến|den)/i,
        /\bgiao\s+(trong|mất|mat)\s+(bao lâu|bao lau|mấy ngày|may ngay)/i
      ];
      
      if (policyKeywords.some(k => lower.includes(k)) || deliveryTimePatterns.some(p => p.test(lower))) {
        console.log(`[AI] Detected policy/service inquiry - NO product search: "${msg}"`);
        return false;
      }
      
      // Off-topic keywords - NO product search
      if (OFF_TOPIC_KEYWORDS.some(k => lower.includes(k))) {
        console.log(`[AI] Detected off-topic keyword - NO product search: "${msg}"`);
        return false;
      }
      
      // ✅ Search khi hỏi về sản phẩm
      const productKeywords = [
        'áo', 'ao', 'quần', 'quan', 'giày', 'giay', 'găng', 'gang', 'bóng', 'bong', 
        'tất', 'tat', 'phụ kiện', 'phu kien',
        'mua', 'đặt', 'dat', 'tìm', 'tim', 'xem', 'có', 'co', 'giá', 'gia', 'size'
      ];
      
      return productKeywords.some(k => lower.includes(k));
    };

    // OPTIMIZATION 1: Run independent operations in parallel
    const [_, recentHistory, longMem, orderTracking] = await Promise.all([
      // Ensure product embeddings cache (non-blocking, very small batch to avoid cold start delay)
      ensureEmbeddingsForProducts(fast ? 5 : 10).catch(e => console.warn('[AI] Embedding cache update failed:', e.message)),
      // Memory: recent chat history (more messages to remember size/quantity choices)
      getRecentMessages(sid, fast ? 15 : 20),
      // Long-term memory (skip if anonymous user to save time)
      userId ? recallLongTermMemory(userId, message, 2) : Promise.resolve([]),
      // Get current order tracking (if any)
      getOrderTracking(sid)
    ]);
    
    // Check if we're in order creation flow (has order tracking)
    const isOrderFlow = orderTracking !== null;
    
    // OPTIMIZATION: Only search products when needed (NOT in order flow, NOT for order/policy queries)
    const shouldSearchProducts = !isOrderFlow && isProductQuery(message);
    console.log(`[AI] Query: "${message}" -> shouldSearchProducts: ${shouldSearchProducts}, isOrderFlow: ${isOrderFlow}`);
    
    // RAG: semantic retrieve relevant products ONLY if needed
    const relevantProducts = shouldSearchProducts ? await semanticSearchProducts(message, topK) : [];
    
    console.log(`[AI] Initial RAG search returned ${relevantProducts.length} products`);

    // Build system prompt and context from prompts module
    const system = SYSTEM_PROMPT;
    const contextBlocks = buildContextBlocks(longMem, relevantProducts, userId);
    
    // CRITICAL: Add order tracking to context if exists
    if (orderTracking) {
      contextBlocks.unshift(orderTracking); // Add at the beginning for high priority
      console.log(`[AI] Loaded order tracking: ${orderTracking}`);
    }

    // Prepare models (tools enabled): primary and fallback
    const fastModel = getFastModelWithTools(toolDeclarations);
    let currentModel = fast ? fastModel : getChatModelWithTools(toolDeclarations);

    // OPTIMIZATION 4: Faster retry with exponential backoff starting lower
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const isTransient = (e) => {
      const msg = (e?.message || '').toLowerCase();
      return e?.status === 503 || e?.status === 429 || msg.includes('overloaded') || msg.includes('rate') || msg.includes('unavailable');
    };
    const generateWithRetryAndFallback = async (request, maxRetries = 2) => {
      let attempt = 0; let lastErr;
      // Primary model retry with faster backoff
      while (attempt <= maxRetries) {
        try {
          return { model: currentModel, result: await currentModel.generateContent(request) };
        } catch (e) {
          lastErr = e;
          if (!isTransient(e) || attempt === maxRetries) break;
          await sleep(300 * Math.pow(1.5, attempt)); // Faster retry: 300ms, 450ms, 675ms
          attempt++;
        }
      }
      // Fast model fallback
      attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const r = await fastModel.generateContent(request);
          currentModel = fastModel;
          return { model: currentModel, result: r };
        } catch (e) {
          lastErr = e;
          if (!isTransient(e) || attempt === maxRetries) break;
          await sleep(300 * Math.pow(1.5, attempt));
          attempt++;
        }
      }
      throw lastErr;
    };

    // OPTIMIZATION 5: Save user message async (non-blocking)
    saveMessage({ session_id: sid, user_id: userId, role: 'user', content: message })
      .catch(e => console.warn('[AI] Failed to save user message:', e.message));

    // OPTIMIZATION 6: Format conversation history
    const prev = formatConversationHistory(recentHistory, fast);

    // Build contents for single-turn generation (Gemini v1beta: only user/model allowed in contents)
    const contents = [
      {
        role: 'user',
        parts: [
          ...(contextBlocks.length ? [{ text: contextBlocks.join('\n\n') }] : []),
          ...(prev ? [{ text: 'Lịch sử:\n' + prev }] : []), // Shorter label
          { text: message }
        ]
      }
    ];

    // First turn (with retry + fallback)
    let { result } = await generateWithRetryAndFallback({ contents, systemInstruction: { text: system } });

    // Handle function calls iteratively
    const toolResponses = [];
    const seenCalls = new Set();
    let steps = 0;
    const maxToolSteps = fast ? 2 : 3;
    let dynamicProducts = []; // Track products from tool calls
    
    while (true) {
      const calls = typeof result?.response?.functionCalls === 'function' ? result.response.functionCalls() : [];
      if (!calls || calls.length === 0) break;
      if (steps >= maxToolSteps) break;

      // IMPORTANT: Process ALL function calls in parallel, not just the first one
      const functionResponseParts = [];
      
      for (const call of calls) {
        const { name, args } = call;
        const signature = JSON.stringify({ name, args });
        
        // Skip duplicate calls
        if (seenCalls.has(signature)) {
          console.log(`[AI] Skipping duplicate tool call: ${name}`);
          continue;
        }
        seenCalls.add(signature);
        
        const impl = toolsImpl[name];
        let toolResult;
        
        if (impl) {
          try {
            // IMPORTANT: Inject userId into tool args for user-specific operations
            const toolArgs = { ...args };
            if (name === 'create_order' || name === 'list_orders_for_user' || name === 'get_user_addresses') {
              if (!toolArgs.user_id && userId) {
                toolArgs.user_id = userId;
                console.log(`[AI] Injected user_id=${userId} into ${name} tool`);
              }
            }
            
            toolResult = await impl(toolArgs);
            
            // Log tool result for debugging
            console.log(`[AI] Tool ${name} result:`, JSON.stringify(toolResult).substring(0, 300));
            
            // CRITICAL: If create_order succeeded, delete order tracking immediately
            if (name === 'create_order' && toolResult?.success) {
              await deleteOrderTracking(sid);
              console.log(`[AI] Order created successfully - deleted order tracking for session ${sid}`);
            }
            
            // If search_products was called, collect the products
            if (name === 'search_products') {
              console.log(`[AI] Tool result type: ${Array.isArray(toolResult) ? 'Array' : typeof toolResult}`);
              
              // Handle special case: no products found in price range (suggestions provided)
              if (toolResult && typeof toolResult === 'object' && toolResult.found === false) {
                console.log(`[AI] No products in price range, but ${toolResult.suggestions?.length || 0} suggestions provided`);
                // Don't replace, append suggestions
                if (toolResult.suggestions?.length) {
                  dynamicProducts.push(...toolResult.suggestions);
                }
              }
              // Normal case: array of products
              else if (Array.isArray(toolResult)) {
                console.log(`[AI] Tool search_products returned ${toolResult.length} products`);
                // Append products (don't replace - support multiple search calls)
                dynamicProducts.push(...toolResult);
              } else if (toolResult?.products) {
                console.log(`[AI] Tool search_products returned ${toolResult.products.length} products`);
                dynamicProducts.push(...toolResult.products);
              } else {
                console.log(`[AI] Tool search_products returned unexpected format`);
              }
            }
          } catch (e) {
            toolResult = { error: e.message };
          }
        } else {
          toolResult = { error: `Tool ${name} not implemented` };
        }
        
        toolResponses.push({ name, result: toolResult });

        await saveMessage({ session_id: sid, user_id: userId, role: 'function', content: JSON.stringify(toolResult), tool_name: name, tool_payload: args });

        // Add function response to parts array
        functionResponseParts.push({
          functionResponse: {
            name,
            response: {
              name,
              content: [{ text: JSON.stringify(toolResult) }]
            }
          }
        });
      }
      
      // If we processed any function calls, add them all to contents and continue
      if (functionResponseParts.length > 0) {
        steps += 1;
        
        // Save product mapping after all searches complete
        if (dynamicProducts.length > 0) {
          const productMapping = dynamicProducts.map(p => `${p.name} (ID: ${p.id})`).join(', ');
          const mappingNote = `[Sản phẩm đã tìm: ${productMapping}]`;
          await saveMessage({ 
            session_id: sid, 
            user_id: userId, 
            role: 'system', 
            content: mappingNote,
            tool_name: 'product_mapping'
          }).catch(e => console.warn('[AI] Failed to save product mapping:', e.message));
          
          // CRITICAL: Only create order tracking if this is an ORDER FLOW (customer wants to BUY)
          // Detect order intent from the original user message
          const orderIntentKeywords = ['mua', 'đặt', 'dat', 'lấy', 'lay', 'order'];
          const hasOrderIntent = orderIntentKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
          );
          
          // ONLY create tracking if customer wants to buy (has order intent)
          if (hasOrderIntent) {
            console.log(`[AI] Order intent detected - creating tracking message`);
            // Delete old tracking messages first to avoid confusion
            await deleteOrderTracking(sid);
            
            if (dynamicProducts.length === 1) {
              // Single product tracking
              const product = dynamicProducts[0];
              const orderTrackingNote = `📦 Đang xử lý đơn: product_id=${product.id}, product_name=${product.name}`;
              await saveMessage({ 
                session_id: sid, 
                user_id: userId, 
                role: 'system', 
                content: orderTrackingNote,
                tool_name: 'order_tracking'
              }).catch(e => console.warn('[AI] Failed to save order tracking:', e.message));
              console.log(`[AI] Order tracking started: product_id=${product.id}`);
            } else if (dynamicProducts.length > 1) {
              // Multiple products tracking
              const productList = dynamicProducts.map(p => `product_id=${p.id} (${p.name})`).join(', ');
              const orderTrackingNote = `📦 Đang xử lý đơn NHIỀU SẢN PHẨM: [${productList}]`;
              await saveMessage({ 
                session_id: sid, 
                user_id: userId, 
                role: 'system', 
                content: orderTrackingNote,
                tool_name: 'order_tracking'
              }).catch(e => console.warn('[AI] Failed to save order tracking:', e.message));
              console.log(`[AI] Order tracking started: ${dynamicProducts.length} products`);
            }
          } else {
            console.log(`[AI] No order intent detected - SKIPPING tracking message (customer is just asking about products)`);
          }
        }
        
        contents.push({
          role: 'user',
          parts: functionResponseParts
        });
        
        ({ result } = await generateWithRetryAndFallback({ contents, systemInstruction: { text: system } }));
      } else {
        // No new calls processed, exit loop
        break;
      }
    }

    let text = (typeof result?.response?.text === 'function' ? result.response.text() : '')
      || (result?.response?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '');

    // Merge products from initial RAG search and dynamic tool calls
    // ⚠️ QUAN TRỌNG: Nếu có tool results → CHỈ dùng tool results, BỎ QUA RAG
    // ⚠️ Trong order flow (chọn size/số lượng/địa chỉ) → KHÔNG hiển thị sản phẩm
    let allProducts;
    
    // Check if any tool returned successful results (found/success = true)
    const hasSuccessfulToolResults = toolResponses.some(tr => {
      const result = tr.result;
      return result && (result.found === true || result.success === true);
    });
    
    if (isOrderFlow) {
      console.log(`[AI] In order flow - hiding all products from response`);
      allProducts = [];
    } else if (hasSuccessfulToolResults) {
      // Tool returned successful results → Clear RAG products, only use tool products
      console.log(`[AI] Tool returned successful results - clearing RAG context`);
      if (dynamicProducts.length > 0) {
        console.log(`[AI] Using ${dynamicProducts.length} tool products (ignoring ${relevantProducts.length} RAG results)`);
        allProducts = dynamicProducts;
      } else {
        // Tool succeeded but no products (e.g., get_orders_by_date found orders)
        console.log(`[AI] Tool succeeded with no products - clearing all product context`);
        allProducts = [];
      }
    } else if (dynamicProducts.length > 0) {
      // Tool returned products but not successful (e.g., found: false with suggestions)
      console.log(`[AI] Tool search returned ${dynamicProducts.length} products - using ONLY tool results (ignoring ${relevantProducts.length} RAG results)`);
      allProducts = dynamicProducts;
    } else {
      console.log(`[AI] No tool results - using ${relevantProducts.length} RAG results`);
      allProducts = relevantProducts;
    }
    console.log(`[AI] Final products count: ${allProducts.length}`);

    // POST-PROCESSING: Clean up response formatting per product display rules
    const sanitizeResponse = (raw, showImageNotice) => {
      if (!raw) return '';
      let out = String(raw);
      
      // 0) CRITICAL: Remove ALL order tracking messages (should NEVER be shown to user)
      // Pattern 1: "📦 Order tracking started: product_id=XX, product_name=..."
      out = out.replace(/📦\s*Order tracking started:.*$/gim, '');
      // Pattern 2: "📦 Đang xử lý đơn: product_id=XX..."
      out = out.replace(/📦\s*Đang xử lý đơn:.*$/gim, '');
      // Pattern 3: "📦 Đang xử lý NHIỀU SẢN PHẨM:..."
      out = out.replace(/📦\s*Đang xử lý.*SẢN PHẨM:.*$/gim, '');
      // Pattern 4: Any line starting with [System], [Hệ thống], [Tool, etc.
      out = out.replace(/^\[(?:System|Hệ thống|Tool|AI|DEBUG).*$/gim, '');
      
      // 1) Remove product codes like "(mã #64)" or "mã #64"
      out = out.replace(/\s*\(mã\s*#\d+\)/gi, '');
      out = out.replace(/\bmã\s*#\d+\b/gi, '');

      // 2) Replace any "Tồn kho: S: 36, M: 44" with "Size còn hàng: S, M"
      out = out.replace(/(\*?\s*)Tồn kho\s*:\s*([^\n]*)/gi, (match, lead, rest) => {
        const cleaned = (rest || '').replace(/\*/g, '').replace(/[\.]?\s*$/,'');
        const sizes = cleaned.split(',').map(s => s.trim()).map(seg => {
          const m = seg.match(/^([A-Za-zÀ-ỹ0-9]+)\s*:\s*(\d+)/i);
          if (!m) return null;
          const size = m[1]; const qty = parseInt(m[2], 10);
          return qty > 0 ? size : null;
        }).filter(Boolean);
        return sizes.length ? `${lead}Size còn hàng: ${sizes.join(', ')}` : '';
      });

      // 3) Remove ALL *** patterns
      out = out.replace(/\*\*\*\s*/g, '');
      
      // 4) AI already formats correctly with newlines - just normalize
      // Clean up multiple spaces and normalize line breaks
      out = out.replace(/\s{3,}/g, ' ').replace(/\n{3,}/g, '\n\n');

      // 5) Ensure the image sentence appears once at the end
      const IMG_SENTENCE = 'Ảnh sản phẩm đã được hiển thị bên dưới.';
      const imgRe = /Ảnh sản phẩm đã được hiển thị bên dưới\.?/gi;
      out = out.replace(imgRe, '');
      out = out.trim();
      
      if (showImageNotice) {
        if (out && !/[\.!?…]$/.test(out)) out += '.';
        out += '\n\n' + IMG_SENTENCE;
      }
      
      return out.trim();
    };

    text = sanitizeResponse(text, (relevantProducts.length + dynamicProducts.length) > 0);

    // OPTIMIZATION 7: Save messages and update memory async (non-blocking)
    const savePromises = [
      saveMessage({ session_id: sid, user_id: userId, role: 'assistant', content: text })
        .catch(e => console.warn('[AI] Failed to save assistant message:', e.message))
    ];
    
    // OPTIMIZATION 8: Update long-term memory only for substantive conversations (length check)
    if (userId && message.length > 10 && text.length > 20) {
      const memHint = `${message.slice(0, 200)} -> ${text.slice(0, 200)}`;
      savePromises.push(
        upsertLongTermMemory(userId, memHint)
          .catch(e => console.warn('[AI] Failed to update long-term memory:', e.message))
      );
    }
    
    // Don't await - let these complete in background
    Promise.all(savePromises);

    return res.json({ sessionId: sid, text, tools: toolResponses, context: { products: allProducts } });
  } catch (err) {
    console.error('[AI chat] error', err);
    const msg = (err?.message || '').toLowerCase();
    const transient = err?.status === 503 || err?.status === 429 || msg.includes('overloaded') || msg.includes('unavailable') || msg.includes('rate');
    if (transient) {
      const friendly = 'Xin lỗi, mô hình AI đang quá tải. Vui lòng thử lại sau trong giây lát.';
      return res.status(200).json({ sessionId: req.body?.sessionId, text: friendly, tools: [], context: { products: [] }, note: 'degraded-response', error: { status: err?.status, message: err?.message }});
    }
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};

export const history = async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
  const rows = await getRecentMessages(sessionId, 50);
  res.json(rows);
};

export const clearMyHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa xác thực người dùng' });
    }

    await clearUserAiData(userId);
    return res.json({ message: 'Đã xóa lịch sử chat AI của người dùng' });
  } catch (err) {
    console.error('[AI clear history] error', err);
    return res.status(500).json({ error: err.message });
  }
};
