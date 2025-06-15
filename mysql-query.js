module.exports = function(RED) {
    'use strict';
    
    const mysql = require('mysql2/promise');
    const WebSocket = require('ws');
    const crypto = require('crypto');

    /**
     * Professional WebSocket MySQL Query Server Node
     * 
     * Creates a WebSocket server that provides secure, real-time access to MySQL databases.
     * Features include:
     * - Optional password authentication
     * - Database selection from available MySQL databases
     * - Configurable WebSocket endpoint
     * - Advanced connection management with heartbeat monitoring
     * - Client identification and session tracking
     * - Promise-based and synchronous query interfaces
     * - Automatic cleanup of disconnected clients
     * 
     * @param {Object} config - Node configuration from Node-RED UI
     */
    function MySQLWebSocketServerNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        
        // Configuration
        node.host = config.host || 'localhost';
        node.port = parseInt(config.port) || 3306;
        node.user = config.user;
        node.password = config.password;
        node.database = config.database;
        node.wsEndpoint = config.wsEndpoint || '/mysql-ws';
        node.wsPassword = config.wsPassword || null;
        node.wsPort = parseInt(config.wsPort) || 8080;
        node.heartbeatInterval = parseInt(config.heartbeatInterval) || 30000;
        
        // Internal state
        node.wsServer = null;
        node.clients = new Map(); // clientId -> {ws, lastPing, dbConnection}
        node.heartbeatTimer = null;
        
        // MySQL connection pool
        let connectionPool = null;
        
        /**
         * Initialize MySQL connection pool
         */
        async function initializeDatabase() {
            try {
                connectionPool = mysql.createPool({
                    host: node.host,
                    port: node.port,
                    user: node.user,
                    password: node.password,
                    database: node.database,
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                    acquireTimeout: 60000,
                    timeout: 60000
                });
                
                // Test connection
                const connection = await connectionPool.getConnection();
                await connection.ping();
                connection.release();
                
                node.status({ fill:'green', shape:'dot', text:`Connected to ${node.database}` });
                return true;
            } catch (error) {
                node.error('Database connection failed: ' + error.message);
                node.status({ fill:'red', shape:'ring', text:'DB connection failed' });
                return false;
            }
        }
        
        /**
         * Generate unique client identifier
         */
        function generateClientId() {
            return crypto.randomUUID();
        }
        
        /**
         * Authenticate WebSocket connection
         */
        function authenticateClient(password) {
            if (!node.wsPassword) return true; // No password required
            return password === node.wsPassword;
        }
        
        /**
         * Execute SQL query safely
         */
        async function executeQuery(query, params = []) {
            try {
                const [rows, fields] = await connectionPool.execute(query, params);
                return {
                    success: true,
                    data: rows,
                    fields: fields,
                    rowCount: rows.length,
                    affectedRows: rows.affectedRows || 0,
                    insertId: rows.insertId || null
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code
                };
            }
        }
        
        /**
         * Handle WebSocket client message
         */
        async function handleClientMessage(clientId, message) {
            try {
                const data = JSON.parse(message);
                const client = node.clients.get(clientId);
                
                if (!client) {
                    return { error: 'Client not found' };
                }
                
                switch (data.type) {
                case 'auth':
                    if (authenticateClient(data.password)) {
                        client.authenticated = true;
                        return {
                            type: 'auth_response',
                            success: true,
                            clientId: clientId
                        };
                    } else {
                        return {
                            type: 'auth_response',
                            success: false,
                            error: 'Invalid password'
                        };
                    }
                        
                case 'query': {
                    if (!client.authenticated && node.wsPassword) {
                        return {
                            type: 'query_response',
                            success: false,
                            error: 'Authentication required'
                        };
                    }
                        
                    const result = await executeQuery(data.query, data.params);
                    return {
                        type: 'query_response',
                        queryId: data.queryId,
                        ...result
                    };
                }
                        
                case 'ping':
                    client.lastPing = Date.now();
                    return {
                        type: 'pong',
                        timestamp: Date.now()
                    };
                        
                default:
                    return {
                        type: 'error',
                        error: 'Unknown message type'
                    };
                }
            } catch (error) {
                return {
                    type: 'error',
                    error: 'Invalid message format'
                };
            }
        }
        
        /**
         * Start heartbeat monitoring
         */
        function startHeartbeat() {
            node.heartbeatTimer = setInterval(() => {
                const now = Date.now();
                const deadClients = [];
                
                node.clients.forEach((client, clientId) => {
                    if (now - client.lastPing > node.heartbeatInterval * 2) {
                        deadClients.push(clientId);
                    } else {
                        // Send heartbeat ping
                        if (client.ws.readyState === WebSocket.OPEN) {
                            client.ws.send(JSON.stringify({
                                type: 'heartbeat',
                                timestamp: now
                            }));
                        }
                    }
                });
                
                // Clean up dead clients
                deadClients.forEach(clientId => {
                    const client = node.clients.get(clientId);
                    if (client) {
                        client.ws.terminate();
                        node.clients.delete(clientId);
                        node.log(`Client ${clientId} disconnected (timeout)`);
                    }
                });
                
                // Update status
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: `${node.clients.size} clients connected`
                });
                
            }, node.heartbeatInterval);
        }
        
        /**
         * Initialize WebSocket server
         */
        async function initializeWebSocket() {
            try {
                node.wsServer = new WebSocket.Server({ 
                    port: node.wsPort,
                    path: node.wsEndpoint
                });
                
                node.wsServer.on('connection', (ws, request) => {
                    const clientId = generateClientId();
                    const clientInfo = {
                        ws: ws,
                        lastPing: Date.now(),
                        authenticated: !node.wsPassword, // Auto-authenticate if no password
                        ip: request.socket.remoteAddress
                    };
                    
                    node.clients.set(clientId, clientInfo);
                    node.log(`New client connected: ${clientId} from ${clientInfo.ip}`);
                    
                    // Send welcome message
                    ws.send(JSON.stringify({
                        type: 'welcome',
                        clientId: clientId,
                        requiresAuth: !!node.wsPassword,
                        heartbeatInterval: node.heartbeatInterval
                    }));
                    
                    // Handle messages
                    ws.on('message', async (message) => {
                        const response = await handleClientMessage(clientId, message);
                        if (response && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(response));
                        }
                    });
                    
                    // Handle disconnection
                    ws.on('close', () => {
                        node.clients.delete(clientId);
                        node.log(`Client disconnected: ${clientId}`);
                    });
                    
                    ws.on('error', (error) => {
                        node.error(`WebSocket error for client ${clientId}: ${error.message}`);
                        node.clients.delete(clientId);
                    });
                });
                
                node.log(`WebSocket server started on port ${node.wsPort}${node.wsEndpoint}`);
                return true;
                
            } catch (error) {
                node.error('WebSocket server initialization failed: ' + error.message);
                return false;
            }
        }
        
        // Initialize the node
        async function initialize() {
            node.status({ fill:'yellow', shape:'ring', text:'initializing...' });
            
            const dbConnected = await initializeDatabase();
            if (!dbConnected) return;
            
            const wsStarted = await initializeWebSocket();
            if (!wsStarted) return;
            
            startHeartbeat();
            
            node.status({
                fill:'green', 
                shape:'dot', 
                text:`WebSocket server running on :${node.wsPort}${node.wsEndpoint}`
            });
        }
        
        // Start initialization
        initialize();
        
        // Handle node shutdown
        node.on('close', function() {
            if (node.heartbeatTimer) {
                clearInterval(node.heartbeatTimer);
            }
            
            if (node.wsServer) {
                node.wsServer.close();
            }
            
            if (connectionPool) {
                connectionPool.end();
            }
            
            node.clients.forEach((client) => {
                client.ws.terminate();
            });
            
            node.status({});
        });
    }
    
    // Register the node
    RED.nodes.registerType('mysql-websocket-server', MySQLWebSocketServerNode);
};
