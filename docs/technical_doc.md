Architecture Overview

This project implements a microservices-based backend using a Single Entry Point pattern. All client requests are directed to the API Gateway. The Gateway acts as a reverse proxy, routing requests to either the Auth Service or the Product Service based on the URL path.

Key Design Decisions

Service Isolation & Database Ownership: In strict adherence to Rule #7, each service is entirely independent. The Auth Service manages user identities, while the Product Service manages inventory. They do not share a database; instead, they are logically linked by company_id.

Centralized Security: JWT validation is handled exclusively by the API Gateway. This "Bouncer" pattern ensures that the Product Service doesn't waste CPU cycles processing requests that lack a valid signature.

Environment-Driven Configuration: No sensitive data or URLs are hardcoded. All service URLs and secrets are injected via Docker Compose environment variables, making the system easy to deploy in different environments (dev, staging, production).

Atomic Stock Transactions: Stock updates utilize Prisma's $transaction API. This ensures that a stock deduction and its corresponding audit log entry either both succeed or both fail, preventing data inconsistency.


EXTERNAL CLIENTS (Postman / Frontend)
                |
                | [PORT 3000]
                ▼
      ┌───────────────────────┐
      │      API GATEWAY      │─── (Validates JWT)
      └──────────┬────────────┘
                 │
      ┌──────────┴──────────┐
      │  Docker Network     │
      └─────┬────────────┬──┘
            │            │
      [PORT 3001]    [PORT 3002]
            ▼            ▼
    ┌─────────────┐    ┌─────────────┐
    │ AUTH SERVICE│    │PRODUCT SERV │
    └──────┬──────┘    └──────┬──────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────┐
    │  Auth DB    │    │ Product DB  │
    │ (SQLite)    │    │ (SQLite)    │
    └─────────────┘    └─────────────┘