import db from '../db.js';

(async () => {
  try {
    console.log('\n========================================');
    console.log('Test: Product Sizes in Database');
    console.log('========================================\n');
    
    // Test product MU (id=64)
    const [sizes] = await db.query(
      `SELECT p.id, p.name, s.size
       FROM product p
       JOIN product_sizes ps ON ps.product_id = p.id
       JOIN sizes s ON s.id = ps.size_id
       WHERE p.id = 64
       ORDER BY s.id`,
      []
    );
    
    console.log(`Product MU (id=64) has ${sizes.length} sizes:`);
    sizes.forEach(s => console.log(`  - ${s.size}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
