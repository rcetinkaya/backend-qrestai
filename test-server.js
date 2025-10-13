// Simple test to check if server starts
console.log('Testing server startup...');

try {
  // Test imports
  console.log('1. Testing dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  console.log('2. Testing express...');
  const express = require('express');
  console.log('✅ express loaded');

  console.log('3. Creating simple server...');
  const app = express();

  app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test server works!' });
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`   Visit: http://localhost:${PORT}/test`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
