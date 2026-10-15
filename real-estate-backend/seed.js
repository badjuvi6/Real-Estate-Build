// real-estate-app/backend/seed.js
//
// Quick database seed for local/manual testing - 15 listings across Ghana
// (Accra, Kumasi, Takoradi, Cape Coast, Tamale), plus two demo accounts.
//
// Usage:
//   node seed.js
//   (or: npm run seed)
//
// WARNING: by default this DELETES every existing document in the
// `properties` and `users` collections before inserting the data below.
// Set DROP_EXISTING to false if you want to keep what's already there.
//
// IMAGE SOURCING NOTE: cover/gallery photos are free stock photography
// (Unsplash + Pexels), not photos of real Ghanaian properties - these are
// fictional listings. None of these URLs could be fetch-verified from the
// environment this was written in, so the frontend's <img onError>
// fallback (utils/property.js) is the safety net for any that have gone
// dead. To replace one, edit PHOTO_POOL below - it's the only place photos
// are defined. panoramaUrl values are Pannellum's official open-source
// demo panoramas (pannellum.org/images/) - genuine equirectangular 360
// images referenced throughout Pannellum's own documentation, though not
// of these specific fictional properties either.

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');
const User = require('./models/User');

const DROP_EXISTING = true;

// GeoJSON uses [longitude, latitude] order - the opposite of how most
// map UIs display coordinates.
const point = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

// Three fictional Ghanaian agents. No photoUrl on purpose - the frontend
// falls back to an initials avatar, sidestepping needing stock headshots
// for made-up people entirely.
const AGENTS = {
    kwame: { name: 'Kwame Mensah', phone: '+233 24 123 4567', email: 'kwame.mensah@dreamhomes.example' },
    ama: { name: 'Ama Owusu', phone: '+233 20 234 5678', email: 'ama.owusu@dreamhomes.example' },
    kofi: { name: 'Kofi Boateng', phone: '+233 55 345 6789', email: 'kofi.boateng@dreamhomes.example' }
};

// Every listing's photos come from this one pool. The first two are the
// Unsplash photos from the original spec; the rest are Pexels photos
// carried over from earlier seed data. Mixing sources means one host
// having a bad day can't empty a listing.
const PHOTO_POOL = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800'
];

// A cover photo plus 3 gallery photos = 4 per listing, taken as four
// CONSECUTIVE pool entries starting at a different offset per listing -
// consecutive entries are always distinct (the pool is longer than 4), so
// no listing ever repeats a photo or has its cover duplicated in its
// gallery, and neighboring listings don't all show the same set.
const imageSetFor = (i) => {
    const at = (k) => PHOTO_POOL[(i * 3 + k) % PHOTO_POOL.length];
    return { imageUrl: at(0), images: [at(1), at(2), at(3)] };
};

// Real, verified equirectangular panoramas (Pannellum's own official demo
// images - see note at top of file), rotated across listings.
const PANORAMAS = [
    'https://pannellum.org/images/alma.jpg',
    'https://pannellum.org/images/tocopilla.jpg',
    'https://pannellum.org/images/charles-street.jpg'
];
const panoramaFor = (i) => PANORAMAS[i % PANORAMAS.length];

