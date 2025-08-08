const mongoose = require('mongoose');
require('dotenv').config();

const cleanupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');
    console.log('Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('Found collections:', collections.map(c => c.name));

    // Clean up all collections except users
    const collectionsToClean = ['cases', 'hearings', 'documents', 'notes', 'notifications'];
    
    for (const collectionName of collectionsToClean) {
      if (collections.find(c => c.name === collectionName)) {
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`✅ Cleaned ${collectionName}: deleted ${result.deletedCount} documents`);
      } else {
        console.log(`ℹ️ Collection ${collectionName} doesn't exist`);
      }
    }

    // Optional: Clean users except the ones we just created
    const usersToKeep = [
      'superadmin@lawfirm.com',
      'admin1@lawfirm.com', 
      'admin2@lawfirm.com'
    ];

    if (collections.find(c => c.name === 'users')) {
      const result = await mongoose.connection.db.collection('users').deleteMany({
        email: { $nin: usersToKeep }
      });
      console.log(`✅ Cleaned old users: deleted ${result.deletedCount} user documents`);
    }

    console.log('\n🎉 Database cleanup completed!');
    console.log('Your database now only contains the admin users you just created.');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the cleanup
cleanupDatabase();