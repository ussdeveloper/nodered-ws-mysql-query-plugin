# Security Policy

## Supported Versions

We actively support the following versions of the Node-RED MySQL WebSocket Server:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** open a public GitHub issue

Security vulnerabilities should not be reported publicly until they have been resolved.

### 2. Send a private report

Please email us at **security@nodered-mysql-ws.dev** with:

- A detailed description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (optional)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix Timeline**: Varies based on complexity, typically 14-30 days
- **Public Disclosure**: After fix is released and users have time to update

## Security Best Practices

When using this plugin:

### Database Security
- Use dedicated database users with minimal required permissions
- Enable SSL/TLS for database connections when possible
- Regularly update MySQL/MariaDB to latest secure versions
- Monitor database access logs

### WebSocket Security
- Always use strong passwords for WebSocket authentication
- Consider implementing rate limiting
- Use WSS (WebSocket Secure) in production environments
- Validate and sanitize all client input

### Node-RED Security
- Keep Node-RED updated to the latest version
- Secure your Node-RED instance with authentication
- Use HTTPS for Node-RED admin interface
- Regularly review and update all Node-RED plugins

### Network Security
- Use firewalls to restrict database and WebSocket access
- Consider VPN or private networks for sensitive deployments
- Monitor network traffic for unusual patterns

## Known Security Considerations

### SQL Injection Prevention
- All queries use prepared statements by default
- Parameters are properly escaped and validated
- Direct SQL concatenation is avoided

### Authentication
- Optional password protection for WebSocket connections
- Session management with automatic cleanup
- Client identification and tracking

### Data Protection
- Sensitive data should be encrypted at rest and in transit
- Consider data masking for sensitive database fields
- Implement proper access controls at the database level

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in the CHANGELOG.md
- Announced via GitHub releases
- Tagged with the `security` label

## Contact

For security-related questions or concerns:
- Email: security@nodered-mysql-ws.dev
- GitHub: [@ussdeveloper](https://github.com/ussdeveloper)

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who help improve our security (with their permission).
