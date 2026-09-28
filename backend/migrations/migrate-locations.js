require("dotenv").config();
const mongoose = require("mongoose");
const Incident = require("../models/Incident");

async function migrateLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const incidents = await Incident.find({
      "gpsLocation.latitude": { $exists: true, $ne: null, $type: "number" },
      "gpsLocation.longitude": { $exists: true, $ne: null, $type: "number" },
      geoLocation: { $exists: false }
    });

    console.log(`Found ${incidents.length} incidents to migrate.`);

    let migratedCount = 0;
    for (const incident of incidents) {
      const { latitude, longitude } = incident.gpsLocation;
      if (
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180 &&
        (latitude !== 0 || longitude !== 0)
      ) {
        incident.geoLocation = {
          type: "Point",
          coordinates: [longitude, latitude]
        };
        await incident.save();
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount} incidents.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
}

migrateLocations();
