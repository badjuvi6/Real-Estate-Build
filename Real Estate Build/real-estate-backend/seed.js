// real-estate-app/backend/seed.js
//
// Quick database seed for local/manual testing of the horizontal filters,
// the map/split views, and the Phase 3 property details page.
//
// Usage:
//   node seed.js
//   (or: npm run seed)
//
// WARNING: by default this DELETES every existing document in the
// `properties` collection before inserting the sample data below. Set
// DROP_EXISTING to false if you want to keep what's already there.
//
// MIGRATION NOTE: if you already have properties in this database from
// before the Phase 1.5 update, they were saved with a plain string
// `location` field. That field has since been renamed to `address`, and
// `location` is now reserved for the GeoJSON point. Those older documents
// will still load fine (every new field is optional-safe), but their
// address text won't show up until you either reseed or run a one-time
// migration renaming `location` -> `address` and adding real coordinates.
// Ask if you'd like that migration script written.

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');

const DROP_EXISTING = true;

// GeoJSON uses [longitude, latitude] order - the opposite of how most
// map UIs display coordinates. This helper exists mainly so that order
// only has to be gotten right once, here.
const point = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

// Three fictional agents, reused across listings. No photoUrl on purpose -
// the frontend falls back to an initials avatar, which sidesteps needing
// stock headshots for made-up people entirely.
const AGENTS = {
    jamie: { name: 'Jamie Rivera', phone: '(555) 010-1234', email: 'jamie.rivera@dreamhomes.example' },
    morgan: { name: 'Morgan Chen', phone: '(555) 010-5678', email: 'morgan.chen@dreamhomes.example' },
    priya: { name: 'Priya Patel', phone: '(555) 010-9012', email: 'priya.patel@dreamhomes.example' }
};

// A small rotating pool of extra gallery photos, layered on top of each
// property's single cover `imageUrl` to populate the Phase 3 image gallery.
const GALLERY_POOL = [
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=800'
];
const galleryFor = (i) => [GALLERY_POOL[i % GALLERY_POOL.length], GALLERY_POOL[(i + 1) % GALLERY_POOL.length]];

