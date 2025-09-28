// FILE: routes/bookmarks.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Add/Remove bookmark
router.post('/', authenticateToken, (req, res) => {
  const { internship_id } = req.body;

  if (!internship_id) {
    return res.status(400).json({ error: 'Internship ID is required' });
  }

  // Check if bookmark exists
  db.get(
    'SELECT * FROM bookmarks WHERE user_id = ? AND internship_id = ?',
    [req.user.userId, internship_id],
    (err, bookmark) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (bookmark) {
        // Remove bookmark
        db.run(
          'DELETE FROM bookmarks WHERE user_id = ? AND internship_id = ?',
          [req.user.userId, internship_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to remove bookmark' });
            }

            // Get updated bookmarks
            db.all(
              'SELECT internship_id FROM bookmarks WHERE user_id = ?',
              [req.user.userId],
              (err, bookmarks) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                  success: true,
                  bookmarks: bookmarks.map(b => b.internship_id)
                });
              }
            );
          }
        );
      } else {
        // Add bookmark
        db.run(
          'INSERT INTO bookmarks (user_id, internship_id) VALUES (?, ?)',
          [req.user.userId, internship_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to add bookmark' });
            }

            // Get updated bookmarks
            db.all(
              'SELECT internship_id FROM bookmarks WHERE user_id = ?',
              [req.user.userId],
              (err, bookmarks) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                  success: true,
                  bookmarks: bookmarks.map(b => b.internship_id)
                });
              }
            );
          }
        );
      }
    }
  );
});

// Get user's bookmarks
router.get('/', authenticateToken, (req, res) => {
  db.all(`
    SELECT b.internship_id, i.*
    FROM bookmarks b
    JOIN internships i ON b.internship_id = i.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `, [req.user.userId], (err, bookmarks) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }

    // Parse JSON fields
    const parsedBookmarks = bookmarks.map(bookmark => ({
      ...bookmark,
      required_skills: JSON.parse(bookmark.required_skills || '[]'),
      interests: JSON.parse(bookmark.interests || '[]'),
      education_levels: JSON.parse(bookmark.education_levels || '[]')
    }));

    res.json(parsedBookmarks);
  });
});

export { router as Router };
