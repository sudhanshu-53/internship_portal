// FILE: scripts/setup.js
import { initializeDatabase } from '../config/database.js';

console.log('🚀 Setting up AI Internship Backend...');
console.log('📊 Initializing database...');

try {
  await initializeDatabase();
  console.log('✅ Database initialized successfully!');
  console.log('🎉 Setup complete! You can now start the server with: npm start');
} catch (error) {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}
