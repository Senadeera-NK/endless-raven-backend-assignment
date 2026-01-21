# Endless Raven - Mini Microservices Backend Challenge

This project is a Microservices-based Backend system developed for the Technical Assignment at **Endless Raven (Pvt) Ltd**. It demonstrates a scalable architecture using Node.js, Docker, and an API Gateway.

## 🏗 System Architecture

The system consists of three independent services:
1.  **API Gateway (Port 3000):** The single entry point. Handles routing and JWT authentication.
2.  **Auth Service (Port 3001):** Manages users and company registrations using SQLite.
3.  **Product Service (Port 3002):** Manages product CRUD and stock movements with audit logging.

---

## Quick Start (Running with Docker)

The entire system is containerized. You do not need to install Node.js or databases locally.

### 1. Clone the repository
```bash
git clone "https://github.com/Senadeera-NK/endless-raven-backend-assignment.git"
cd endless-raven-backend-assignment

2. Start the services
Run the following command from the root directory:

Bash
docker-compose up --build

3. Verify the Services
Once the build is complete, you should see logs indicating:

Gateway running on http://localhost:3000
Auth service running on port 3001
Product service running on port 3002
Health Check: Visit http://localhost:3000/health to verify system status.


Documentation & Testing
Detailed documentation is available in the /docs folder:
Architecture & Design Decisions: TECHNICAL_DOC.md
API Reference: Postman Collection

Testing via Postman
Import the postman.json file into Postman.
Use the Auth / Register endpoint to create a user.
Use the Auth / Login endpoint to get a JWT.
Add the JWT as a Bearer Token in the Authorization tab for Product and Stock requests.

Tech Stack
Runtime: Node.js (Express)
Database: SQLite (via Prisma ORM 7)
Security: JWT (Authentication) & bcrypt (Password Hashing)
DevOps: Docker & Docker Compose
Inter-service Comm: REST APIs

Business Rules Implemented
Stock Validation: Stock levels cannot drop below zero.
Audit Logging: Every stock change is automatically recorded in a stock_logs table via Prisma transactions.
Isolation: Each service owns its own database; no database sharing is permitted.