import { toolsImpl } from '../services/ai/tools.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from project root .env if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assume .env is in Backend/my_store_backend/.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  try {
    // Allow CLI overrides: node scripts/test_search_products.js "query" max_price size category
    // Example: node scripts/test_search_products.js "áo" 100000 M Áo
    const [, , qArg, priceArg, sizeArg, catArg] = process.argv;
    const params = {
      query: qArg || 'giày',
      limit: 5,
      max_price: priceArg ? Number(priceArg) : 1000000,
      size: sizeArg || '41',
      category: catArg || 'Giày'
    };
    console.log('Running search_products with params:', params);
    const results = await toolsImpl.search_products(params);
    console.log('\nResults:');
    for (const r of results) {
      console.log(`- [${r.suggestion_type}] #${r.id} ${r.name} | ${r.price?.toLocaleString('vi-VN')}₫`);
    }
    if (results.length === 0) {
      console.log('\nNo results found. Try relaxing parameters or verify DB has matching data.');
    }
  } catch (err) {
    console.error('Error running test_search_products:', err);
    process.exitCode = 1;
  }
}

main();
