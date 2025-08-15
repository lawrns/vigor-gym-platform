# Vigor Development Workflow and Branching Strategy
## Comprehensive Guide for Team Collaboration and Code Management

**Version:** 1.0.0  
**Date:** August 2025  
**Author:** Manus AI  
**Purpose:** Define development workflow, branching strategy, and collaboration processes

---

## Git Workflow and Branching Strategy

### Branch Structure and Naming Conventions

**Main Branches (Permanent)**
```
main                    # Production-ready code, protected branch
├── develop            # Integration branch, auto-deploys to staging
├── staging            # Pre-production testing branch
└── hotfix/*           # Critical production fixes
```

**Feature Branches (Temporary)**
```
feature/                # Feature development branches
├── feature/member-management
├── feature/cfdi-compliance
├── feature/churn-prediction
└── feature/mobile-app

release/                # Release preparation branches
├── release/v1.0.0
├── release/v1.1.0
└── release/v2.0.0

bugfix/                 # Non-critical bug fixes
├── bugfix/login-validation
├── bugfix/payment-error
└── bugfix/ui-responsive
```

### Branch Naming Standards

**Feature Branches**
- Format: `feature/[component]-[description]`
- Examples: `feature/auth-jwt-implementation`, `feature/member-churn-prediction`
- Use kebab-case for multi-word descriptions
- Keep names descriptive but concise (max 50 characters)

**Bugfix Branches**
- Format: `bugfix/[component]-[issue-description]`
- Examples: `bugfix/billing-cfdi-generation`, `bugfix/mobile-app-crash`
- Reference issue number when applicable: `bugfix/issue-123-login-error`

**Hotfix Branches**
- Format: `hotfix/[version]-[critical-issue]`
- Examples: `hotfix/v1.0.1-security-patch`, `hotfix/v1.0.2-payment-failure`
- Always include version number for tracking

**Release Branches**
- Format: `release/v[major].[minor].[patch]`
- Examples: `release/v1.0.0`, `release/v1.1.0`, `release/v2.0.0`
- Follow semantic versioning standards

### Detailed Workflow Processes

**Feature Development Workflow**

1. **Branch Creation**
   ```bash
   # Start from latest develop branch
   git checkout develop
   git pull origin develop
   
   # Create feature branch
   git checkout -b feature/member-management
   ```

2. **Development Process**
   ```bash
   # Make regular commits with descriptive messages
   git add .
   git commit -m "feat(member): implement member registration API"
   
   # Push feature branch regularly
   git push origin feature/member-management
   ```

3. **Pre-Merge Preparation**
   ```bash
   # Sync with latest develop before creating PR
   git checkout develop
   git pull origin develop
   git checkout feature/member-management
   git rebase develop
   
   # Resolve any conflicts and test
   npm test
   npm run lint
   ```

4. **Pull Request Creation**
   - Create PR from feature branch to develop
   - Use PR template with checklist
   - Assign reviewers (minimum 2 for critical features)
   - Add labels for component and priority
   - Link related issues and documentation

5. **Code Review Process**
   - Technical review for code quality and architecture
   - Security review for sensitive changes
   - Business logic review for requirements alignment
   - Documentation review for completeness

6. **Merge and Cleanup**
   ```bash
   # After PR approval and merge
   git checkout develop
   git pull origin develop
   git branch -d feature/member-management
   git push origin --delete feature/member-management
   ```

**Release Workflow**

1. **Release Branch Creation**
   ```bash
   # Create release branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. **Release Preparation**
   - Update version numbers in package.json, setup.py, etc.
   - Update CHANGELOG.md with release notes
   - Run comprehensive test suite
   - Perform security and performance testing
   - Update documentation and API specs

3. **Release Testing**
   ```bash
   # Deploy to staging environment
   git push origin release/v1.0.0
   
   # Run automated test suite
   npm run test:e2e
   npm run test:performance
   
   # Manual testing and validation
   ```

4. **Release Deployment**
   ```bash
   # Merge to main for production deployment
   git checkout main
   git merge --no-ff release/v1.0.0
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   
   # Merge back to develop
   git checkout develop
   git merge --no-ff release/v1.0.0
   git push origin develop
   
   # Delete release branch
   git branch -d release/v1.0.0
   git push origin --delete release/v1.0.0
   ```

**Hotfix Workflow**

1. **Hotfix Creation**
   ```bash
   # Create hotfix branch from main
   git checkout main
   git pull origin main
   git checkout -b hotfix/v1.0.1-security-patch
   ```

2. **Fix Implementation**
   ```bash
   # Implement critical fix
   git add .
   git commit -m "fix(security): patch authentication vulnerability"
   
   # Test fix thoroughly
   npm test
   npm run test:security
   ```

3. **Emergency Deployment**
   ```bash
   # Merge to main for immediate deployment
   git checkout main
   git merge --no-ff hotfix/v1.0.1-security-patch
   git tag -a v1.0.1 -m "Hotfix version 1.0.1 - Security patch"
   git push origin main --tags
   
   # Merge to develop to keep branches in sync
   git checkout develop
   git merge --no-ff hotfix/v1.0.1-security-patch
   git push origin develop
   
   # Delete hotfix branch
   git branch -d hotfix/v1.0.1-security-patch
   git push origin --delete hotfix/v1.0.1-security-patch
   ```

### Branch Protection Rules

**Main Branch Protection**
```yaml
Protection Rules:
  - Require pull request reviews: 2 approvals minimum
  - Dismiss stale reviews: true
  - Require review from code owners: true
  - Require status checks: true
  - Require branches to be up to date: true
  - Require conversation resolution: true
  - Restrict pushes: true (no direct commits)
  - Allow force pushes: false
  - Allow deletions: false
