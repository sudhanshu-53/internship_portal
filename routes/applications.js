// FILE: routes/applications.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Apply for internship
router.post('/', authenticateToken, (req, res) => {
  const { internship_id } = req.body;

  if (!internship_id) {
    return res.status(400).json({ error: 'Internship ID is required' });
  }

  // Check if internship exists
  db.get('SELECT * FROM internships WHERE id = ?', [internship_id], (err, internship) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Create application
    db.run(
      'INSERT INTO applications (user_id, internship_id, status) VALUES (?, ?, ?)',
      [req.user.userId, internship_id, 'pending'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Already applied for this internship' });
          }
          return res.status(500).json({ error: 'Failed to create application' });
        }

        // Fetch the created application with internship details
        db.get(`
          SELECT a.*, i.title, i.organization 
          FROM applications a 
          JOIN internships i ON a.internship_id = i.id 
          WHERE a.id = ?
        `, [this.lastID], (err, application) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            success: true,
            application
          });
        });
      }
    );
  });
});

// Get user's applications
router.get('/', authenticateToken, (req, res) => {
  db.all(`
    SELECT a.*, i.title, i.organization, i.location, i.stipend
    FROM applications a
    JOIN internships i ON a.internship_id = i.id
    WHERE a.user_id = ?
    ORDER BY a.applied_date DESC
  `, [req.user.userId], (err, applications) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json(applications);
  });
});

export { router as Router };
