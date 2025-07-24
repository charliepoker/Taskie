# Taskie

A modern team task management system designed to showcase DevOps practices across cloud infrastructure, containerization, CI/CD monitoring, and GitOps workflows.

## Features

- User authentication and management
- Project creation and team collaboration
- Task tracking with status updates and assignments
- Analytics dashboard for productivity metrics
- Modern UI with responsive design

## Tech Stack

### Frontend

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Ant Design
- React Query
- Zustand

### Backend

- Express.js with TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT authentication
- Zod validation

### DevOps

- Docker containerization
- CI/CD pipeline
- Monitoring and logging
- GitOps workflows

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/taskie.git
cd taskie
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

4. Start the development environment:

```bash
npm run dev
```

This will start:

- PostgreSQL database
- Redis cache
- Backend API server
- Frontend development server

5. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## Development

### Available Scripts

- `npm run dev` - Start the development environment
- `npm run build` - Build the frontend and backend for production
- `npm run lint` - Run ESLint on frontend and backend
- `npm run format` - Run Prettier on frontend and backend
- `npm run docker:dev` - Start the development environment with Docker
- `npm run docker:prod` - Start the production environment with Docker
- `npm run docker:down` - Stop all Docker containers

## License

This project is licensed under the ISC License.
