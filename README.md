# TagMe Connect

A modern, production-ready template for building full-stack React applications using React Router with integrated Supabase database and Netlify Functions.



## Features

- 🚀 Server-side rendering with React Router
- 
- 
- ⚡️ Hot Module Replacement (HMR)
- 🗄️ PostgreSQL database with Supabase
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 🐳 Docker Compose for local development
- 📖 [React Router docs](https://reactrouter.com/)
- 

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local database)
- Environment variables configured (see `ENVIRONMENT_VARIABLES.md`)
- `NETLIFY_ACCESS_TOKEN` environment variable set (for running Netlify dev in Docker)


### Installation

1. Install the dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your environment variables. See `ENVIRONMENT_VARIABLES.md` for the complete list.

3. Set up your Netlify Access Token:
   - Create a personal access token in Netlify: https://app.netlify.com/user/applications#personal-access-tokens
   - Add it to your environment: `export NETLIFY_ACCESS_TOKEN=your_token_here`
   - Or add it to your `.env` file

### Database Setup

This project uses Supabase (PostgreSQL) for data storage. For local development, we use Docker Compose to run a local Supabase instance.

#### Start the Development Database

```bash
npm run dev:db
```

This will start:
- PostgreSQL database on port `54322`
- PostgREST API on port `54321`
- Supabase Studio UI on port `54323` (http://localhost:54323)

The database schema will be automatically created from the migrations in `supabase/migrations/`.

#### Stop the Development Database

```bash
npm run dev:db:down
```

#### Access Supabase Studio

Once the database is running, you can access Supabase Studio at http://localhost:54323 to:
- View and edit data in your tables
- Run SQL queries
- Monitor database performance
- Manage database schema

### Development

With the database running, start the development server in a separate terminal:

```bash
npm run dev
```

Your application will be available at `http://localhost:8888` (via Netlify Dev).

### Testing

#### Test Database

For running tests with an isolated database:

```bash
npm run test:db
```

This starts a separate test database instance on different ports.

#### Run Tests

```bash
npm test
```

#### Reset Test Database

To reset the test database to a clean state:

```bash
npm run db:reset-test
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Database Schema

The application uses the following main tables:

- **orders**: Stores customer orders from Stripe checkout
- **customers**: Customer information including Stripe integration and shipping details
- **cards**: Contact cards with all form data and generation status tracking
  - Supports two card types: `basic` (website redirect only) and `core` (full contact information)
  - Includes website_url for basic card redirects
  - Includes design_file_url for storing the design file location
- **card_assets**: Individual assets (images, HTML, VCF) associated with each card
- **admin_users_auth0**: Admin user accounts for Auth0 authentication

See `supabase/migrations/000_complete_schema.sql` for the complete schema definition.

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Ensure Docker is running: `docker ps`
2. Check if the database container is healthy: `docker-compose -f docker-compose.dev.yml ps`
3. Verify environment variables are set correctly in your `.env` file
4. Try restarting the database: `npm run dev:db:down && npm run dev:db`

### Port Conflicts

If you see port conflict errors:

- Development database uses ports: 54321, 54322, 54323
- Test database uses ports: 54421, 54422
- Netlify dev uses port: 8888
- Make sure these ports are available or update the port numbers in the docker-compose files

### Migration Issues

If migrations don't run automatically:

1. Connect to the database: `psql -h localhost -p 54322 -U postgres -d postgres`
2. Manually run the migration: `\i supabase/migrations/001_initial_schema.sql`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience.

---

Built with ❤️ using React Router, Supabase, and Netlify.
