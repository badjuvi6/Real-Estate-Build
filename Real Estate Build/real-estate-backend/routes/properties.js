// real-estate-app/backend/routes/properties.js

const express = require('express');
const router = express.Router(); // Create a new Express router instance
const mongoose = require('mongoose'); // Needed to validate :id params are well-formed ObjectIds
const Property = require('../models/Property'); // Import the Property Mongoose model
const cloudinary = require('cloudinary').v2; // Import Cloudinary v2 for upload operations
const multer = require('multer'); // Import Multer for handling multipart/form-data (file uploads)

// --- Multer Configuration for File Uploads ---
// Configures Multer to store uploaded files in memory as buffers.
// This is suitable when immediately sending files to a cloud storage service like Cloudinary.
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5 MB (5 * 1024 * 1024 bytes)
    fileFilter: (req, file, cb) => {
        // Basic file type validation: only allow image files.
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Accept the file
        } else {
            // Reject the file and provide an error message
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// --- Multipart form-data helper ---
// POST/PUT below accept multipart/form-data (required for the image file
// upload), which flattens every field to a plain string - arrays and
// objects (amenities, agent) can't be sent as-is. The client instead sends
// those as JSON-encoded strings (e.g. formData.append('amenities',
// JSON.stringify([...]))), and this parses them back, falling back to a
// safe default rather than throwing on malformed input.
function parseJSONField(value, fallback) {
    if (value === undefined) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

// Escapes regex special characters in free-text user input before it's
// used to build a RegExp. Without this, a search containing e.g. "(" or "*"
// would throw (or worse, behave unexpectedly) instead of being matched
// literally.
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Shared query-filter builder ---
// Used by GET / and GET /radius so the two endpoints stay in sync instead
// of maintaining separate copies of the same validation logic.
//
// Supported query params:
//   search - case-insensitive partial match against title/description/address
//   propertyType - must match one of Property.PROPERTY_TYPES
//   minPrice / maxPrice - inclusive price bounds
//   bedrooms / bathrooms - treated as a MINIMUM (e.g. bedrooms=3 -> "3+"),
//     matching the frontend's "Any / 1+ / 2+ / 3+ / 4+" selector buttons
//   lat / lng / radius - OPTIONAL geo filter (radius in km). All three or
//     none - a partial pair (e.g. lat without lng) is treated as a mistake
//     rather than silently ignored. GET /radius requires these three and
//     validates that requirement itself before calling this function; here
//     they're optional so GET / can combine a geo filter with every other
//     filter above in one request.
//
// Returns { filter } on success or { error } (a string ready for a 400
// response) if a param fails validation.
function buildFilterFromQuery(query) {
    const { search, propertyType, minPrice, maxPrice, bedrooms, bathrooms, lat, lng, radius } = query;
    const filter = {};

    if (search !== undefined && search.trim() !== '') {
        // Regex rather than a MongoDB $text index deliberately: $text does
        // whole-word/stemmed matching, so searching "mia" would NOT match
        // "Miami" - a poor fit for an as-you-type search box. The trade-off
        // is that an unanchored regex can't use an index (full collection
        // scan). Fine at this dataset's size; if the collection grows large
        // enough for that to matter, this is the line to revisit - either a
        // $text index (worse partial-match UX, better performance) or an
        // external search service (Atlas Search, Algolia, etc.).
        const pattern = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [{ title: pattern }, { description: pattern }, { address: pattern }];
    }

    if (propertyType !== undefined) {
        if (!Property.PROPERTY_TYPES.includes(propertyType)) {
            return { error: `Invalid propertyType. Must be one of: ${Property.PROPERTY_TYPES.join(', ')}` };
        }
        filter.propertyType = propertyType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) {
            const min = Number(minPrice);
            if (Number.isNaN(min) || min < 0) {
                return { error: 'minPrice must be a non-negative number' };
            }
            filter.price.$gte = min;
        }
        if (maxPrice !== undefined) {
            const max = Number(maxPrice);
            if (Number.isNaN(max) || max < 0) {
                return { error: 'maxPrice must be a non-negative number' };
            }
            filter.price.$lte = max;
        }
    }

    if (bedrooms !== undefined) {
        const minBeds = Number(bedrooms);
        if (Number.isNaN(minBeds) || minBeds < 0) {
            return { error: 'bedrooms must be a non-negative number' };
        }
        filter.bedrooms = { $gte: minBeds };
    }

    // Not explicitly requested alongside bedrooms, but added for parity -
    // the frontend's Bathrooms selector sends the same shape of value and
    // would otherwise have nothing to filter against server-side.
    if (bathrooms !== undefined) {
        const minBaths = Number(bathrooms);
        if (Number.isNaN(minBaths) || minBaths < 0) {
            return { error: 'bathrooms must be a non-negative number' };
        }
        filter.bathrooms = { $gte: minBaths };
    }

    const geoParamsGiven = [lat, lng, radius].filter((v) => v !== undefined).length;
    if (geoParamsGiven > 0) {
        if (geoParamsGiven < 3) {
            return { error: 'lat, lng, and radius must all be provided together for a geo search' };
        }

        const latitude = Number(lat);
        const longitude = Number(lng);
        const radiusKm = Number(radius);

        if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
            return { error: 'lat must be a number between -90 and 90' };
        }
        if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
            return { error: 'lng must be a number between -180 and 180' };
        }
        if (Number.isNaN(radiusKm) || radiusKm <= 0) {
            return { error: 'radius must be a positive number of kilometers' };
        }

        // $centerSphere expects the radius in radians, not km/miles, hence
        // the division by Earth's approximate radius (in the same unit).
        const EARTH_RADIUS_KM = 6378.1;
        const radiusInRadians = radiusKm / EARTH_RADIUS_KM;

        filter.location = {
            $geoWithin: {
                // $centerSphere takes [[lng, lat], radiusInRadians] - same
                // GeoJSON [lng, lat] order as everywhere else in this file.
                $centerSphere: [[longitude, latitude], radiusInRadians]
            }
        };
    }

    return { filter };
}

