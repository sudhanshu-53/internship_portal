// FILE: routes/recommendations.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Calculate recommendation score
const calculateScore = (userProfile, internship) => {
  let score = 0;
  const weights = {
    skills: 0.4,
    interests: 0.3,
    education: 0.2,
    location: 0.1
  };

  // Skills matching
  if (userProfile.skills && internship.required_skills) {
    const userSkills = userProfile.skills.map(s => s.toLowerCase());
    const requiredSkills = internship.required_skills.map(s => s.toLowerCase());
    const matchingSkills = userSkills.filter(skill => 
      requiredSkills.some(req => req.includes(skill) || skill.includes(req))
    );
    score += (matchingSkills.length / Math.max(requiredSkills.length, 1)) * weights.skills;
  }

  // Interests matching
  if (userProfile.interests && internship.interests) {
    const userInterests = userProfile.interests.map(i => i.toLowerCase());
    const internshipInterests = internship.interests.map(i => i.toLowerCase());
    const matchingInterests = userInterests.filter(interest =>
      internshipInterests.some(int => int.includes(interest) || interest.includes(int))
    );
    score += (matchingInterests.length / Math.max(internshipInterests.length, 1)) * weights.interests;
  }

  // Education level matching
  if (userProfile.education && internship.education_levels) {
    const userEducation = userProfile.education.toLowerCase();
    const acceptedLevels = internship.education_levels.map(e => e.toLowerCase());
    if (acceptedLevels.includes(userEducation)) {
      score += weights.education;
    }
  }

  // Location preference (if user has location preference)
  if (userProfile.preferred_location && internship.location) {
    const userLocation = userProfile.preferred_location.toLowerCase();
    const internshipLocation = internship.location.toLowerCase();
    if (internshipLocation.includes(userLocation) || userLocation.includes(internshipLocation)) {
      score += weights.location;
    }
  }

  return Math.min(score, 1); // Cap at 1.0
};

// Get recommendations for user
router.get('/', authenticateToken, (req, res) => {
  // First get user profile
  db.get('SELECT profile_data FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProfile = JSON.parse(user.profile_data || '{}');

    // Get all internships
    db.all('SELECT * FROM internships', (err, internships) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch internships' });
      }

      // Calculate scores and sort
      const recommendations = internships.map(internship => {
        const parsedInternship = {
          ...internship,
          required_skills: JSON.parse(internship.required_skills || '[]'),
          interests: JSON.parse(internship.interests || '[]'),
          education_levels: JSON.parse(internship.education_levels || '[]')
        };

        const score = calculateScore(userProfile, parsedInternship);

        return {
          ...parsedInternship,
          recommendation_score: Math.round(score * 100) / 100
        };
      })
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 5); // Top 5 recommendations

      res.json(recommendations);
    });
  });
});

export { router as Router };
