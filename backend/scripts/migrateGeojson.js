const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const Host = require('../models/Host');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const hosts = await Host.find({});
    let migrated = 0;

    for (const host of hosts) {
      // Check if it's using the old format (object with lat/lng)
      if (host.location && host.location.coordinates && host.location.coordinates.lat !== undefined) {
        const lat = host.location.coordinates.lat;
        const lng = host.location.coordinates.lng;

        // Use direct MongoDB update to avoid mongoose validation issues during migration
        await mongoose.connection.collection('hosts').updateOne(
          { _id: host._id },
          {
            $set: {
              'location.type': 'Point',
              'location.coordinates': [lng, lat]
            }
          }
        );
        migrated++;
      }
    }

    console.log(`Migration complete! Migrated ${migrated} hosts to GeoJSON format.`);
    
    // Re-create the 2dsphere index to be safe
    console.log('Re-creating 2dsphere index...');
    await mongoose.connection.collection('hosts').dropIndex('location.coordinates_2dsphere').catch(e => {
        // Ignore if it doesn't exist
    });
    await mongoose.connection.collection('hosts').createIndex({ "location.coordinates": "2dsphere" });
    
    console.log('Index created.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
