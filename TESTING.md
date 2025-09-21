# Testing Setup

This project uses Playwright for end-to-end testing with a Dockerized Netlify dev environment.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Netlify CLI (installed globally or via Docker)

## Environment Setup

1. Copy your `.env` file to the project root (it will be mounted into the Docker container)
2. Ensure all required environment variables are set as documented in `ENVIRONMENT_VARIABLES.md`

## Running Tests

### Local Development (Recommended)

1. Start the Netlify dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the tests:
   ```bash
   npm test
   ```

### Docker Environment

Run the complete test suite in Docker:
```bash
npm run test:docker
```

This will:
- Build and start the Netlify dev container with serverless functions
- Run Playwright tests against the containerized environment
- Generate test reports

### Individual Test Commands

- `npm test` - Run all tests headlessly
- `npm run test:headed` - Run tests with browser UI visible
- `npm run test:ui` - Run tests with Playwright UI mode
- `npm run test:docker` - Run tests in Docker environment

## Test Workflows

### 1. Basic Card Purchase
- Tests the complete purchase flow for a basic card
- Uses test Stripe credentials (4242424242424242)
- Verifies email notifications are sent
- Checks confirmation page displays correct information

### 2. TAG Core Card Purchase
- Tests the complete purchase flow for a TAG Core Card
- Uses placeholder images from `app/assets/`
- Tests all available attributes and features
- Verifies generated website functionality
- Tests vCard download

### 3. Admin Create Card
- Tests admin authentication
- Tests admin card creation workflow
- Verifies generated website and assets
- Tests vCard generation

### 4. Admin Modify Card
- Tests admin card modification workflow
- Verifies changes propagate to generated website
- Tests attribute updates and image changes

## Test Data

All tests use the following test data:
- Customer Name: John Doe
- Customer Email: connectme-customer@mailinator.com
- Customer Phone: 555-123-4567
- Website: https://bancroft.io
- Admin Credentials: username "admin", password "password"
- Stripe Test Card: 4242424242424242, Exp: 12/34, CVC: 123

## Email Verification

Tests verify emails are sent to:
- Customer: connectme-customer@mailinator.com
- Admin: connectme-test@mailinator.com

Check emails at: https://www.mailinator.com/v4/public/inboxes.jsp?msgid=connectme-test-1758430315-012348911012&to=connectme-test

## Troubleshooting

### Port Conflicts
If port 8888 is already in use, modify the `docker-compose.yml` file to use a different port.

### Environment Variables
Ensure all required environment variables are set in your `.env` file. The Docker container will mount this file.

### Image Assets
Tests use placeholder images from `app/assets/`. Ensure these files exist:
- `300x300.png`
- `350x100.png`
- `960x640.png`

### Network Issues
If tests fail due to network timeouts, increase the timeout values in the test files or check your internet connection for Stripe and email services.

## Test Reports

Test reports are generated in the `playwright-report/` directory after running tests. Open `playwright-report/index.html` in a browser to view detailed results.
