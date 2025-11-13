import { getChatModelWithTools, getFastModelWithTools } from '../services/ai/gemini.js';
import { ensureEmbeddingsForProducts, semanticSearchProducts } from '../services/ai/vectorStore.js';
import { saveMessage, getRecentMessages, recallLongTermMemory, upsertLongTermMemory } from '../services/ai/memory.js';
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
    const sid = ensureSessionId(sessionId, userId);

    // OPTIMIZATION 1: Early exit for decline/goodbye/thanks - DO NOT search products or call tools
    if (isDeclineOrGoodbyeMessage(message)) {
      console.log(`[AI] Detected decline/goodbye/thanks intent: "${message}"`);
      const text = getGoodbyeResponse();
      
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

    // Check if message is about products (skip for greetings and small talk)
    const isProductQuery = (msg) => {
      const lower = msg.toLowerCase();
      
      // Greetings and small talk - NO product search (check FIRST, highest priority)
      if (GREETING_KEYWORDS.some(g => lower.includes(g)) && msg.length < 25) {
        console.log(`[AI] Detected greeting: "${msg}"`);
        return false;
      }
      if (SMALL_TALK_KEYWORDS.some(s => lower.includes(s)) && msg.length < 20) {
        console.log(`[AI] Detected small talk: "${msg}"`);
        return false;
      }
      
      // Off-topic keywords - NO product search
      if (OFF_TOPIC_KEYWORDS.some(k => lower.includes(k))) {
        console.log(`[AI] Detected off-topic keyword in query: "${msg}"`);
        return false;
      }
      
      // Product-related keywords
      const allProductKeywords = [
        ...PRODUCT_KEYWORDS.categories,
        ...PRODUCT_KEYWORDS.shopping,
        ...PRODUCT_KEYWORDS.brands
      ];
      
      return allProductKeywords.some(k => lower.includes(k)) || msg.length > 30;
    };

    const shouldSearchProducts = isProductQuery(message);
    console.log(`[AI] Query: "${message}" -> shouldSearchProducts: ${shouldSearchProducts}`);

    // OPTIMIZATION 1: Run independent operations in parallel
    const [_, relevantProducts, recentHistory, longMem] = await Promise.all([
      // Ensure product embeddings cache (non-blocking, very small batch to avoid cold start delay)
      ensureEmbeddingsForProducts(fast ? 5 : 10).catch(e => console.warn('[AI] Embedding cache update failed:', e.message)),
      // RAG: semantic retrieve relevant products ONLY if needed
      // Use topK=1 for exact matches, topK=3 for related products
      shouldSearchProducts ? semanticSearchProducts(message, topK) : Promise.resolve([]),
      // Memory: recent chat history
      getRecentMessages(sid, fast ? 8 : 12),
      // Long-term memory (skip if anonymous user to save time)
      userId ? recallLongTermMemory(userId, message, 2) : Promise.resolve([])
    ]);
    
    console.log(`[AI] Initial RAG search returned ${relevantProducts.length} products`);

    // Build system prompt and context from prompts module
    const system = SYSTEM_PROMPT;
    const contextBlocks = buildContextBlocks(longMem, relevantProducts);

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
      const call = calls && calls.length ? calls[0] : null;
      if (!call) break;
      if (steps >= maxToolSteps) break;

      const { name, args } = call;
      const signature = JSON.stringify({ name, args });
      if (seenCalls.has(signature)) {
        break;
      }
      seenCalls.add(signature);
      steps += 1;
      const impl = toolsImpl[name];
      let toolResult;
      if (impl) {
        try {
          toolResult = await impl(args || {});
          
          // If search_products was called, collect the products
          if (name === 'search_products') {
            console.log(`[AI] Tool result type: ${Array.isArray(toolResult) ? 'Array' : typeof toolResult}`);
            console.log(`[AI] Tool result:`, JSON.stringify(toolResult).substring(0, 200));
            
            if (Array.isArray(toolResult)) {
              console.log(`[AI] Tool search_products returned ${toolResult.length} products`);
              dynamicProducts = toolResult;
            } else if (toolResult?.products) {
              console.log(`[AI] Tool search_products returned ${toolResult.products.length} products`);
              dynamicProducts = toolResult.products;
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

      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: {
              name,
              content: [{ text: JSON.stringify(toolResult) }]
            }
          }
        }]
      });
      ({ result } = await generateWithRetryAndFallback({ contents, systemInstruction: { text: system } }));
    }

    const text = (typeof result?.response?.text === 'function' ? result.response.text() : '')
      || (result?.response?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '');

    // Merge products from initial RAG search and dynamic tool calls
    const allProducts = [...relevantProducts];
    if (dynamicProducts.length > 0) {
      console.log(`[AI] Merging ${dynamicProducts.length} products from tool calls`);
      // Add products from tool calls that aren't already in relevantProducts
      dynamicProducts.forEach(dp => {
        if (!allProducts.some(p => p.id === dp.id)) {
          allProducts.push(dp);
        }
      });
    }
    console.log(`[AI] Final products count: ${allProducts.length} (${relevantProducts.length} from RAG + ${dynamicProducts.length} from tools)`);

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