```

**Develop Branch Protection**
```yaml
Protection Rules:
  - Require pull request reviews: 1 approval minimum
  - Require status checks: true
  - Require branches to be up to date: true
  - Allow force pushes: false (except for administrators)
  - Allow deletions: false
```

### Commit Message Standards

**Conventional Commits Format**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Commit Types**
- `feat`: New feature implementation
- `fix`: Bug fix or issue resolution
- `docs`: Documentation changes only
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD pipeline changes
- `build`: Build system or external dependency changes

**Scope Examples**
- `auth`: Authentication and authorization
- `member`: Member management features
- `billing`: Billing and payment processing
- `analytics`: Analytics and reporting
- `mobile`: Mobile application
- `api`: API endpoints and services
- `ui`: User interface components
- `db`: Database changes

**Commit Message Examples**
```bash
feat(auth): implement JWT token refresh mechanism
fix(billing): resolve CFDI invoice generation error
docs(api): update member management endpoint documentation
style(ui): format member profile component code
refactor(analytics): optimize churn prediction algorithm
perf(db): add indexes for member query optimization
test(member): add unit tests for registration validation
chore(deps): update React to version 18.2.0
ci(deploy): add automated staging deployment
build(docker): optimize container image size
```

---

## Code Review Process and Standards

### Code Review Checklist

**Technical Review**
- [ ] Code follows project coding standards and conventions
- [ ] Functions and classes are properly documented
- [ ] Error handling is comprehensive and appropriate
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Code is testable and includes appropriate tests
- [ ] Dependencies are justified and up-to-date

**Architecture Review**
- [ ] Changes align with overall system architecture
- [ ] Microservices boundaries are respected
- [ ] Database schema changes are backward compatible
- [ ] API changes maintain backward compatibility
- [ ] Integration patterns follow established conventions

**Business Logic Review**
- [ ] Implementation matches requirements and specifications
- [ ] Edge cases and error scenarios are handled
- [ ] User experience considerations are addressed
- [ ] Accessibility requirements are met
- [ ] Internationalization (Spanish/English) is supported

**Security Review**
- [ ] Input validation and sanitization implemented
- [ ] Authentication and authorization properly enforced
- [ ] Sensitive data is encrypted and protected
- [ ] SQL injection and XSS vulnerabilities prevented
- [ ] Security headers and CORS configured correctly

### Review Assignment Strategy

**Automatic Reviewers (CODEOWNERS)**
```
# Global owners
* @vigor-platform/core-team

# Backend services
/backend/ @vigor-platform/backend-team
/backend/auth-service/ @vigor-platform/security-team
/backend/billing-service/ @vigor-platform/billing-team

# Frontend applications
/frontend/ @vigor-platform/frontend-team
/frontend/mobile-app/ @vigor-platform/mobile-team

# Infrastructure and DevOps
/infrastructure/ @vigor-platform/devops-team
/.github/ @vigor-platform/devops-team

# Documentation
/docs/ @vigor-platform/product-team
```

**Review Requirements by Component**
- **Critical Components** (auth, billing, compliance): 2+ reviewers including security specialist
- **Core Features** (member management, analytics): 2+ reviewers including architect
- **UI Components**: 1+ reviewer including UX designer
- **Documentation**: 1+ reviewer including product manager
- **Infrastructure**: 1+ reviewer including DevOps engineer

### Pull Request Templates

**Feature Pull Request Template**
```markdown
## Description
Brief description of the changes and their purpose.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #[issue number]
Related to #[issue number]

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance testing completed (if applicable)

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

