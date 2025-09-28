// FILE: routes/internships.js
import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all internships (public endpoint)
router.get('/', (req, res) => {
  try {
    const internships = db.prepare('SELECT * FROM internships ORDER BY created_at DESC').all();
    
    // Parse JSON fields
    const parsedInternships = internships.map(row => ({
      ...row,
      required_skills: JSON.parse(row.required_skills || '[]'),
      interests: JSON.parse(row.interests || '[]'),
      education_levels: JSON.parse(row.education_levels || '[]')
    }));

    res.json(parsedInternships);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// Get a single internship by ID
router.get('/:id', (req, res) => {
  try {
    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.id);
    
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Parse JSON fields
    internship.required_skills = JSON.parse(internship.required_skills || '[]');
    internship.interests = JSON.parse(internship.interests || '[]');
    internship.education_levels = JSON.parse(internship.education_levels || '[]');

    res.json(internship);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch internship' });
  }
});

// Create new internship (admin only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    const {
      title, organization, department, location, duration, stipend,
      description, required_skills, interests, education_levels, total_positions
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO internships (
        title, organization, department, location, duration, stipend,
        description, required_skills, interests, education_levels,
        total_positions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title, organization, department, location, duration, stipend,
      description, 
      JSON.stringify(required_skills || []),
      JSON.stringify(interests || []),
      JSON.stringify(education_levels || []),
      total_positions || 0
    );

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create internship' });
  }
});

// Update internship (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    const {
      title, organization, department, location, duration, stipend,
      description, required_skills, interests, education_levels, total_positions
    } = req.body;

    const stmt = db.prepare(`
      UPDATE internships SET
        title = ?, organization = ?, department = ?, location = ?,
        duration = ?, stipend = ?, description = ?, required_skills = ?,
        interests = ?, education_levels = ?, total_positions = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      title, organization, department, location, duration, stipend,
      description,
      JSON.stringify(required_skills || []),
      JSON.stringify(interests || []),
      JSON.stringify(education_levels || []),
      total_positions || 0,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    res.json({ message: 'Internship updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update internship' });
  }
});

// Delete internship (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    const result = db.prepare('DELETE FROM internships WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    res.json({ message: 'Internship deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete internship' });
  }
});

// Bulk update internships (admin only)
router.put('/bulk/update', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    const { internships } = req.body;
    
    if (!Array.isArray(internships)) {
      return res.status(400).json({ error: 'Internships must be an array' });
    }

    const updateStmt = db.prepare(`
      UPDATE internships SET
        title = ?, organization = ?, department = ?, location = ?,
        duration = ?, stipend = ?, description = ?, required_skills = ?,
        interests = ?, education_levels = ?, total_positions = ?
      WHERE id = ?
    `);

    db.transaction(() => {
      const results = internships.map(internship => {
        const {
          id, title, organization, department, location, duration, stipend,
          description, required_skills, interests, education_levels, total_positions
        } = internship;

        if (!id) {
          throw new Error('Each internship must have an id');
        }

        const result = updateStmt.run(
          title, organization, department, location, duration, stipend,
          description,
          JSON.stringify(required_skills || []),
          JSON.stringify(interests || []),
          JSON.stringify(education_levels || []),
          total_positions || 0,
          id
        );

        return {
          id,
          updated: result.changes > 0
        };
      });

      return results;
    })();

    res.json({ message: 'Bulk update completed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk update internships: ' + err.message });
  }
});

export { router as Router };
