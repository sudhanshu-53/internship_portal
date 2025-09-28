#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const __dirname = process.cwd();

async function main() {
  const filePath = path.resolve(__dirname, 'internships_full.json');
  if (!fs.existsSync(filePath)) {
    console.error('internships_full.json not found in project root');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const internships = data.internships || [];
  const ids = internships.map(i => i.id).filter(Boolean);

  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        db.run(`DELETE FROM internships WHERE id IN (${placeholders})`, ids, function(err) {
          if (err) return reject(err);
        });
      }

      const insertSql = `INSERT INTO internships (id, title, organization, department, location, duration, stipend, description, required_skills, interests, education_levels, total_positions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const stmt = db.prepare(insertSql);

      let processed = 0;
      let errors = 0;

      internships.forEach((it) => {
        const args = [
          it.id || null,
          it.title || '',
          it.organization || '',
          it.department || '',
          it.location || '',
          it.duration || '',
          it.stipend || '',
          it.description || '',
          JSON.stringify(it.required_skills || []),
          JSON.stringify(it.interests || []),
          JSON.stringify(it.education_levels || []),
          it.total_positions || 0
        ];

        stmt.run(args, function(err) {
          processed++;
          if (err) {
            errors++;
            console.error('Insert error for id', it.id, err.message);
          }

          if (processed === internships.length) {
            stmt.finalize(() => {
              db.run('COMMIT', (err) => {
                if (err) return reject(err);
                resolve({ processed, errors });
              });
            });
          }
        });
      });

      if (internships.length === 0) {
        db.run('COMMIT', (err) => {
          if (err) return reject(err);
          resolve({ processed: 0, errors: 0 });
        });
      }
    });
  });

  db.close();
  console.log('Replace operation completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
