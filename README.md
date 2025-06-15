# Node-RED MySQL WebSocket Server

[![npm version](https://badge.fury.io/js/node-red-contrib-mysql-websocket-server.svg)](https://badge.fury.io/js/node-red-contrib-mysql-websocket-server)
[![Node.js CI](https://github.com/ussdeveloper/nodered-ws-mysql-query-plugin/workflows/Node.js%20CI/badge.svg)](https://github.com/ussdeveloper/nodered-ws-mysql-query-plugin/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Professional WebSocket server node for Node-RED that provides secure, real-time access to MySQL databases with advanced connection management, authentication, and client monitoring.

## 🚀 Features

- **Real-time Database Access** - Execute SQL queries via WebSocket connection
- **Optional Authentication** - Password protection for WebSocket connections
- **Connection Management** - Automatic client identification and session tracking
- **Heartbeat Monitoring** - Keep-alive system with automatic client cleanup
- **Connection Pooling** - Efficient MySQL connection management
- **Security** - Prepared statements to prevent SQL injection
- **Professional UI** - Intuitive configuration interface
- **Client Library** - Ready-to-use JavaScript client library

## 📦 Installation

```bash
npm install node-red-contrib-mysql-websocket-server
```

Or install directly from Node-RED's palette manager by searching for `mysql-websocket-server`.

## 🔧 Configuration

### Database Settings
- **MySQL Host**: Server hostname or IP address
- **MySQL Port**: Server port (default: 3306)
- **Username**: Database username
- **Password**: Database password
- **Database**: Target database name

### WebSocket Settings
- **WebSocket Port**: Port for WebSocket server (default: 8080)
- **Endpoint Path**: WebSocket endpoint path (default: /mysql-ws)
- **WebSocket Password**: Optional password for client authentication
- **Heartbeat Interval**: Client heartbeat interval in milliseconds (default: 30000)

## 🌐 Client Usage

### JavaScript Client Library

```javascript
// Initialize connection
const connection = new NodeRedWSConnection('ws://localhost:8080/mysql-ws', 'optional-password');

// Event handlers
connection.onConnect = () => {
    console.log('Connected to MySQL WebSocket server');
};

connection.onError = (error) => {
    console.error('Connection error:', error);
};

connection.onDisconnect = () => {
    console.log('Disconnected from server');
};

connection.onHeartbeat = () => {
    console.log('Heartbeat received');
};

// Execute asynchronous query
try {
    const result = await connection.Query('SELECT * FROM users WHERE active = ?', [1]);
    console.log('Query result:', result.data);
    console.log('Rows affected:', result.rowCount);
} catch (error) {
    console.error('Query error:', error);
}

// Execute synchronous query with timeout
const syncResult = connection.SyncQuery('SELECT COUNT(*) as total FROM products', [], 5000);
if (syncResult) {
    console.log('Product count:', syncResult.data[0].total);
} else {
    console.log('Query failed or timed out');
}

// Check connection status
console.log('Connection status:', connection.Status);
```

### Client Library Implementation

Create a new file `nodered-ws-client.js`:

```javascript
class NodeRedWSConnection {
    constructor(endpoint, password = null) {
        this.endpoint = endpoint;
        this.password = password;
        this.ws = null;
        this.clientId = null;
        this.authenticated = false;
        this.status = 'disconnected';
        this.queryPromises = new Map();
        this.queryCounter = 0;
        
        // Event handlers
        this.onConnect = null;
        this.onError = null;
        this.onServerPing = null;
        this.onDisconnect = null;
        this.onHeartbeat = null;
        
        this.connect();
    }
    
    connect() {
        try {
            this.ws = new WebSocket(this.endpoint);
            this.status = 'connecting';
            
            this.ws.onopen = () => {
                this.status = 'connected';
                if (this.onConnect) this.onConnect();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                this.status = 'disconnected';
                this.authenticated = false;
                if (this.onDisconnect) this.onDisconnect();
            };
            
            this.ws.onerror = (error) => {
                this.status = 'error';
                if (this.onError) this.onError(error);
            };
            
        } catch (error) {
            this.status = 'error';
            if (this.onError) this.onError(error);
        }
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                this.clientId = message.clientId;
                if (message.requiresAuth && this.password) {
                    this.authenticate();
                } else {
                    this.authenticated = !message.requiresAuth;
                }
                break;
                
            case 'auth_response':
                this.authenticated = message.success;
                if (!message.success && this.onError) {
                    this.onError(new Error('Authentication failed'));
                }
                break;
                
            case 'query_response':
                const promise = this.queryPromises.get(message.queryId);
                if (promise) {
                    if (message.success) {
                        promise.resolve(message);
                    } else {
                        promise.reject(new Error(message.error));
                    }
                    this.queryPromises.delete(message.queryId);
                }
                break;
                
            case 'heartbeat':
                if (this.onHeartbeat) this.onHeartbeat();
                // Respond to heartbeat
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
                break;
                
            case 'pong':
                if (this.onServerPing) this.onServerPing();
                break;
        }
    }
    
    authenticate() {
        this.send({
            type: 'auth',
            password: this.password
        });
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    async Query(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.authenticated) {
                reject(new Error('Not authenticated'));
                return;
            }
            
            const queryId = ++this.queryCounter;
            this.queryPromises.set(queryId, { resolve, reject });
            
            this.send({
                type: 'query',
                queryId: queryId,
                query: query,
                params: params
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.queryPromises.has(queryId)) {
                    this.queryPromises.delete(queryId);
                    reject(new Error('Query timeout'));
                }
            }, 30000);
        });
    }
    
    SyncQuery(query, params = [], timeout = 5000) {
        let result = null;
        let completed = false;
        
        this.Query(query, params)
            .then(res => {
                result = res;
                completed = true;
            })
            .catch(() => {
                completed = true;
            });
        
        const start = Date.now();
        while (!completed && (Date.now() - start) < timeout) {
            // Busy wait (not recommended for production, use with caution)
            // In real implementation, consider using async/await with proper timeout
        }
        
        return result;
    }
    
    get Status() {
        return {
            connection: this.status,
            authenticated: this.authenticated,
            clientId: this.clientId
        };
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Export for use in browsers or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeRedWSConnection;
} else if (typeof window !== 'undefined') {
    window.NodeRedWSConnection = NodeRedWSConnection;
}
```

## 🔒 Security Features

- **Prepared Statements**: All SQL queries use parameterized statements to prevent SQL injection
- **Optional Authentication**: WebSocket connections can be password-protected
- **Client Identification**: Each client receives a unique identifier for session tracking
- **Connection Timeout**: Automatic cleanup of inactive connections
- **Heartbeat Monitoring**: Regular ping/pong to detect disconnected clients

## 📊 Monitoring

The node provides real-time status information in the Node-RED interface:

- **🟢 Green**: Server running normally, shows connected client count
- **🟡 Yellow**: Initializing or connecting to database
- **🔴 Red**: Connection error or server failure

## 🛠️ Development

### Prerequisites
- Node.js 14.x or higher
- Node-RED 3.x or higher
- MySQL 5.7 or higher

### Testing
```bash
# Install dependencies
npm install

# Run tests (when available)
npm test

# Lint code
npm run lint
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📋 Protocol Specification

### Message Types

#### Client to Server
```javascript
// Authentication
{
    type: 'auth',
    password: 'your-password'
}

// SQL Query
{
    type: 'query',
    queryId: 123,
    query: 'SELECT * FROM users WHERE id = ?',
    params: [userId]
}

// Ping Response
{
    type: 'ping',
    timestamp: 1640995200000
}
```

#### Server to Client
```javascript
// Welcome Message
{
    type: 'welcome',
    clientId: 'uuid-string',
    requiresAuth: true,
    heartbeatInterval: 30000
}

// Query Response
{
    type: 'query_response',
    queryId: 123,
    success: true,
    data: [...],
    rowCount: 5,
    affectedRows: 0,
    insertId: null
}

// Heartbeat
{
    type: 'heartbeat',
    timestamp: 1640995200000
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check MySQL server is running
   - Verify host and port settings
   - Ensure network connectivity

2. **Authentication Failed**
   - Verify MySQL username and password
   - Check user permissions for the database
   - Ensure user can connect from the Node-RED host

3. **WebSocket Connection Failed**
   - Check WebSocket port is not in use
   - Verify firewall settings
   - Ensure endpoint path is correct

4. **Query Timeout**
   - Check query syntax and performance
   - Verify database connectivity
   - Consider increasing timeout values

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: support@yourcompany.com
- 🐛 Issues: [GitHub Issues](https://github.com/ussdeveloper/nodered-ws-mysql-query-plugin/issues)
- 📖 Documentation: [Wiki](https://github.com/ussdeveloper/nodered-ws-mysql-query-plugin/wiki)

## 🏆 Changelog

### v1.0.0
- Initial release
- WebSocket server implementation
- MySQL connection pooling
- Client authentication
- Heartbeat monitoring
- JavaScript client library

---

Made with ❤️ for the Node-RED community
