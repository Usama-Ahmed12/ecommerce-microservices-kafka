const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DATABASES = ['auth_db', 'product_db', 'cart_db', 'order_db', 'user_db'];

async function checkDatabases() {
  console.log('🔍 Checking Microservices Databases...\n');
  console.log('=' .repeat(60));
  
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    for (const dbName of DATABASES) {
      const exists = databases.some(db => db.name === dbName);
      
      if (exists) {
        console.log(`✅ ${dbName.padEnd(15)} - EXISTS`);
        
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`   └─ ${col.name}: ${count} documents`);
          }
        } else {
          console.log(`   └─ No collections yet (will be created on first write)`);
        }
      } else {
        console.log(`⚠️  ${dbName.padEnd(15)} - NOT FOUND (will be created when service starts)`);
      }
      console.log('');
    }
    
    console.log('=' .repeat(60));
    console.log('\n📊 Database Summary:');
    console.log(`   Total databases checked: ${DATABASES.length}`);
    console.log(`   Existing databases: ${databases.filter(db => DATABASES.includes(db.name)).length}`);
    console.log('\n💡 Tip: Start all services to auto-create databases\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure MongoDB is running: mongod\n');
  } finally {
    await client.close();
  }
}

checkDatabases();
