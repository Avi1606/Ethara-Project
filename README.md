# Team Task Manager

A simple full-stack assignment project built with Spring Boot, React and PostgreSQL.

## Features

- Signup and login with JWT
- Admin and Member roles
- Admin can create projects, add members and assign tasks
- Members can view assigned work and update task status
- Dashboard with project count, task count, in-progress and overdue tasks
- REST API with validation and database relationships

## Tech Stack

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA
- Frontend: React, Vite, plain CSS
- Database: H2 locally, PostgreSQL on Railway
- Deployment: Railway using Docker

## Run Locally

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Railway Deployment

Create a PostgreSQL database on Railway and deploy this repository as a Docker service.

Set these variables in Railway:

```env
JDBC_DATABASE_URL=jdbc:postgresql://HOST:PORT/DATABASE
DATABASE_USERNAME=your_postgres_user
DATABASE_PASSWORD=your_postgres_password
JWT_SECRET=change-this-to-a-long-random-secret-key
FRONTEND_URL=https://your-railway-app-url
```

For Railway PostgreSQL, you can copy the host, port, database, user and password from the database variables and place them in the values above.

## Demo Flow

1. Signup as an `ADMIN`.
2. Create a project.
3. Signup another account as `MEMBER`.
4. Login as Admin, add the Member to the project and assign a task.
5. Login as Member and update the task status.
