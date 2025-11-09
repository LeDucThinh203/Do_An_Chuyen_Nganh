/**
 * Pre-generate embeddings for all products (optimized for large catalogs)
 * Run once: node scripts/generate_embeddings.js
 * This eliminates cold start delay on first AI chat request
 * 
 * For 1000+ products: Will respect rate limits and run in batches
 */

import db from '../db.js';
import { upsertProductEmbedding } from '../services/ai/vectorStore.js';

// Configuration (adjust based on your Gemini API tier)
const CONCURRENT_LIMIT = parseInt(process.env.EMBEDDING_CONCURRENT_LIMIT || '3'); // Free tier: 3, Paid: 10
const BATCH_DELAY_MS = parseInt(process.env.EMBEDDING_BATCH_DELAY || '1000'); // 1s delay between batches
const RETRY_ATTEMPTS = 2;

async function generateAllEmbeddings() {
  console.log('🔄 Generating embeddings for all products...\n');
  console.log(`⚙️  Config: ${CONCURRENT_LIMIT} concurrent, ${BATCH_DELAY_MS}ms delay between batches\n`);
  
  try {
    // Get all products without embeddings
    const [products] = await db.query(`
      SELECT p.id, p.name, p.description 
      FROM product p
      LEFT JOIN product_embeddings pe ON pe.product_id = p.id
      WHERE pe.product_id IS NULL
    `);
    
    console.log(`Found ${products.length} products to process\n`);
    
    if (products.length === 0) {
      console.log('✅ All products already have embeddings!');
      process.exit(0);
    }
    
    // Estimate time
    const estimatedMinutes = Math.ceil((products.length / CONCURRENT_LIMIT) * (BATCH_DELAY_MS / 1000) / 60);
    console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes\n`);
    
    let completed = 0;
    let failed = 0;
    const startTime = Date.now();
    
    // Process in batches
    for (let i = 0; i < products.length; i += CONCURRENT_LIMIT) {
      const batch = products.slice(i, i + CONCURRENT_LIMIT);
      const batchStart = Date.now();
      
      // Process batch concurrently with retry logic
      await Promise.all(
        batch.map(async (product) => {
          let attempts = 0;
          while (attempts <= RETRY_ATTEMPTS) {
            try {
              await upsertProductEmbedding(product);
              completed++;
              const progress = ((completed / products.length) * 100).toFixed(1);
              console.log(`✅ [${completed}/${products.length}] (${progress}%) ${product.name.slice(0, 50)}...`);
              break;
            } catch (error) {
              attempts++;
              if (attempts > RETRY_ATTEMPTS) {
                failed++;
                console.error(`❌ Failed for product #${product.id} after ${RETRY_ATTEMPTS} retries:`, error.message);
              } else {
                console.warn(`⚠️  Retry ${attempts}/${RETRY_ATTEMPTS} for product #${product.id}`);
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
              }
            }
          }
        })
      );
      
      const batchDuration = Date.now() - batchStart;
      
      // Delay between batches to respect rate limits
      if (i + CONCURRENT_LIMIT < products.length) {
        const remaining = products.length - completed - failed;
        const eta = Math.ceil((remaining / CONCURRENT_LIMIT) * (BATCH_DELAY_MS / 1000) / 60);
        console.log(`⏸️  Batch complete (${batchDuration}ms). Waiting ${BATCH_DELAY_MS}ms... ETA: ~${eta} min\n`);
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total: ${products.length} products`);
    console.log(`   ✅ Success: ${completed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Total time: ${totalTime}s (${(totalTime / 60).toFixed(1)} minutes)`);
    console.log(`   📈 Average: ${(totalTime / products.length).toFixed(2)}s per product`);
    console.log('='.repeat(60));
    console.log('\n✨ Embedding generation completed!');
    console.log('💡 Next time you use AI chat, it will be much faster!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run
generateAllEmbeddings();