// --- API Endpoints for Property Management (CRUD Operations) ---

// 1. GET all properties, optionally filtered: /api/properties
//    /api/properties?search=miami&propertyType=House&minPrice=200000&maxPrice=600000&bedrooms=3&bathrooms=2
//    /api/properties?lat=25.76&lng=-80.19&radius=25   <- combinable with any of the above too
router.get('/', async (req, res) => {
    try {
        const { filter, error } = buildFilterFromQuery(req.query);
        if (error) {
            return res.status(400).json({ message: error });
        }
        // Find all matching documents and sort them by 'createdAt' in descending order (newest first).
        const properties = await Property.find(filter).sort({ createdAt: -1 });
        res.json(properties); // Send the retrieved properties as a JSON array in the response.
    } catch (err) {
        // If an error occurs during the database operation, send a 500 (Internal Server Error) status
        // along with a JSON object containing the error message.
        res.status(500).json({ message: err.message });
    }
});

// 2. GET properties within a radius: /api/properties/radius
//    /api/properties/radius?lat=25.76&lng=-80.19&radius=25 (radius in km)
//    Accepts the same optional search/propertyType/minPrice/maxPrice/
//    bedrooms/bathrooms params as GET / above, combined with the geo bound.
//
//    As of the search/geo update above, GET / can do everything this route
//    does (just pass lat/lng/radius to it directly) - this route is kept
//    for backward compatibility with anything already calling it, and is
//    now a thin wrapper: it only adds the "lat/lng/radius are REQUIRED
//    here" check, then delegates the actual filter-building (including the
//    $geoWithin clause) to the same buildFilterFromQuery used everywhere
//    else, rather than keeping a second copy of that math.
//
//    IMPORTANT: this route MUST be declared before GET /:id below - Express
//    matches routes top-to-bottom, and /:id would otherwise swallow this
//    path by treating "radius" as the :id value.
router.get('/radius', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (lat === undefined || lng === undefined || radius === undefined) {
            return res.status(400).json({ message: 'lat, lng, and radius (in km) query parameters are all required' });
        }

        const { filter, error } = buildFilterFromQuery(req.query);
        if (error) {
            return res.status(400).json({ message: error });
        }

        const properties = await Property.find(filter).sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET a single property by ID: /api/properties/:id
// Fetches full details for a single property listing (used by the
// PropertyDetailPage on the frontend).
router.get('/:id', async (req, res) => {
    try {
        // Validate the ID's shape BEFORE querying. Without this check,
        // Mongoose throws a CastError for a malformed ID (wrong length,
        // non-hex characters, etc.), which would otherwise fall into the
        // catch block below and get reported as a generic 500 - that's
        // misleading, since the request itself was malformed, not the
        // server. A well-formed-but-nonexistent ID still reaches the
        // findById() below and correctly falls through to the 404 case.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid property ID format' });
        }

        // Find a property document by its ID, which is extracted from the URL parameters (req.params.id).
        const property = await Property.findById(req.params.id);
        if (!property) {
            // Well-formed ID, but no document with that ID exists.
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json(property); // Send the found property as JSON.
    } catch (err) {
        // Any other failure (e.g. a database connectivity issue).
        res.status(500).json({ message: err.message });
    }
});


// 4. POST a new property: /api/properties
// Creates a new property listing, handling image upload to Cloudinary.
// `upload.single('image')` is a Multer middleware that processes a single file upload
// from a form field named 'image'. The file data will be available in `req.file`.
router.post('/', upload.single('image'), async (req, res) => {
    let imageUrl = ''; // Initialize imageUrl to an empty string

    // Check if a file was uploaded via the 'image' field
    if (req.file) {
        try {
            // Upload the image buffer (from memory storage) to Cloudinary.
            // The `data:` URI scheme is used to represent the buffer as a file.
            const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                folder: 'realestate_listings_app' // Optional: Organize uploads into a specific folder on Cloudinary
            });
            imageUrl = result.secure_url; // Cloudinary returns a secure URL for the uploaded image
        } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            // If image upload fails, return a 500 error and prevent property creation
            return res.status(500).json({ message: 'Image upload failed: ' + uploadError.message });
        }
    }

    // Create a new Property instance using data from the request body (text fields)
    // and the obtained imageUrl (from Cloudinary or empty if no file was uploaded).
    const property = new Property({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        address: req.body.address,
        propertyType: req.body.propertyType,
        bedrooms: req.body.bedrooms,
        bathrooms: req.body.bathrooms,
        area: req.body.area,
        yearBuilt: req.body.yearBuilt,
        imageUrl: imageUrl, // Store the Cloudinary URL in the database
        // Gallery photos, amenities, and agent info are structured data sent
        // as JSON strings over multipart/form-data - see parseJSONField above.
        images: parseJSONField(req.body.images, []),
        amenities: parseJSONField(req.body.amenities, []),
        agent: parseJSONField(req.body.agent, undefined)
    });

    // location (GeoJSON) is handled separately: this route accepts
    // multipart/form-data (for the image upload), which flattens all
    // fields to strings and can't carry a nested object directly. The
    // client should send plain `latitude` / `longitude` fields instead;
    // we assemble the GeoJSON point from those here. Both are optional -
    // a property can be saved without coordinates and simply won't show
    // up in /radius results until it's geocoded.
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
        const latitude = Number(req.body.latitude);
        const longitude = Number(req.body.longitude);
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
            property.location = { coordinates: [longitude, latitude] };
        }
    }

    try {
        // Save the new property document to the MongoDB database.
        const newProperty = await property.save();
        // Respond with a 201 (Created) status code and the data of the newly created property.
        res.status(201).json(newProperty);
    } catch (err) {
        // If validation fails (e.g., a 'required' field is missing), Mongoose throws an error.
        // Send a 400 (Bad Request) status with the error message.
        res.status(400).json({ message: err.message });
    }
});