const rawProperties = [
    {
        title: 'Elegant 5-Bedroom House in East Legon',
        description: 'Spacious family home on a quiet street in East Legon, close to A&C Mall and the American International School. Fitted kitchen, boys\u2019 quarters, and a backup generator for uninterrupted power.',
        price: 2800000,
        currency: 'GHS',
        address: 'East Legon, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1465, 5.6356),
        propertyType: 'House',
        bedrooms: 5,
        bathrooms: 5,
        areaSqFt: 4200,
        yearBuilt: 2017,
        amenities: ['Boys\u2019 Quarters', 'Backup Generator', 'Borehole', 'Fitted Kitchen', 'Gated Community', '24-Hour Security'],
        agent: AGENTS.kwame,
        panoramaUrl: panoramaFor(0)
    },
    {
        title: 'Luxury 4-Bedroom Villa in Cantonments',
        description: 'Gated villa in Accra\u2019s diplomatic enclave, minutes from embassies and Cantonments Market. Private pool, landscaped garden, and a dedicated staff apartment.',
        price: 650000,
        currency: 'USD',
        address: 'Cantonments, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1769, 5.5786),
        propertyType: 'Villa',
        bedrooms: 4,
        bathrooms: 4,
        areaSqFt: 3800,
        yearBuilt: 2019,
        amenities: ['Swimming Pool', 'Backup Generator', 'Gated Community', '24-Hour Security', 'Air Conditioning', 'Boys\u2019 Quarters'],
        agent: AGENTS.ama,
        panoramaUrl: panoramaFor(1)
    },
    {
        title: 'Modern 3-Bedroom Apartment in Airport Residential',
        description: 'Contemporary apartment close to Kotoka International Airport and Airport City\u2019s business district - a popular choice for frequent travelers and expatriates.',
        price: 320000,
        currency: 'USD',
        address: 'Airport Residential, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1802, 5.6022),
        propertyType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 2100,
        yearBuilt: 2020,
        amenities: ['Backup Generator', 'Elevator', 'Gym', '24-Hour Security', 'Air Conditioning'],
        agent: AGENTS.kofi,
        panoramaUrl: panoramaFor(2)
    },
    {
        title: 'Charming 4-Bedroom House in Labone',
        description: 'Well-maintained family home in leafy Labone, within walking distance of Labadi Beach and the Trade Fair Centre.',
        price: 1950000,
        currency: 'GHS',
        address: 'Labone, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1622, 5.5562),
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 3,
        areaSqFt: 3100,
        yearBuilt: 2014,
        amenities: ['Backup Generator', 'Borehole', 'Fitted Kitchen', 'Gated Community'],
        agent: AGENTS.kwame,
        panoramaUrl: panoramaFor(0)
    },
    {
        title: 'Cozy 3-Bedroom Apartment in Dzorwulu',
        description: 'Well-located apartment in Dzorwulu, close to Stanbic Heights and the Dzorwulu roundabout\u2019s restaurants and shops.',
        price: 980000,
        currency: 'GHS',
        address: 'Dzorwulu, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1982, 5.6145),
        propertyType: 'Apartment',
        bedrooms: 3,
        bathrooms: 2,
        areaSqFt: 1850,
        yearBuilt: 2016,
        amenities: ['Backup Generator', 'Fitted Kitchen', 'Air Conditioning', '24-Hour Security'],
        agent: AGENTS.ama,
        panoramaUrl: panoramaFor(1)
    },
    {
        title: 'Prime Commercial Space in Spintex',
        description: 'Ground-floor retail/office space along the busy Spintex Road corridor, ideal for a showroom, supermarket, or bank branch. High foot and vehicle traffic.',
        price: 1600000,
        currency: 'GHS',
        address: 'Spintex, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.0982, 5.6312),
        propertyType: 'Commercial',
        bedrooms: 0,
        bathrooms: 2,
        areaSqFt: 5200,
        yearBuilt: 2018,
        amenities: ['Backup Generator', 'Ample Parking', 'Air Conditioning', '24-Hour Security'],
        agent: AGENTS.kofi,
        panoramaUrl: panoramaFor(2)
    },
    {
        title: 'Spacious 3-Bedroom House in Tema Community 18',
        description: 'Family home in Tema, close to the harbor and Tema Motorway, with a generous backyard and borehole water supply.',
        price: 1150000,
        currency: 'GHS',
        address: 'Community 18, Tema',
        city: 'Tema',
        region: 'Greater Accra',
        location: point(0.0, 5.6667),
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        areaSqFt: 2400,
        yearBuilt: 2012,
        amenities: ['Borehole', 'Backup Generator', 'Fitted Kitchen'],
        agent: AGENTS.kwame,
        panoramaUrl: panoramaFor(0)
    },
    {
        title: 'Classic 4-Bedroom House in Ahodwo',
        description: 'Well-built family house in Ahodwo, Kumasi, a short drive from KNUST and Ahodwo Roundabout\u2019s shopping and dining.',
        price: 1350000,
        currency: 'GHS',
        address: 'Ahodwo, Kumasi',
        city: 'Kumasi',
        region: 'Ashanti',
        location: point(-1.6244, 6.6666),
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 3,
        areaSqFt: 2900,
        yearBuilt: 2015,
        amenities: ['Backup Generator', 'Borehole', 'Gated Community', 'Fitted Kitchen'],
        agent: AGENTS.ama,
        panoramaUrl: panoramaFor(1)
    },
    {
        title: 'Upscale 5-Bedroom Villa in Nhyiaeso',
        description: 'One of Kumasi\u2019s most sought-after addresses - a gated villa with a swimming pool and manicured gardens in Nhyiaeso.',
        price: 420000,
        currency: 'USD',
        address: 'Nhyiaeso, Kumasi',
        city: 'Kumasi',
        region: 'Ashanti',
        location: point(-1.6333, 6.6833),
        propertyType: 'Villa',
        bedrooms: 5,
        bathrooms: 5,
        areaSqFt: 4500,
        yearBuilt: 2021,
        amenities: ['Swimming Pool', 'Backup Generator', 'Gated Community', '24-Hour Security', 'Boys\u2019 Quarters'],
        agent: AGENTS.kofi,
        panoramaUrl: panoramaFor(2)
    },
    {
        title: 'Oceanfront 3-Bedroom Apartment on Beach Road',
        description: 'Rare oceanfront apartment on Takoradi\u2019s Beach Road, with direct sea views - a short drive from the Takoradi Harbour and the city\u2019s oil-and-gas business district.',
        price: 890000,
        currency: 'GHS',
        address: 'Beach Road, Takoradi',
        city: 'Takoradi',
        region: 'Western',
        location: point(-1.755, 4.888),
        propertyType: 'Apartment',
        bedrooms: 3,
        bathrooms: 2,
        areaSqFt: 2000,
        yearBuilt: 2019,
        amenities: ['Ocean View', 'Backup Generator', 'Air Conditioning', '24-Hour Security'],
        agent: AGENTS.kwame,
        panoramaUrl: panoramaFor(0)
    },
    {
        title: 'Comfortable 3-Bedroom House in Pedu',
        description: 'Family home in Pedu, Cape Coast, close to the University of Cape Coast and Pedu Estate\u2019s amenities.',
        price: 780000,
        currency: 'GHS',
        address: 'Pedu, Cape Coast',
        city: 'Cape Coast',
        region: 'Central',
        location: point(-1.27, 5.11),
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        areaSqFt: 1950,
        yearBuilt: 2013,
        amenities: ['Borehole', 'Backup Generator', 'Fitted Kitchen'],
        agent: AGENTS.ama,
        panoramaUrl: panoramaFor(1)
    },
    {
        title: 'Spacious 4-Bedroom House in Tamale',
        description: 'Generously sized family home in Tamale, the Northern Region\u2019s largest city, close to the central market and Tamale Teaching Hospital.',
        price: 650000,
        currency: 'GHS',
        address: 'Lamashegu, Tamale',
        city: 'Tamale',
        region: 'Northern',
        location: point(-0.8393, 9.4075),
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 3,
        areaSqFt: 2700,
        yearBuilt: 2011,
        amenities: ['Borehole', 'Backup Generator', 'Fitted Kitchen', 'Ample Parking'],
        agent: AGENTS.kofi,
        panoramaUrl: panoramaFor(2)
    },
    {
        title: 'Compact 2-Bedroom Apartment in East Legon',
        description: 'A more affordable entry point into East Legon - ideal for young professionals, close to the Lagos Avenue strip of restaurants and cafes.',
        price: 680000,
        currency: 'GHS',
        address: 'East Legon Hills, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.141, 5.639),
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1200,
        yearBuilt: 2022,
        amenities: ['Backup Generator', 'Gym', 'Air Conditioning', '24-Hour Security'],
        agent: AGENTS.kwame,
        panoramaUrl: panoramaFor(0)
    },
    {
        title: 'Boutique Office Space in Cantonments',
        description: 'Small-footprint office space in a converted Cantonments residence, popular with consultancies and NGOs for its quiet, prestigious address.',
        price: 240000,
        currency: 'USD',
        address: 'Cantonments, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1739, 5.581),
        propertyType: 'Commercial',
        bedrooms: 0,
        bathrooms: 2,
        areaSqFt: 1800,
        yearBuilt: 2010,
        amenities: ['Backup Generator', 'Ample Parking', 'Air Conditioning', '24-Hour Security'],
        agent: AGENTS.ama,
        panoramaUrl: panoramaFor(1)
    },
    {
        title: 'Executive 4-Bedroom Villa in Airport Residential',
        description: 'Executive villa close to Kotoka International Airport, with a private garden, staff quarters, and dedicated off-street parking for three vehicles.',
        price: 480000,
        currency: 'USD',
        address: 'Airport Residential, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        location: point(-0.1825, 5.605),
        propertyType: 'Villa',
        bedrooms: 4,
        bathrooms: 4,
        areaSqFt: 3600,
        yearBuilt: 2020,
        amenities: ['Swimming Pool', 'Backup Generator', 'Gated Community', '24-Hour Security', 'Boys\u2019 Quarters', 'Ample Parking'],
        agent: AGENTS.kofi,
        panoramaUrl: panoramaFor(2)
    }
];

