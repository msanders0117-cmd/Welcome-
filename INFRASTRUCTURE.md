# Infrastructure & Deployment Plan - CallFlow AI

## 1. Architecture Overview
CallFlow AI follows a microservices architecture containerized with Docker and orchestrated using AWS ECS (Elastic Container Service) with Fargate for serverless compute.

### High-Level Components:
- **Frontend**: Next.js dashboard for business owners.
- **Backend API**: Core business logic, calendar integrations, and data management.
- **Voice Service**: Real-time Node.js service handling WebSockets for Twilio, Deepgram, and OpenAI.
- **Database**: Managed PostgreSQL (AWS RDS).
- **Cache/Queue**: Redis (AWS ElastiCache) for session management and potential task queuing.

## 2. Containerization Strategy
Each service will have its own `Dockerfile`.

- **Base Image**: `node:20-alpine` (for Node services) or `python:3.11-slim` (if Backend uses Python).
- **Multi-stage builds**: To keep production images small and secure.
- **Registry**: AWS Elastic Container Registry (ECR).

## 3. Cloud Infrastructure (AWS)
- **Compute**: ECS Fargate (scales automatically, no server management).
- **Networking**:
    - **VPC**: Private subnets for services, public subnets for Load Balancer.
    - **Application Load Balancer (ALB)**: Handles incoming traffic.
    - **Sticky Sessions**: Enabled on ALB for the Voice Service to ensure WebSocket stability.
- **Storage**:
    - **S3**: Static assets and call recordings (if needed).
- **Database**: RDS PostgreSQL (Multi-AZ for production).

## 4. CI/CD Pipeline (GitHub Actions)
The pipeline will be split into three stages:

### Stage 1: Validation (CI)
- Trigger: Every Pull Request.
- Actions: Linting, Unit Tests, Security Scanning (Trivy).

### Stage 2: Build & Push
- Trigger: Merge to `main` or `staging` branches.
- Actions: Build Docker images, tag with commit SHA, push to ECR.

### Stage 3: Deployment (CD)
- Trigger: Success of Stage 2.
- Actions: Update ECS Service with the new task definition.

## 5. Monitoring & Logging
- **Logging**: AWS CloudWatch Logs for all container stdout/stderr.
- **Metrics**: CloudWatch Metrics (CPU, Memory, Request Count, 4xx/5xx rates).
- **Error Tracking**: Sentry integration in all services.
- **Uptime Monitoring**: Better Stack or Pingdom.

## 6. Secrets Management
- **Development**: `.env` files (gitignored).
- **Production/Staging**: AWS Secrets Manager.
- **Injection**: Secrets are injected as environment variables into ECS tasks at runtime.

### Required Secrets:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `DATABASE_URL`
- `SENTRY_DSN`

## 7. Scalability Considerations
- **Voice Service**: Specifically needs to scale based on "Active Call" metrics. Since each call holds a WebSocket, we'll monitor concurrent connections.
- **Regional Deployment**: Initially `us-east-1`. Future expansion to other regions to reduce latency for international customers.

## 8. Deployment Strategy
- **Development**: Local Docker Compose.
- **Staging**: Automated deployment on `staging` branch.
- **Production**: Manual approval or automated deployment on `main` branch (post-staging verification).
- **Zero-downtime**: Blue/Green or Rolling updates via ECS.

## Deployment Steps
1. **Infrastructure Provisioning**:
   - Ensure AWS credentials are configured.
   - Navigate to `infra/terraform/`.
   - Run `terraform init`.
   - Run `terraform plan -out=tfplan`.
   - Run `terraform apply tfplan`.
2. **Secrets Configuration**:
   - Update placeholders in AWS Secrets Manager (`callflow-ai-api-keys`) with actual values for OpenAI, Deepgram, and Twilio.
3. **CI/CD Setup**:
   - Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub Repository Secrets.
   - Push to `main` or `staging` branch to trigger the pipeline.