// 5. PUT (Update) an existing property: /api/properties/:id
// Updates an existing property listing, also handling image re-upload if a new file is provided.
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        // Find the property by ID that needs to be updated.
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Handle image update if a new file is provided in the request
        if (req.file) {
            try {
                // Optional: If you want to delete the old image from Cloudinary,
                // you would need to store the `public_id` returned by Cloudinary during initial upload
                // in your MongoDB model. Then use `cloudinary.uploader.destroy(publicId)`.
                // For simplicity here, we're just uploading a new one and updating the URL.
                const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                    folder: 'realestate_listings_app' // Same folder as during creation
                });
                property.imageUrl = result.secure_url; // Update property's imageUrl with the new Cloudinary URL
            } catch (uploadError) {
                console.error("Cloudinary re-upload error:", uploadError);
                return res.status(500).json({ message: 'Image update failed: ' + uploadError.message });
            }
        }
        // IMPORTANT: If no new file is uploaded (`req.file` is null), the `imageUrl` in the database
        // remains unchanged. If you want to allow *clearing* an image without uploading a new one,
        // you'd need a separate mechanism (e.g., a "Clear Image" checkbox/button on frontend).

        // Update other property fields if new values are provided in the request body.
        // Using `!= null` checks for both `undefined` and `null`, allowing empty strings for fields like title if needed.
        if (req.body.title != null) property.title = req.body.title;
        if (req.body.description != null) property.description = req.body.description;
        // For price, explicitly check `!== undefined` to allow updating to 0.
        if (req.body.price !== undefined) property.price = req.body.price;
        if (req.body.address != null) property.address = req.body.address;
        if (req.body.propertyType != null) property.propertyType = req.body.propertyType;
        if (req.body.bedrooms !== undefined) property.bedrooms = req.body.bedrooms;
        if (req.body.bathrooms !== undefined) property.bathrooms = req.body.bathrooms;
        if (req.body.area !== undefined) property.area = req.body.area;
        if (req.body.yearBuilt !== undefined) property.yearBuilt = req.body.yearBuilt;
        // Structured fields sent as JSON strings - see parseJSONField above.
        // Only touched when actually present in the request, so a PUT that
        // doesn't mention `amenities` leaves the existing list untouched.
        if (req.body.images !== undefined) property.images = parseJSONField(req.body.images, property.images);
        if (req.body.amenities !== undefined) property.amenities = parseJSONField(req.body.amenities, property.amenities);
        if (req.body.agent !== undefined) property.agent = parseJSONField(req.body.agent, property.agent);

        // Same multipart limitation as the POST route above - lat/lng come
        // in as separate flat fields and are assembled into a GeoJSON point.
        if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
            const latitude = Number(req.body.latitude);
            const longitude = Number(req.body.longitude);
            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                property.location = { coordinates: [longitude, latitude] };
            }
        }

        // Save the updated property document. The pre-save hook in the model will update 'updatedAt'.
        const updatedProperty = await property.save();
        res.json(updatedProperty); // Send the updated property data as JSON.
    } catch (err) {
        // Send a 400 (Bad Request) for validation errors during the update process.
        res.status(400).json({ message: err.message });
    }
});

// 6. DELETE a property: /api/properties/:id
// Deletes a property listing identified by its ID.
router.delete('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Optional: Delete the image from Cloudinary when the property is deleted.
        // This requires storing the Cloudinary 'public_id' in your MongoDB model
        // when the image is first uploaded.
        // if (property.imageUrl && property.imageUrl.includes('res.cloudinary.com')) {
        //     // Example: Extract public_id from Cloudinary URL (adjust based on your URL structure)
        //     const publicId = property.imageUrl.split('/').pop().split('.')[0]; // basic extraction
        //     await cloudinary.uploader.destroy(`realestate_listings_app/${publicId}`); // Delete from Cloudinary
        //     console.log('Deleted image from Cloudinary:', publicId);
        // }

        // Delete the property document from MongoDB
        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: 'Property deleted successfully' }); // Confirm successful deletion.
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; // Export the router to be used by server.js
