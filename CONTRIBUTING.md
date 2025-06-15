# Contributing to Node-RED MySQL WebSocket Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism in all interactions

## How to Contribute

### Types of Contributions

We welcome contributions in the form of:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new functionality
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve or add documentation
- **Testing**: Add or improve test coverage
- **Performance**: Optimize existing code

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/nodered-ws-mysql-query-plugin.git
   cd nodered-ws-mysql-query-plugin
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- Node-RED 3.0.0 or higher (for testing)
- MySQL/MariaDB (for integration tests)

### Installation

```bash
# Install dependencies
npm install

# Install development tools
npm install -g node-red

# Run tests to verify setup
npm test
```

### Project Structure

```
├── mysql-query.js          # Main Node-RED node implementation
├── mysql-query.html        # Node-RED UI configuration
├── client/                 # Client library
│   └── nodered-ws-client.js
├── test/                   # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── client/            # Client library tests
│   └── performance/       # Performance tests
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:client

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

- All new features must include tests
- Maintain or improve test coverage
- Use descriptive test names and organize by functionality
- Mock external dependencies appropriately

### Test Environment Setup

For integration tests, set these environment variables:

```bash
export TEST_MYSQL_HOST=localhost
export TEST_MYSQL_PORT=3306
export TEST_MYSQL_USER=root
export TEST_MYSQL_PASSWORD=your_password
export TEST_MYSQL_DATABASE=test
```

## Submitting Changes

### Pull Request Process

1. **Ensure tests pass**: `npm test`
2. **Lint your code**: `npm run lint`
3. **Update documentation** if needed
4. **Create a pull request** with:
   - Clear title and description
   - Reference any related issues
   - Include test results
   - List breaking changes (if any)

### Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

Examples:
```
feat(client): add automatic reconnection with exponential backoff
fix(server): resolve memory leak in connection cleanup
docs(readme): update installation instructions
test(unit): add tests for authentication flow
```

## Coding Standards

### JavaScript Style

- Use ESLint configuration provided in `.eslintrc.json`
- Follow Node.js best practices
- Use consistent indentation (2 spaces)
- Include JSDoc comments for functions
- Handle errors appropriately

### Code Quality

- Write self-documenting code
- Avoid deep nesting (max 3 levels)
- Keep functions focused and small
- Use meaningful variable names
- Add comments for complex logic

### Performance

- Optimize for high throughput
- Minimize memory allocations
- Use connection pooling
- Implement proper cleanup

## Issue Reporting

### Bug Reports

Include:
- **Environment**: Node.js version, Node-RED version, OS
- **Steps to reproduce**: Detailed reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Error messages**: Full error output
- **Configuration**: Relevant node configuration

### Feature Requests

Include:
- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Breaking changes**: Would this break existing functionality?

## Documentation

### Documentation Updates

- Update README.md for new features
- Add/update JSDoc comments
- Update TECHNICAL-SPECIFICATION.md for architecture changes
- Include examples in documentation

### Documentation Style

- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Keep documentation up-to-date with code changes

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] GitHub release created
- [ ] npm package published

## Getting Help

### Resources

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: support@nodered-mysql-ws.dev

### Community

- Be patient with responses
- Search existing issues before creating new ones
- Provide as much context as possible
- Help others when you can

## Recognition

Contributors will be:
- Listed in the contributors section of package.json
- Acknowledged in release notes
- Credited in the project README (for significant contributions)

Thank you for contributing to the Node-RED MySQL WebSocket Server! 🚀
