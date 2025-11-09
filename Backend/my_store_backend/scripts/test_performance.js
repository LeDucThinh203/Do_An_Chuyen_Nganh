/**
 * Script to test AI chatbot performance improvements
 * Run: node scripts/test_performance.js
 */

const API_URL = 'http://localhost:3006/ai/chat';

const testQueries = [
  { message: 'Tìm giày bóng đá size 42 dưới 1 triệu', fast: false },
  { message: 'Tìm giày bóng đá size 42 dưới 1 triệu', fast: true },
  { message: 'Có áo đấu Barcelona không?', fast: false },
  { message: 'Có áo đấu Barcelona không?', fast: true },
  { message: 'Quần short giá rẻ', fast: false },
  { message: 'Quần short giá rẻ', fast: true },
];

async function testPerformance() {
  console.log('🚀 Testing AI Chatbot Performance\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const [index, query] of testQueries.entries()) {
    const mode = query.fast ? 'FAST' : 'NORMAL';
    console.log(`\n[${index + 1}/${testQueries.length}] Testing: "${query.message}" (${mode} mode)`);
    
    const start = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.message,
          userId: 1,
          sessionId: `perf-test-${Date.now()}`,
          fast: query.fast,
          topK: query.fast ? 3 : 5
        })
      });
      
      const duration = Date.now() - start;
      const data = await response.json();
      
      results.push({
        query: query.message,
        mode,
        duration,
        success: response.ok,
        productsCount: data.context?.products?.length || 0,
        toolsUsed: data.tools?.length || 0,
        textLength: data.text?.length || 0
      });
      
      console.log(`  ✅ Success in ${duration}ms`);
      console.log(`     - Products: ${data.context?.products?.length || 0}`);
      console.log(`     - Tools: ${data.tools?.length || 0}`);
      console.log(`     - Response: ${data.text?.slice(0, 80)}...`);
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`  ❌ Failed in ${duration}ms: ${error.message}`);
      results.push({
        query: query.message,
        mode,
        duration,
        success: false,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Performance Summary\n');
  
  const normalResults = results.filter(r => r.mode === 'NORMAL' && r.success);
  const fastResults = results.filter(r => r.mode === 'FAST' && r.success);
  
  if (normalResults.length > 0) {
    const avgNormal = normalResults.reduce((sum, r) => sum + r.duration, 0) / normalResults.length;
    console.log(`Normal Mode Average: ${avgNormal.toFixed(0)}ms`);
    console.log(`  - Min: ${Math.min(...normalResults.map(r => r.duration))}ms`);
    console.log(`  - Max: ${Math.max(...normalResults.map(r => r.duration))}ms`);
  }
  
  if (fastResults.length > 0) {
    const avgFast = fastResults.reduce((sum, r) => sum + r.duration, 0) / fastResults.length;
    console.log(`\nFast Mode Average: ${avgFast.toFixed(0)}ms`);
    console.log(`  - Min: ${Math.min(...fastResults.map(r => r.duration))}ms`);
    console.log(`  - Max: ${Math.max(...fastResults.map(r => r.duration))}ms`);
    
    if (normalResults.length > 0) {
      const avgNormal = normalResults.reduce((sum, r) => sum + r.duration, 0) / normalResults.length;
      const improvement = ((avgNormal - avgFast) / avgNormal * 100).toFixed(1);
      console.log(`\n⚡ Fast Mode is ${improvement}% faster!`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Test completed!\n');
  
  // Detailed results table
  console.log('Detailed Results:');
  console.table(results);
}

// Run test
testPerformance().catch(console.error);
