# Internship Portal Backend

Node.js/Express backend for the Internship Portal application. Handles user authentication, internship listings, applications, and recommendations.

## Features

- User authentication (JWT)
- Internship CRUD operations
- Application management
- Profile handling
- Recommendations
- Admin dashboard

## Setup

1. Clone the repository:
```bash
git clone https://github.com/sudhanshu-53/internship_portal.git
cd internship_portal
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/internships` - List internships
- `POST /api/internships` - Create internship (admin)
- `PUT /api/internships/:id` - Update internship
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT tokens
- `DB_PATH` - SQLite database path

## License

MIT