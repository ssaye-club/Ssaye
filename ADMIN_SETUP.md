# Admin Setup Guide

## Making a User an Admin

To grant admin access to a user, you need to update their `isAdmin` field in the MongoDB database.

### Method 1: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to your database → `users` collection
4. Find the user you want to make admin
5. Click "Edit Document"
6. Add or update the field: `isAdmin: true`
7. Click "Update"

### Method 2: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use your_database_name

# Update a specific user by email
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { isAdmin: true } }
)

# Verify the update
db.users.findOne({ email: "admin@example.com" })
```

### Method 3: Create an Admin Endpoint (Development Only)

Add this temporary route to `server/routes/auth.js`:

```javascript
// TEMPORARY - Remove in production
router.put('/make-admin/:userId', auth, async (req, res) => {
  try {
    // Only allow if the requesting user is already an admin
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isAdmin: true },
      { new: true }
    );

    res.json({ message: 'User updated to admin', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

## Testing the Admin Workflow

### 1. Create a Regular User Account
- Go to `/signup` and create a test user account
- Login with the account

### 2. Make the User an Admin
- Use one of the methods above to set `isAdmin: true` for the user

### 3. Access Admin Dashboard
- After making the user an admin, logout and login again (to refresh the JWT token with new user data)
- You should now see "Admin" link in the navbar
- Navigate to `/admin` to access the admin dashboard

### 4. Test the Complete Workflow

**As a Regular User:**
1. Go to `/investments`
2. Click "Invest Now" on any property
3. Fill out the 3-step investment application form
4. Submit the application
5. Go to `/portfolio` → "My Applications" tab
6. Verify the application shows as "Pending"

**As an Admin:**
1. Go to `/admin` dashboard
2. Verify the application appears in the "Pending" filter
3. Click "Review Application"
4. Select "Approved" or "Rejected"
5. Add admin notes (optional)
6. Submit the review

**Verify the Update:**
1. Login back as the regular user
2. Go to `/portfolio` → "My Applications"
3. Verify the status changed to "Approved" or "Rejected"
4. If approved, you should see "Waiting for Payment" message

## Important Security Notes

⚠️ **Production Considerations:**

1. **JWT Token Refresh**: When a user's admin status changes, they need to log out and log back in to get a new token with updated user data.

2. **Admin Routes Protection**: All admin routes in the backend are protected with the `isAdmin` check. Users without admin privileges will receive a 403 Forbidden error.

3. **First Admin Creation**: For the very first admin user, you'll need to manually update the database using Method 1 or Method 2 above, since there's no existing admin to use Method 3.

4. **Remove Development Endpoints**: Before deploying to production, remove any temporary admin-creation endpoints from your codebase.

## Application Status Flow

```
User Submits → Pending → Admin Reviews → Approved/Rejected → (if Approved) Waiting for Payment → Completed
```

### Status Definitions

- **Pending**: Application submitted, awaiting admin review
- **Approved**: Admin approved the application, waiting for payment
- **Rejected**: Admin rejected the application
- **Waiting for Payment**: Approved applications awaiting user payment
- **Completed**: Payment received, investment finalized
