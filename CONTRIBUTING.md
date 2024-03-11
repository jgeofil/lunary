## Development environment setup

1. Fork and clone the repository
2. Setup a PostgreSQL instance
3. Run the content of `packages/db/init.sql` in your Postgres instance
4. Copy the content of `packages/backend/.env.example` to `packages/backend/.env` and fill the missing values
5. Copy the content of `packages/frontend/.env.example` to `packages/backend/.env`
6. Run `npm install`
7. Run `npm run dev`