const sampleProperties = rawProperties.map((property, i) => ({ ...property, ...imageSetFor(i) }));

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Add it to backend/.env before seeding.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(`Connected to MongoDB (${uri.includes('localhost') ? 'local' : 'remote'} instance).`);

    if (DROP_EXISTING) {
        const { deletedCount } = await Property.deleteMany({});
        console.log(`Removed ${deletedCount} existing properties.`);
    }

    const inserted = await Property.insertMany(sampleProperties);
    console.log(`\nSeeded ${inserted.length} properties:`);
    inserted.forEach((p) => {
        console.log(`  - ${p.title} | ${p.city} | ${p.propertyType} | ${p.bedrooms}bd/${p.bathrooms}ba | ${p.currency} ${p.price.toLocaleString()}`);
    });

    if (DROP_EXISTING) {
        const { deletedCount } = await User.deleteMany({});
        console.log(`\nRemoved ${deletedCount} existing users.`);
    }

    // IMPORTANT: User.create() (not insertMany) - insertMany bypasses
    // Mongoose's pre('save') hooks entirely, which is exactly where
    // password hashing happens (see models/User.js). Using insertMany here
    // would silently store these as plaintext passwords and break login.
    const demoUsers = await User.create([
        { name: 'Alex Morgan', email: 'buyer@example.com', password: 'password123', role: 'user' },
        // Same name as one of the fictional agent contacts embedded in the
        // property data above (AGENTS.kwame) - a thematic match only, not
        // an actual foreign-key link. Property.agent is denormalized
        // contact info, not a reference to a User document.
        { name: 'Kwame Mensah', email: 'agent@example.com', password: 'password123', role: 'agent' }
    ]);
    console.log(`\nSeeded ${demoUsers.length} demo accounts (password for both: "password123"):`);
    demoUsers.forEach((u) => console.log(`  - ${u.email} | role: ${u.role}`));

    // All 15 properties sit within Ghana, spread across 5 cities roughly
    // 400km apart at the extremes (Accra to Tamale) - good for testing the
    // radius filter at a few different scales.
    console.log('\nTry the endpoints:');
    console.log('  GET /api/properties?city=Accra&propertyType=House&minPrice=1000000&maxPrice=3000000');
    console.log('  GET /api/properties/radius?lat=5.6&lng=-0.18&radius=15   (Accra area)');
    console.log(`  GET /api/properties/${inserted[0]._id}`);
    console.log('  POST /api/auth/login  { "email": "buyer@example.com", "password": "password123" }');

    await mongoose.disconnect();
    console.log('\nDone. Disconnected from MongoDB.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
