# Investment Opportunities Management System

## Overview
This system allows Super Admins to manage investment opportunities from the frontend, with all data stored in the database.

## Setup Instructions

### 1. Migrate Existing Investments to Database

Run this command from the `server` directory to populate the database with your existing hardcoded investments:

```bash
cd server
node scripts/migrate-investments.js
```

This will create 6 investment opportunities in your database (the ones that were previously hardcoded).

### 2. Features

#### For Super Admins:
- **Create** new investment opportunities with all details
- **Edit** existing opportunities
- **Delete** opportunities
- **Toggle** active/inactive status (inactive opportunities won't show to users)
- View all opportunities with status indicators

#### For Regular Users:
- View all active investment opportunities
- Filter and search opportunities
- Apply for investments

### 3. Investment Opportunity Fields

- **Name**: Investment opportunity title
- **Category**: Multi-Family, Commercial, Mixed-Use, Residential, Industrial, Other
- **Location**: City, State
- **Area**: Size (e.g., "45,000 sq ft")
- **Description**: Detailed description
- **Highlights**: Array of key features/benefits
- **Min Investment**: Minimum investment amount ($)
- **Total Value**: Total project value ($)
- **Expected ROI**: Expected return on investment (%)
- **Duration**: Investment duration (e.g., "36 months")
- **Risk Level**: Low, Medium, or High
- **Status**: Open, Funding, Closed, or Completed
- **Available Shares**: Percentage of shares available (0-100%)
- **Projected Completion**: Expected completion date (e.g., "Q3 2024")
- **Images**: Array of image URLs (for future enhancement)
- **isActive**: Boolean - controls visibility to regular users

### 4. API Endpoints

**Public:**
- `GET /api/opportunities` - Get all active investment opportunities
- `GET /api/opportunities/:id` - Get single opportunity

**Super Admin Only:**
- `GET /api/opportunities/admin/all` - Get all opportunities (including inactive)
- `POST /api/opportunities` - Create new opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity
- `PUT /api/opportunities/:id/toggle-status` - Toggle active/inactive status

### 5. Accessing the Management Interface

1. Log in as Super Admin
2. Navigate to Super Admin Dashboard
3. Click on "Investment Opportunities" tab
4. Use "Create New Opportunity" button to add opportunities

### 6. Notes

- The migration script will only run once. If opportunities already exist in the database, it will skip to avoid duplicates.
- Inactive opportunities are hidden from regular users but visible in Super Admin panel.
- All existing investments from your hardcoded data are preserved and migrated.
- The system is fully integrated with your existing investment application workflow.

### 7. Future Enhancements

- Image upload functionality for opportunity photos
- Bulk import/export of opportunities
- Analytics dashboard for opportunity performance
- Automated status updates based on funding progress
