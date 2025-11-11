import db from '../db.js';

(async () => {
  try {
    console.log('\n========================================');
    console.log('Test: Brand Products in Database');
    console.log('========================================\n');
    
    // Test Barca
    const [barca] = await db.query(
      'SELECT id, name FROM product WHERE name LIKE ? OR name LIKE ? LIMIT 5',
      ['%barca%', '%barcelona%']
    );
    console.log(`Barca/Barcelona products: ${barca.length}`);
    barca.forEach(p => console.log(`  - ${p.name}`));
    
    // Test Chelsea
    const [chelsea] = await db.query(
      'SELECT id, name FROM product WHERE name LIKE ? LIMIT 5',
      ['%chelsea%']
    );
    console.log(`\nChelsea products: ${chelsea.length}`);
    chelsea.forEach(p => console.log(`  - ${p.name}`));
    
    // Test MU
    const [mu] = await db.query(
      'SELECT id, name FROM product WHERE name LIKE ? OR name LIKE ? LIMIT 5',
      ['%mu%', '%manchester%']
    );
    console.log(`\nMU/Manchester products: ${mu.length}`);
    mu.forEach(p => console.log(`  - ${p.name}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
