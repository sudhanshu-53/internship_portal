// FILE: routes/profile.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileData = JSON.parse(user.profile_data || '{}');
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hasCompletedOnboarding: profileData.hasCompletedOnboarding || false,
      ...profileData
    };

    res.json(profile);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user profile
router.put('/', authenticateToken, (req, res) => {
  try {
    const profileData = {
      ...req.body,
      hasCompletedOnboarding: true // Set to true whenever profile is updated
    };

    db.run('UPDATE users SET profile_data = ? WHERE id = ?',
      [JSON.stringify(profileData), req.user.userId],
      function(err) {
        if (err) {
          console.error('Error updating profile:', err);
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Return updated profile
        const profile = {
          id: req.user.userId,
          ...profileData
        };

        res.json(profile);
      }
    );
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export { router as Router };