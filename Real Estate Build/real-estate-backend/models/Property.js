// real-estate-app/backend/models/Property.js

const mongoose = require('mongoose');

// Single source of truth for allowed property types - reused by the
// filter validation in routes/properties.js so the two never drift apart.
const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'];

// GeoJSON Point sub-schema for geospatial ($geoWithin / $near) queries.
// `_id: false` keeps Mongoose from generating an _id for this nested doc.
//
// IMPORTANT: coordinates are [longitude, latitude] - GeoJSON order, which
// is the OPPOSITE of the [latitude, longitude] order most map UIs use.
const pointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
            validate: {
                validator: (coords) =>
                    Array.isArray(coords) &&
                    coords.length === 2 &&
                    coords[0] >= -180 && coords[0] <= 180 &&
                    coords[1] >= -90 && coords[1] <= 90,
                message: 'location.coordinates must be a [longitude, latitude] pair within valid ranges'
            }
        }
    },
    { _id: false }
);

// Denormalized listing-agent info embedded directly on the property. A
// normalized separate Agents collection (with properties referencing an
// agentId) would be the more "correct" design once agents are reused
// across many listings with their own login/dashboard - this embedded
// version is the pragmatic choice for now and can be migrated later
// without changing how the frontend reads `property.agent`.
const agentSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        photoUrl: { type: String, default: '' }
    },
    { _id: false }
);

// Define the schema for a real estate property document.
// This outlines the fields, their data types, and validation rules for documents in your MongoDB collection.
const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Title is a mandatory field
        trim: true      // Automatically remove leading/trailing whitespace from the title
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,         // Price must be a non-negative number
        // 'set' transform function: ensures price has at most two decimal places for consistency
        set: v => Math.round(v * 100) / 100
    },
    // Human-readable display string (e.g. "Miami, FL"), shown on cards and
    // used for simple text search on the frontend.
    //
    // NOTE: this field used to be called `location` and held this same
    // string. It's renamed to `address` here to free up the `location`
    // name for the GeoJSON point below, which is what MongoDB's geospatial
    // operators ($geoWithin, $near, etc.) expect a field literally named
    // for indexing purposes to be conventionally called. Existing documents
    // that still have a string `location` field (and nothing in `address`)
    // will need a one-time migration - see the note in seed.js.
    address: {
        type: String,
        required: true,
        trim: true
    },
    // GeoJSON Point used for radius ($geoWithin) search. Optional at the
    // schema level so existing documents created before this field existed
    // (and any future property saved without geocoding) remain valid -
    // they simply won't appear in /radius results, which is correct
    // behavior for an ungeocoded listing rather than a validation error.
    location: {
        type: pointSchema,
        required: false
    },
    propertyType: {
        type: String,
        enum: PROPERTY_TYPES
        // Intentionally not `required` for the same backward-compatibility
        // reason as `location` above - flip this to `required: true` once
        // every document in your collection has been migrated/reseeded.
    },
    bedrooms: {
        type: Number,
        min: 0,
        default: 0
    },
    bathrooms: {
        type: Number,
        min: 0,
        default: 0
    },
    imageUrl: {
        type: String,
        // Default placeholder image URL if no image URL is provided during creation.
        // This ensures every property always has an image to display on the frontend.
        default: ''
    },
    // Additional gallery photos beyond the cover `imageUrl` (which stays
    // untouched so the grid cards and map popups need no changes). The
    // detail page combines the two - see PropertyDetailPage.jsx.
    images: {
        type: [String],
        default: []
    },
    // Square footage. Optional - Phase 1/1.5 documents predate this field.
    area: {
        type: Number,
        min: 0
    },
    yearBuilt: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear() + 1 // allows new-construction listings sold pre-completion
    },
    amenities: {
        type: [String],
        default: []
    },
    agent: {
        type: agentSchema
        // No `required`/`default` - stays entirely absent on documents
        // that don't set it, same backward-compatible pattern as `location`.
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically sets the creation timestamp when a new property is added
    },
    updatedAt: {
        type: Date,
        default: Date.now // Automatically sets the update timestamp; will be modified by pre-save hook
    }
});

// 2dsphere index: required for $geoWithin / $near / $geoNear queries against `location`.
// Documents without a `location` value are simply excluded from geo queries, not indexed as an error.
propertySchema.index({ location: '2dsphere' });

// Mongoose pre-save hook:
// This middleware function runs automatically *before* a document is saved (both on creation and update).
// It ensures that the `updatedAt` field is always set to the current date and time.
propertySchema.pre('save', function(next) {
    this.updatedAt = Date.now(); // Set updatedAt to the current time
    next(); // Proceed to the next middleware or save operation
});

// Create the Mongoose model from the schema.
// 'Property' will be the singular name of the model. Mongoose will automatically
// create a collection named 'properties' (pluralized) in your MongoDB database.
const Property = mongoose.model('Property', propertySchema);

// Attached as a static so routes/properties.js and seed.js can validate
// against the same list without importing a separate constants file.
Property.PROPERTY_TYPES = PROPERTY_TYPES;

module.exports = Property; // Export the Property model so it can be used in other files (e.g., routes)
