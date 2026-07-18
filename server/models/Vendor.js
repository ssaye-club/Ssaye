const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  businessId: {
    type: String,
    required: [true, 'Business ID / licence number is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  // pending → approved by super admin → suspended if needed
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
  },
  // Government / food-safety business-level certificate
  govtCert: {
    regulatoryBody: { type: String, default: '' },   // e.g. FSSAI, FDA, EU Food Safety, Local Permit
    licenceNumber:  { type: String, default: '' },
    issuingCountry: { type: String, default: '' },
    expiryDate:     { type: Date,   default: null },
    documentData:   { type: String, default: null }, // base64 PDF or image
    documentName:   { type: String, default: '' },
    status:         { type: String, enum: ['not_submitted', 'pending_review', 'verified', 'rejected'], default: 'not_submitted' },
    adminNotes:     { type: String, default: '' },
    reviewedAt:     { type: Date,   default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Vendor', vendorSchema);
