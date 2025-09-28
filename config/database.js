// FILE: config/database.js
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', 'database.sqlite');

// Ensure the database directory exists
import { mkdir } from 'fs/promises';
import { dirname as pathDirname } from 'path';
await mkdir(pathDirname(dbPath), { recursive: true }).catch(() => {});

const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'student' CHECK(role IN ('student', 'admin')),
          profile_data TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Internships table
      db.run(`
        CREATE TABLE IF NOT EXISTS internships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          organization TEXT NOT NULL,
          department TEXT,
          location TEXT,
          duration TEXT,
          stipend TEXT,
          description TEXT,
          required_skills TEXT DEFAULT '[]',
          interests TEXT DEFAULT '[]',
          education_levels TEXT DEFAULT '[]',
          applied_count INTEGER DEFAULT 0,
          total_positions INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert sample internships if none exist
      db.get('SELECT COUNT(*) as count FROM internships', (err, row) => {
        if (err) {
          console.error('Error checking internships:', err);
          return;
        }

        if (row.count === 0) {
          const sampleInternships = [
            {
              title: "Policy Research Intern",
              organization: "NITI Aayog",
              department: "Research",
              location: "New Delhi",
              duration: "3 Months",
              stipend: "₹10,000/month",
              description: "Research and analyze policy initiatives",
              required_skills: JSON.stringify(["Research", "Data Analysis", "Report Writing"]),
              interests: JSON.stringify(["Public Policy", "Economics", "Research"]),
              education_levels: JSON.stringify(["graduate", "postgraduate"]),
              applied_count: 0,
              total_positions: 5
            },
            {
              title: "Digital India Intern",
              organization: "Ministry of Electronics & IT",
              department: "Digital Infrastructure",
              location: "New Delhi",
              duration: "6 Months",
              stipend: "₹20,000/month",
              description: "Work on Digital India initiatives",
              required_skills: JSON.stringify(["Programming", "Project Management", "Documentation"]),
              interests: JSON.stringify(["Technology", "Digital Transformation", "E-Governance"]),
              education_levels: JSON.stringify(["graduate"]),
              applied_count: 0,
              total_positions: 10
            }
          ];

          const stmt = db.prepare(`
            INSERT INTO internships (
              title, organization, department, location, duration, stipend,
              description, required_skills, interests, education_levels,
              applied_count, total_positions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          sampleInternships.forEach(internship => {
            stmt.run(
              internship.title,
              internship.organization,
              internship.department,
              internship.location,
              internship.duration,
              internship.stipend,
              internship.description,
              internship.required_skills,
              internship.interests,
              internship.education_levels,
              internship.applied_count,
              internship.total_positions
            );
          });

          stmt.finalize();
        }
      });

      // Applications table
      db.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          internship_id INTEGER NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
          applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (internship_id) REFERENCES internships (id),
          UNIQUE(user_id, internship_id)
        )
      `);

      // Bookmarks table
      db.run(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          user_id INTEGER NOT NULL,
          internship_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, internship_id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (internship_id) REFERENCES internships (id)
        )
      `);
      // Insert admin user if missing
      db.run(`
        INSERT OR IGNORE INTO users (id, name, email, password, role) 
        VALUES (1, 'Admin User', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      `);

      resolve();
    });
  });
};

export { db };