const sampleProperties = [
    {
        title: 'Sunny Downtown Loft',
        description: 'Bright open-plan loft with exposed brick, steps from the Brickell financial district.',
        price: 425000,
        address: 'Brickell, Miami, FL',
        location: point(-80.1918, 25.7617),
        propertyType: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        area: 780,
        yearBuilt: 2005,
        amenities: ['Elevator', 'Laundry', 'Air Conditioning', 'Wi-Fi'],
        agent: AGENTS.jamie,
        imageUrl: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(0)
    },
    {
        title: 'Modern Family Home with Pool',
        description: 'Four-bedroom single-family home with a private pool and a two-car garage.',
        price: 675000,
        address: 'Coral Gables, Miami, FL',
        location: point(-80.2581, 25.7215),
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 3,
        area: 2650,
        yearBuilt: 1998,
        amenities: ['Garage', 'Pool', 'Backyard', 'Air Conditioning', 'Fireplace'],
        agent: AGENTS.morgan,
        imageUrl: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(1)
    },
    {
        title: 'Cozy Studio Near the Beach',
        description: 'Compact studio condo two blocks from South Beach, ideal as a rental investment.',
        price: 289000,
        address: 'South Beach, Miami, FL',
        location: point(-80.1300, 25.7826),
        propertyType: 'Condo',
        bedrooms: 0,
        bathrooms: 1,
        area: 540,
        yearBuilt: 2011,
        amenities: ['Gym', 'Doorman', 'Security', 'Air Conditioning'],
        agent: AGENTS.priya,
        imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(2)
    },
    {
        title: 'Townhouse with Rooftop Terrace',
        description: 'Three-story townhouse with a private rooftop terrace and skyline views.',
        price: 549000,
        address: 'Wynwood, Miami, FL',
        location: point(-80.1997, 25.8010),
        propertyType: 'Townhouse',
        bedrooms: 3,
        bathrooms: 2,
        area: 1950,
        yearBuilt: 2016,
        amenities: ['Garage', 'Rooftop Terrace', 'Air Conditioning', 'Security'],
        agent: AGENTS.jamie,
        imageUrl: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(3)
    },
    {
        title: 'Waterfront Vacant Lot',
        description: 'Half-acre buildable lot with direct canal access; permits in progress.',
        price: 310000,
        address: 'Coconut Grove, Miami, FL',
        location: point(-80.2436, 25.7282),
        propertyType: 'Land',
        bedrooms: 0,
        bathrooms: 0,
        // No area/yearBuilt/amenities - there's no structure on a vacant
        // lot yet. Deliberately left this way as a real test case for how
        // the detail page handles fields that genuinely don't apply.
        agent: AGENTS.morgan,
        imageUrl: 'https://images.pexels.com/photos/974355/pexels-photo-974355.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(4)
    },
    {
        title: 'Suburban Two-Story House',
        description: 'Quiet cul-de-sac home with a fenced backyard, great for families.',
        price: 512000,
        address: 'Kendall, Miami, FL',
        location: point(-80.3211, 25.6795),
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        area: 1980,
        yearBuilt: 2003,
        amenities: ['Garage', 'Backyard', 'Air Conditioning'],
        agent: AGENTS.priya,
        imageUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(5)
    },
    {
        title: 'Luxury High-Rise Condo',
        description: 'Two-bedroom condo with floor-to-ceiling windows and bay views.',
        price: 890000,
        address: 'Brickell, Miami, FL',
        location: point(-80.1889, 25.7654),
        propertyType: 'Condo',
        bedrooms: 2,
        bathrooms: 2,
        area: 1350,
        yearBuilt: 2019,
        amenities: ['Gym', 'Doorman', 'Elevator', 'Pool', 'Security'],
        agent: AGENTS.jamie,
        imageUrl: 'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(0)
    },
    {
        title: 'Charming Apartment near Wynwood Walls',
        description: 'One-bedroom apartment in a converted warehouse, walking distance to galleries.',
        price: 335000,
        address: 'Wynwood, Miami, FL',
        location: point(-80.1990, 25.8050),
        propertyType: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        area: 810,
        yearBuilt: 2008,
        amenities: ['Elevator', 'Air Conditioning', 'Wi-Fi'],
        agent: AGENTS.morgan,
        imageUrl: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(1)
    },
    {
        title: 'Orlando Family Townhouse',
        description: 'Spacious townhouse near the theme park corridor, community pool included.',
        price: 398000,
        address: 'Lake Nona, Orlando, FL',
        location: point(-81.2001, 28.3772),
        propertyType: 'Townhouse',
        bedrooms: 3,
        bathrooms: 3,
        area: 2100,
        yearBuilt: 2014,
        amenities: ['Garage', 'Pool', 'Air Conditioning', 'Security'],
        agent: AGENTS.priya,
        imageUrl: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(2)
    },
    {
        title: 'Orlando Starter House',
        description: 'Affordable three-bedroom home with a recently renovated kitchen and bathrooms.',
        price: 349000,
        address: 'Winter Park, Orlando, FL',
        location: point(-81.3392, 28.5999),
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        area: 1720,
        yearBuilt: 1992,
        amenities: ['Garage', 'Backyard', 'Fireplace'],
        agent: AGENTS.jamie,
        imageUrl: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(3)
    },
    {
        title: 'Development-Ready Land Parcel',
        description: 'Two-acre parcel zoned for mixed-use development near downtown Orlando.',
        price: 275000,
        address: 'Downtown Orlando, FL',
        location: point(-81.3792, 28.5421),
        propertyType: 'Land',
        bedrooms: 0,
        bathrooms: 0,
        agent: AGENTS.morgan,
        imageUrl: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(4)
    },
    {
        title: 'Modern Condo with Lake View',
        description: 'Two-bedroom condo overlooking Lake Eola, walk to restaurants and parks.',
        price: 465000,
        address: 'Downtown Orlando, FL',
        location: point(-81.3731, 28.5457),
        propertyType: 'Condo',
        bedrooms: 2,
        bathrooms: 2,
        area: 1280,
        yearBuilt: 2017,
        amenities: ['Gym', 'Elevator', 'Pool', 'Security', 'Wi-Fi'],
        agent: AGENTS.priya,
        imageUrl: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
        images: galleryFor(5)
    }
];

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
        console.log(`  - ${p.title} | ${p.propertyType} | ${p.bedrooms}bd/${p.bathrooms}ba | $${p.price.toLocaleString()} | id: ${p._id}`);
    });

    // 8 of the 12 properties above are clustered in the Miami area (within
    // roughly 20km of downtown Brickell); the other 4 sit in Orlando, about
    // 350km north. That split makes it easy to sanity-check the radius
    // endpoint - a 25km search from Miami should return only the Miami
    // cluster, and widening past ~350km should pull in the Orlando group too.
    console.log('\nTry the endpoints:');
    console.log('  GET /api/properties?propertyType=House&minPrice=300000&maxPrice=600000&bedrooms=3');
    console.log('  GET /api/properties/radius?lat=25.76&lng=-80.19&radius=25');
    console.log(`  GET /api/properties/${inserted[0]._id}   <- try this one in the browser or PropertyDetailPage`);

    await mongoose.disconnect();
    console.log('\nDone. Disconnected from MongoDB.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
