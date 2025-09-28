// FILE: routes/admin.js
import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Create new internship (admin only)
router.post('/internships', authenticateToken, requireAdmin, (req, res) => {
  const {
    title,
    organization,
    location,
    duration,
    stipend,
    description,
    required_skills = [],
    interests = [],
    education_levels = []
  } = req.body;

  if (!title || !organization) {
    return res.status(400).json({ error: 'Title and organization are required' });
  }

  db.run(`
    INSERT INTO internships 
    (title, organization, location, duration, stipend, description, required_skills, interests, education_levels)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    organization,
    location,
    duration,
    stipend,
    description,
    JSON.stringify(required_skills),
    JSON.stringify(interests),
    JSON.stringify(education_levels)
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create internship' });
    }

    // Fetch the created internship
    db.get('SELECT * FROM internships WHERE id = ?', [this.lastID], (err, internship) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const parsedInternship = {
        ...internship,
        required_skills: JSON.parse(internship.required_skills || '[]'),
        interests: JSON.parse(internship.interests || '[]'),
        education_levels: JSON.parse(internship.education_levels || '[]')
      };

      res.status(201).json({
        success: true,
        internship: parsedInternship
      });
    });
  });
});

// Get all applications (admin only)
router.get('/applications/admin', authenticateToken, requireAdmin, (req, res) => {
  db.all(`
    SELECT 
      a.*,
      u.name as user_name,
      u.email as user_email,
      i.title as internship_title,
      i.organization as internship_organization
    FROM applications a
    JOIN users u ON a.user_id = u.id
    JOIN internships i ON a.internship_id = i.id
    ORDER BY a.applied_date DESC
  `, (err, applications) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json(applications);
  });
});

// Update application status (admin only)
router.put('/applications/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE applications SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update application' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json({ success: true, message: 'Application status updated' });
    }
  );
});

// Get dashboard stats (admin only)
router.get('/dashboard/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {};

  // Get total users
  db.get('SELECT COUNT(*) as count FROM users WHERE role = "student"', (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.totalUsers = result.count;

    // Get total internships
    db.get('SELECT COUNT(*) as count FROM internships', (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.totalInternships = result.count;

      // Get total applications
      db.get('SELECT COUNT(*) as count FROM applications', (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.totalApplications = result.count;

        // Get applications by status
        db.all(`
          SELECT status, COUNT(*) as count 
          FROM applications 
          GROUP BY status
        `, (err, statusCounts) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          
          stats.applicationsByStatus = statusCounts.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
          }, {});

          res.json(stats);
        });
      });
    });
  });
});

export { router as Router };