**Hotfix Pull Request Template**
```markdown
## Critical Issue Description
Describe the critical issue that requires immediate attention.

## Root Cause Analysis
Explain what caused the issue and why it wasn't caught earlier.

## Fix Implementation
Describe the fix and why this approach was chosen.

## Risk Assessment
- [ ] Low risk - isolated change with minimal impact
- [ ] Medium risk - change affects multiple components
- [ ] High risk - significant change with potential side effects

## Testing
- [ ] Fix verified in staging environment
- [ ] Regression testing completed
- [ ] Performance impact assessed
- [ ] Security implications reviewed

## Rollback Plan
Describe the rollback procedure if the fix causes issues.

## Post-Deployment Actions
- [ ] Monitor system metrics for 24 hours
- [ ] Update documentation
- [ ] Schedule post-mortem meeting
- [ ] Implement preventive measures
```

---

## Continuous Integration and Deployment

### CI/CD Pipeline Configuration

**GitHub Actions Workflow Structure**
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
        python-version: [3.9, 3.10]
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: |
          npm ci
          pip install -r requirements.txt
      
      - name: Run linting
        run: |
          npm run lint
          flake8 backend/
      
      - name: Run tests
        run: |
          npm test -- --coverage
          pytest backend/ --cov=backend/
      
      - name: Security scan
        run: |
          npm audit
          safety check
          snyk test
```

**Deployment Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deployment Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          docker build -t vigor-platform:staging .
          kubectl apply -f k8s/staging/
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    needs: [security-scan, performance-test]
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker build -t vigor-platform:${{ github.sha }} .
          kubectl apply -f k8s/production/
```

### Quality Gates and Checks

**Automated Quality Checks**
1. **Code Linting**: ESLint, Pylint, Prettier formatting
2. **Security Scanning**: Snyk, OWASP dependency check, CodeQL
3. **Test Coverage**: Minimum 80% coverage for critical paths
4. **Performance Testing**: Load testing for API endpoints
5. **Accessibility Testing**: axe-core for WCAG compliance
6. **Documentation**: API documentation generation and validation

**Manual Quality Gates**
1. **Code Review**: Peer review with approval requirements
2. **Security Review**: Security team review for sensitive changes
3. **UX Review**: Design team review for user-facing changes
4. **Business Review**: Product team review for feature changes

### Environment Management

**Development Environment**
- **Purpose**: Individual developer workstations
- **Data**: Synthetic test data and fixtures
- **Deployment**: Manual from feature branches
- **Access**: Development team only
- **Configuration**: Local environment variables

**Staging Environment**
- **Purpose**: Integration testing and QA validation
- **Data**: Production-like data with anonymization
- **Deployment**: Automatic from develop branch
- **Access**: Development, QA, and product teams
- **Configuration**: Staging environment variables

**Production Environment**
- **Purpose**: Live customer-facing platform
- **Data**: Real customer data with full security
- **Deployment**: Manual from main branch with approvals
- **Access**: Operations team and authorized personnel
- **Configuration**: Production environment variables with secrets management

---

## Development Environment Setup

### Local Development Setup

**Prerequisites Installation**
```bash
# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python (3.10+)
sudo apt-get install python3.10 python3.10-pip python3.10-venv

# Install Docker and Docker Compose
sudo apt-get install docker.io docker-compose

# Install PostgreSQL client
sudo apt-get install postgresql-client

# Install Redis client
sudo apt-get install redis-tools
```

**Repository Setup**
```bash
# Clone repository
git clone https://github.com/vigor-platform/vigor-platform.git
cd vigor-platform

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend/web-app
npm install

# Install mobile app dependencies
cd ../mobile-app
npm install
```

**Environment Configuration**
```bash
# Copy environment templates
cp .env.example .env.local
cp backend/.env.example backend/.env.local
cp frontend/web-app/.env.example frontend/web-app/.env.local

# Configure database connection
export DATABASE_URL="postgresql://vigor:password@localhost:5432/vigor_dev"
export REDIS_URL="redis://localhost:6379/0"

# Configure API keys (development)
export OPENAI_API_KEY="your-openai-api-key"
export MERCADO_PAGO_ACCESS_TOKEN="your-mercado-pago-token"
```

**Database Setup**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
cd backend
python manage.py migrate

# Load development fixtures
python manage.py loaddata fixtures/dev_data.json
```

**Development Server Startup**
```bash
# Terminal 1: Backend API server
cd backend
source venv/bin/activate
python manage.py runserver 8000

# Terminal 2: Frontend development server
cd frontend/web-app
npm start

