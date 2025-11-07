# Contact Management System

A full-stack web application consisting of a **React + Vite frontend** and a **Spring Boot backend**.  
This repository is structured as a monorepo to streamline development, testing, and deployment.

## Table of Contents
- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Backend](#backend)
  - [Setup](#setup)
  - [Running](#running)
  - [Features](#features)
  - [Tests & Coverage](#tests--coverage)
  - [Configuration](#configuration)
- [Frontend](#frontend)
  - [Setup](#setup-1)
  - [Running](#running-1)
  - [Features](#features-1)
  - [Tests & Coverage](#tests--coverage-1)
  - [Configuration](#configuration-1)
- [Contributing](#contributing)
  
---

## Project Overview
The **Contact Management System** allows users to manage contacts with features like creating, editing, deleting, searching, and viewing detailed information.  
It also provides the ability for users to change their password for enhanced account security.

The backend uses **Spring Boot** with a **MySQL database** for data storage and **JWT (JSON Web Tokens)** for secure user authentication and password management.

The frontend offers a modern, responsive web interface built with **React**, **Vite**, and **Tailwind CSS**, seamlessly integrating with the backend APIs.

---

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Java, Spring Boot, MySQL, Maven
- **Testing & Quality:** Jest (frontend), JUnit & Mockito (backend), SonarQube

---

## Project Structure
```
contact-management-system/
    frontend/  # React + Vite frontend
    backend/   # Spring Boot backend
    README.md  # Project overview and setup instructions
```

---

## Backend

### Setup
Install dependencies and build your project:
```bash
cd backend
mvn install
```
Ensure you have Java (JDK 11 or higher) and Maven installed.

### Running
Start the backend server:
```bash
cd backend
mvn spring-boot:run
```
The backend runs on http://localhost:8080 by default.

### Features
The backend supports:
<ul>
  <li>Create, edit, delete, and search contacts</li>
  <li>User authentication with JWT and password management (including password change)</li>
  <li>REST API endpoints for frontend consumption</li>
  <li>Validation and business logic for secure and consistent data handling</li>
</ul>

### Tests & Coverage
Run unit and integration tests:
```bash
cd backend
mvn test
```
Coverage is collected and reported via SonarQube.  
Make sure SonarQube is running and your project is configured with the correct Quality Profile.  
Run the Sonar scanner from the root of the project:
```
cd backend
mvn sonar:sonar
```

### Configuration
Important configurations and environment variables:

<ul>
  <li><code>application.properties</code> or .env for database connection, JWT secrets, and server settings</li>
  <li>Database: MySQL (URL, username, password)</li>
  <li>JWT secret and token expiration time</li>
  <li>Coverage reports – collected via SonarQube</li>
</ul>

---

## Frontend

### Setup
Install dependencies:

```bash
cd frontend
npm install
```
Ensure you have Node.js (v16 or higher) and npm installed.

### Running
Start the frontend development server:
```bash
npm run dev
```
The frontend runs on http://localhost:5173 by default (Vite dev server).

### Features
The frontend supports:
<ul>
  <li>Create, edit, delete, and search contacts</li>
  <li>User authentication and password management (including password change)</li>
  <li>Responsive user interface for managing contacts</li>
  <li>Form validations and error handling</li>
  <li>Integration with backend REST API</li>
</ul>

### Tests & Coverage
Run frontend tests:
```bash
  npm test
```
Coverage is collected and reported via SonarQube.  
Make sure SonarQube is running and your project is configured with the correct Quality Profile.  
Run the Sonar scanner from the root of the project:
```
# Example using npm script for Sonar scanner
npm run sonar
# Or directly via Sonar scanner CLI
sonar-scanner
```

### Configuration

Important frontend configuration files:
<ul>
  <li> <code>vite.config.js</code> – configuration for Vite (development and production builds)</li>
  <li> <code>jest.config.cjs</code> – configuration for unit tests  </li>
  <li> <code>setupTests.cjs</code> – setup file for Jest tests</li>
  <li> <code>babel.config.cjs</code> – Babel configuration for the project</li>
</ul>

## Contributing
1. Fork the repository.  
2. Create a feature branch: git checkout -b feature/your-feature.  
3. Make your changes.  
4. Commit your changes: git commit -m "feat: add new feature".  
5. Push to your branch and open a Pull Request.  
