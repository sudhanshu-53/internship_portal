#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const __dirname = process.cwd();

async function main() {
  const filePath = path.resolve(__dirname, 'internships_bulk.json');
  if (!fs.existsSync(filePath)) {
    console.error('internships_bulk.json not found in project root');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const internships = data.internships || [];
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  let processed = 0;
  let errors = 0;

  await new Promise((resolve) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const upsertSql = `
        INSERT INTO internships (id, title, organization, department, location, duration, stipend, description, required_skills, interests, education_levels, total_positions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          organization=excluded.organization,
          department=excluded.department,
          location=excluded.location,
          duration=excluded.duration,
          stipend=excluded.stipend,
          description=excluded.description,
          required_skills=excluded.required_skills,
          interests=excluded.interests,
          education_levels=excluded.education_levels,
          total_positions=excluded.total_positions
      `;

      const stmt = db.prepare(upsertSql);

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
          it.total_positions || 0,
        ];

        stmt.run(args, function (err) {
          processed++;
          if (err) {
            errors++;
            console.error('Upsert error for id', it.id, err.message);
          }
          if (processed === internships.length) {
            stmt.finalize(() => {
              db.run('COMMIT', () => {
                resolve();
              });
            });
          }
        });
      });

      if (internships.length === 0) {
        // nothing to do
        db.run('COMMIT', () => resolve());
      }
    });
  });

  db.close();
  console.log(`Upsert completed. Processed ${processed} internships. Errors=${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