# Terminal 3: Mobile app development
cd frontend/mobile-app
npx react-native start
```

### IDE Configuration

**Visual Studio Code Setup**
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "eslint.workingDirectories": ["frontend/web-app", "frontend/mobile-app"],
  "prettier.configPath": ".prettierrc",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**Recommended Extensions**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.pylint",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.remote-containers",
    "github.copilot"
  ]
}
```

### Docker Development Environment

**Docker Compose Configuration**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: vigor_dev
      POSTGRES_USER: vigor
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://vigor:password@postgres:5432/vigor_dev
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend/web-app
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/web-app:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:8000

volumes:
  postgres_data:
```

**Development Commands**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Run database migrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Run tests
docker-compose -f docker-compose.dev.yml exec backend pytest
docker-compose -f docker-compose.dev.yml exec frontend npm test

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

---

## Testing Strategy and Implementation

### Testing Framework Setup

**Backend Testing (Python/Django)**
```python
# backend/conftest.py
import pytest
from django.test import TestCase
from rest_framework.test import APITestCase
from unittest.mock import Mock, patch

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_user():
    from django.contrib.auth.models import User
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    return user

@pytest.fixture
def gym_owner():
    from apps.accounts.models import GymOwner
    return GymOwner.objects.create(
        name='Test Gym',
        email='owner@testgym.com',
        phone='+525512345678'
    )
```

**Frontend Testing (React/Jest)**
```javascript
// frontend/web-app/src/setupTests.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock API calls
global.fetch = jest.fn();

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:8000';
```

**Mobile Testing (React Native/Jest)**
```javascript
// frontend/mobile-app/jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Implementation Examples

**Unit Test Example (Backend)**
```python
# backend/apps/members/tests/test_models.py
import pytest
from django.core.exceptions import ValidationError
from apps.members.models import Member
from apps.gyms.models import Gym

class TestMemberModel:
    def test_member_creation(self, gym_owner):
        gym = Gym.objects.create(
            name='Test Gym',
            owner=gym_owner
        )
        
        member = Member.objects.create(
            gym=gym,
            email='member@example.com',
            first_name='John',
            last_name='Doe',
            phone='+525512345678'
        )
        
        assert member.email == 'member@example.com'
        assert member.full_name == 'John Doe'
        assert member.is_active is True

    def test_member_email_validation(self, gym_owner):
        gym = Gym.objects.create(name='Test Gym', owner=gym_owner)
        
        with pytest.raises(ValidationError):
            member = Member(
                gym=gym,
                email='invalid-email',
                first_name='John',
                last_name='Doe'
            )
            member.full_clean()
```

**Integration Test Example (API)**
```python
# backend/apps/members/tests/test_api.py
import pytest
from rest_framework import status
from django.urls import reverse
from apps.members.models import Member

class TestMemberAPI:
    def test_create_member(self, api_client, authenticated_user, gym_owner):
        gym = Gym.objects.create(name='Test Gym', owner=gym_owner)
        api_client.force_authenticate(user=authenticated_user)
        
        url = reverse('member-list')
        data = {
            'gym': gym.id,
            'email': 'newmember@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'phone': '+525587654321'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Member.objects.filter(email='newmember@example.com').exists()

    def test_member_churn_prediction(self, api_client, authenticated_user, member):
        api_client.force_authenticate(user=authenticated_user)
        
        url = reverse('member-churn-prediction', kwargs={'pk': member.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'churn_probability' in response.data
        assert 0 <= response.data['churn_probability'] <= 1
```

**Frontend Component Test Example**
```javascript
// frontend/web-app/src/components/MemberList/MemberList.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MemberList from './MemberList';
import { membersSlice } from '../../store/slices/membersSlice';

const mockMembers = [
  {
    id: 1,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active'
  },
  {
    id: 2,
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    status: 'inactive'
  }
];

const renderWithStore = (component, initialState = {}) => {
  const store = configureStore({
    reducer: {
      members: membersSlice.reducer
    },
    preloadedState: initialState
  });
  
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('MemberList', () => {
  test('renders member list correctly', () => {
    const initialState = {
      members: {
        list: mockMembers,
        loading: false,
        error: null
      }
    };
    
    renderWithStore(<MemberList />, initialState);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('filters members by search term', async () => {
    const user = userEvent.setup();
    const initialState = {
      members: {
        list: mockMembers,
        loading: false,
        error: null
      }
    };
    
    renderWithStore(<MemberList />, initialState);
    
    const searchInput = screen.getByPlaceholderText('Search members...');
    await user.type(searchInput, 'John');
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});
```

