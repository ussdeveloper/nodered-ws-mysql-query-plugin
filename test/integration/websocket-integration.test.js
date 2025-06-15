const { expect } = require('chai');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');

// Import client library
const NodeRedWSConnection = require('../../client/nodered-ws-client.js');

describe('MySQL WebSocket Server - Integration Tests', function() {
    this.timeout(15000);
    
    let wsServer;
    let dbConnection;
    const testPort = 8081;
    const testEndpoint = '/test-mysql-ws';
    
    // Test database configuration (requires running MySQL instance)
    const dbConfig = {
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: process.env.TEST_MYSQL_PORT || 3306,
        user: process.env.TEST_MYSQL_USER || 'root',
        password: process.env.TEST_MYSQL_PASSWORD || '',
        database: process.env.TEST_MYSQL_DATABASE || 'test'
    };
    
    before(async function() {
        // Skip tests if no database configuration
        if (!process.env.TEST_MYSQL_HOST && !process.env.CI) {
            this.skip();
        }
        
        try {
            // Test database connection
            dbConnection = await mysql.createConnection(dbConfig);
            await dbConnection.ping();
            
            // Create test table
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS test_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Insert test data
            await dbConnection.execute(`
                INSERT IGNORE INTO test_users (name, email) VALUES 
                ('John Doe', 'john@example.com'),
                ('Jane Smith', 'jane@example.com'),
                ('Bob Johnson', 'bob@example.com')
            `);
            
        } catch (error) {
            console.log('Database connection failed, skipping integration tests:', error.message);
            this.skip();
        }
    });
    
    after(async function() {
        if (dbConnection) {
            // Clean up test data
            await dbConnection.execute('DELETE FROM test_users WHERE email LIKE "%@example.com"');
            await dbConnection.end();
        }
        
        if (wsServer) {
            wsServer.close();
        }
    });
    
    describe('WebSocket Server Setup', function() {
        it('should start WebSocket server on specified port', function(done) {
            wsServer = new WebSocket.Server({ 
                port: testPort,
                path: testEndpoint
            });
            
            wsServer.on('listening', () => {
                expect(wsServer.address().port).to.equal(testPort);
                done();
            });
            
            wsServer.on('error', (error) => {
                done(error);
            });
        });
        
        it('should accept WebSocket connections', function(done) {
            const ws = new WebSocket(`ws://localhost:${testPort}${testEndpoint}`);
            
            ws.on('open', () => {
                ws.close();
                done();
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        });
    });
    
    describe('Client Connection Flow', function() {
        let mockServer;
        
        beforeEach(function(done) {
            mockServer = new WebSocket.Server({ 
                port: testPort + 1,
                path: testEndpoint
            });
            
            mockServer.on('connection', (ws) => {
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'welcome',
                    clientId: 'test-client-123',
                    requiresAuth: false,
                    heartbeatInterval: 30000
                }));
                
                ws.on('message', (message) => {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'query':
                            ws.send(JSON.stringify({
                                type: 'query_response',
                                queryId: data.queryId,
                                success: true,
                                data: [{ result: 'test data' }],
                                rowCount: 1
                            }));
                            break;
                            
                        case 'ping':
                            ws.send(JSON.stringify({
                                type: 'pong',
                                timestamp: Date.now()
                            }));
                            break;
                    }
                });
            });
            
            mockServer.on('listening', () => done());
        });
        
        afterEach(function() {
            if (mockServer) {
                mockServer.close();
            }
        });
        
        it('should establish connection and receive welcome message', function(done) {
            const client = new NodeRedWSConnection(`ws://localhost:${testPort + 1}${testEndpoint}`);
            
            client.onConnect = () => {
                expect(client.Status.connection).to.equal('connected');
                expect(client.Status.clientId).to.equal('test-client-123');
                client.disconnect();
                done();
            };
            
            client.onError = (error) => {
                done(error);
            };
        });
        
        it('should execute query and receive response', function(done) {
            const client = new NodeRedWSConnection(`ws://localhost:${testPort + 1}${testEndpoint}`);
            
            client.onConnect = async () => {
                try {
                    const result = await client.Query('SELECT 1 as test');
                    expect(result.data).to.be.an('array');
                    expect(result.rowCount).to.equal(1);
                    client.disconnect();
                    done();
                } catch (error) {
                    done(error);
                }
            };
            
            client.onError = (error) => {
                done(error);
            };
        });
        
        it('should handle heartbeat correctly', function(done) {
            const client = new NodeRedWSConnection(`ws://localhost:${testPort + 1}${testEndpoint}`);
            
            let heartbeatReceived = false;
            
            client.onConnect = () => {
                // Send heartbeat from server
                setTimeout(() => {
                    if (client.ws && client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify({
                            type: 'heartbeat',
                            timestamp: Date.now()
                        }));
                    }
                }, 100);
            };
            
            client.onHeartbeat = () => {
                heartbeatReceived = true;
                setTimeout(() => {
                    expect(heartbeatReceived).to.be.true;
                    client.disconnect();
                    done();
                }, 50);
            };
            
            client.onError = (error) => {
                done(error);
            };
        });
    });
    
    describe('Authentication Flow', function() {
        let authServer;
        
        beforeEach(function(done) {
            authServer = new WebSocket.Server({ 
                port: testPort + 2,
                path: testEndpoint
            });
            
            authServer.on('connection', (ws) => {
                ws.send(JSON.stringify({
                    type: 'welcome',
                    clientId: 'auth-test-123',
                    requiresAuth: true,
                    heartbeatInterval: 30000
                }));
                
                ws.on('message', (message) => {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'auth') {
                        const success = data.password === 'correct-password';
                        ws.send(JSON.stringify({
                            type: 'auth_response',
                            success: success,
                            error: success ? null : 'Invalid password'
                        }));
                    }
                });
            });
            
            authServer.on('listening', () => done());
        });
        
        afterEach(function() {
            if (authServer) {
                authServer.close();
            }
        });
        
        it('should authenticate with correct password', function(done) {
            const client = new NodeRedWSConnection(
                `ws://localhost:${testPort + 2}${testEndpoint}`, 
                'correct-password'
            );
            
            setTimeout(() => {
                expect(client.Status.authenticated).to.be.true;
                client.disconnect();
                done();
            }, 500);
            
            client.onError = (error) => {
                done(error);
            };
        });
        
        it('should fail authentication with incorrect password', function(done) {
            const client = new NodeRedWSConnection(
                `ws://localhost:${testPort + 2}${testEndpoint}`, 
                'wrong-password'
            );
            
            client.onError = (error) => {
                expect(error.message).to.include('Authentication failed');
                done();
            };
            
            setTimeout(() => {
                if (client.Status.authenticated) {
                    done(new Error('Should not authenticate with wrong password'));
                }
            }, 500);
        });
    });
    
    describe('Error Handling', function() {
        it('should handle connection timeout', function(done) {
            // Try to connect to non-existent server
            const client = new NodeRedWSConnection('ws://localhost:99999/nonexistent');
            
            client.onError = (error) => {
                expect(error).to.be.an('error');
                done();
            };
            
            // Timeout the test if no error occurs
            setTimeout(() => {
                done(new Error('Expected connection error did not occur'));
            }, 3000);
        });
        
        it('should handle malformed server responses', function(done) {
            const malformedServer = new WebSocket.Server({ 
                port: testPort + 3,
                path: testEndpoint
            });
            
            malformedServer.on('connection', (ws) => {
                // Send invalid JSON
                ws.send('{ invalid json }');
            });
            
            malformedServer.on('listening', () => {
                const client = new NodeRedWSConnection(`ws://localhost:${testPort + 3}${testEndpoint}`);
                
                client.onError = (error) => {
                    expect(error).to.be.an('error');
                    malformedServer.close();
                    done();
                };
                
                setTimeout(() => {
                    malformedServer.close();
                    done(new Error('Expected parsing error did not occur'));
                }, 1000);
            });
        });
    });
});