**End-to-End Test Example**
```javascript
// tests/e2e/member-management.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Member Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as gym owner
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'owner@testgym.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
  });

  test('should create new member successfully', async ({ page }) => {
    // Navigate to members page
    await page.click('[data-testid=members-nav]');
    await expect(page.locator('[data-testid=members-list]')).toBeVisible();
    
    // Click add member button
    await page.click('[data-testid=add-member-button]');
    
    // Fill member form
    await page.fill('[data-testid=member-email]', 'newmember@example.com');
    await page.fill('[data-testid=member-first-name]', 'Carlos');
    await page.fill('[data-testid=member-last-name]', 'Rodriguez');
    await page.fill('[data-testid=member-phone]', '+525512345678');
    
    // Submit form
    await page.click('[data-testid=save-member-button]');
    
    // Verify member was created
    await expect(page.locator('text=Member created successfully')).toBeVisible();
    await expect(page.locator('text=Carlos Rodriguez')).toBeVisible();
  });

  test('should display churn prediction for at-risk members', async ({ page }) => {
    await page.goto('/members');
    
    // Look for at-risk member indicator
    const atRiskMember = page.locator('[data-testid=member-row]').filter({
      has: page.locator('[data-testid=churn-risk-high]')
    }).first();
    
    await expect(atRiskMember).toBeVisible();
    
    // Click on member to view details
    await atRiskMember.click();
    
    // Verify churn prediction details are shown
    await expect(page.locator('[data-testid=churn-probability]')).toBeVisible();
    await expect(page.locator('[data-testid=retention-recommendations]')).toBeVisible();
  });
});
```

---

## Performance Monitoring and Optimization

### Performance Metrics and Targets

**Application Performance Targets**
- **API Response Time**: <200ms for 95th percentile
- **Page Load Time**: <2 seconds for initial load
- **Time to Interactive**: <3 seconds on 3G networks
- **Database Query Time**: <50ms for simple queries, <200ms for complex
- **Memory Usage**: <512MB per service instance
- **CPU Usage**: <70% under normal load

**Monitoring Implementation**
```javascript
// frontend/web-app/src/utils/performance.js
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // Send to analytics
      this.sendMetric('page_load_time', loadTime);
    }
  }

  static measureAPICall(endpoint, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.sendMetric('api_response_time', duration, { endpoint });
  }

  static sendMetric(name, value, tags = {}) {
    // Send to monitoring service (DataDog, New Relic, etc.)
    if (window.analytics) {
      window.analytics.track('Performance Metric', {
        metric: name,
        value: value,
        ...tags
      });
    }
  }
}
```

**Backend Performance Monitoring**
```python
# backend/apps/core/middleware.py
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class PerformanceMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log slow requests
            if duration > 1.0:  # 1 second threshold
                logger.warning(
                    f"Slow request: {request.method} {request.path} "
                    f"took {duration:.2f}s"
                )
            
            # Add performance header
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Send to monitoring service
            self.send_performance_metric(request, duration)
        
        return response

    def send_performance_metric(self, request, duration):
        # Send to monitoring service
        pass
```

### Optimization Strategies

**Database Optimization**
```python
# backend/apps/members/models.py
from django.db import models
from django.db.models import Index

class Member(models.Model):
    gym = models.ForeignKey('gyms.Gym', on_delete=models.CASCADE)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            Index(fields=['gym', 'email']),
            Index(fields=['gym', 'created_at']),
            Index(fields=['gym', 'last_name', 'first_name']),
        ]
        
    @classmethod
    def get_active_members(cls, gym_id):
        # Optimized query with select_related
        return cls.objects.select_related('gym').filter(
            gym_id=gym_id,
            is_active=True
        ).order_by('last_name', 'first_name')
```

**Frontend Optimization**
```javascript
// frontend/web-app/src/components/MemberList/MemberList.jsx
import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

const MemberList = memo(({ members, onMemberSelect }) => {
  // Memoize filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(member => member.isActive);
  }, [members]);

  // Memoize row renderer
  const MemberRow = useCallback(({ index, style }) => {
    const member = filteredMembers[index];
    
    return (
      <div style={style} className="member-row">
        <div className="member-name">
          {member.firstName} {member.lastName}
        </div>
        <div className="member-email">{member.email}</div>
      </div>
    );
  }, [filteredMembers]);

  return (
    <List
      height={600}
      itemCount={filteredMembers.length}
      itemSize={80}
      itemData={filteredMembers}
    >
      {MemberRow}
    </List>
  );
});

export default MemberList;
```

This comprehensive development workflow and branching strategy guide provides the foundation for efficient team collaboration and high-quality code delivery. Regular review and updates of these processes will ensure they continue to serve the team's needs as the project grows and evolves.

