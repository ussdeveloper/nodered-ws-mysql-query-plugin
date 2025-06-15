/**
 * NodeRed WebSocket MySQL Client Library
 * Professional JavaScript client for connecting to Node-RED MySQL WebSocket Server
 * 
 * Features:
 * - Automatic connection management with reconnection
 * - Promise-based and synchronous query interfaces
 * - Built-in authentication handling
 * - Heartbeat monitoring and response
 * - Connection status tracking
 * - Error handling and timeout management
 * 
 * @version 1.0.0
 * @author Node-RED MySQL WebSocket Server Team
 */

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
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Event handlers (can be overridden by user)
        this.onConnect = null;
        this.onError = null;
        this.onServerPing = null;
        this.onDisconnect = null;
        this.onHeartbeat = null;
        
        // Auto-connect on initialization
        this.connect();
    }
    
    /**
     * Establish WebSocket connection to the server
     */
    connect() {
        try {
            this.ws = new WebSocket(this.endpoint);
            this.status = 'connecting';
            
            this.ws.onopen = () => {
                this.status = 'connected';
                this.reconnectAttempts = 0;
                console.log(`[NodeRedWS] Connected to ${this.endpoint}`);
                if (this.onConnect) this.onConnect();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[NodeRedWS] Invalid message format:', error);
                    if (this.onError) this.onError(error);
                }
            };
            
            this.ws.onclose = (event) => {
                this.status = 'disconnected';
                this.authenticated = false;
                console.log(`[NodeRedWS] Connection closed. Code: ${event.code}`);
                
                if (this.onDisconnect) this.onDisconnect(event);
                
                // Attempt reconnection if not intentionally closed
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnection();
                }
            };
            
            this.ws.onerror = (error) => {
                this.status = 'error';
                console.error('[NodeRedWS] WebSocket error:', error);
                if (this.onError) this.onError(error);
            };
            
        } catch (error) {
            this.status = 'error';
            console.error('[NodeRedWS] Connection failed:', error);
            if (this.onError) this.onError(error);
        }
    }
    
    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[NodeRedWS] Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`[NodeRedWS] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    /**
     * Handle incoming messages from the server
     */
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                this.clientId = message.clientId;
                console.log(`[NodeRedWS] Received client ID: ${this.clientId}`);
                
                if (message.requiresAuth && this.password) {
                    this.authenticate();
                } else if (!message.requiresAuth) {
                    this.authenticated = true;
                    console.log('[NodeRedWS] Auto-authenticated (no password required)');
                } else {
                    console.warn('[NodeRedWS] Authentication required but no password provided');
                }
                break;
                
            case 'auth_response':
                this.authenticated = message.success;
                if (message.success) {
                    console.log('[NodeRedWS] Authentication successful');
                } else {
                    console.error('[NodeRedWS] Authentication failed:', message.error);
                    if (this.onError) this.onError(new Error(`Authentication failed: ${message.error}`));
                }
                break;
                
            case 'query_response':
                this.handleQueryResponse(message);
                break;
                
            case 'heartbeat':
                if (this.onHeartbeat) this.onHeartbeat();
                this.respondToPing();
                break;
                
            case 'pong':
                if (this.onServerPing) this.onServerPing();
                break;
                
            case 'error':
                console.error('[NodeRedWS] Server error:', message.error);
                if (this.onError) this.onError(new Error(message.error));
                break;
                
            default:
                console.warn('[NodeRedWS] Unknown message type:', message.type);
        }
    }
    
    /**
     * Handle query response from server
     */
    handleQueryResponse(message) {
        const promise = this.queryPromises.get(message.queryId);
        if (promise) {
            if (message.success) {
                promise.resolve({
                    data: message.data,
                    fields: message.fields,
                    rowCount: message.rowCount,
                    affectedRows: message.affectedRows,
                    insertId: message.insertId
                });
            } else {
                promise.reject(new Error(`Query failed: ${message.error} (${message.code})`));
            }
            this.queryPromises.delete(message.queryId);
        }
    }
    
    /**
     * Send authentication request to server
     */
    authenticate() {
        this.send({
            type: 'auth',
            password: this.password
        });
    }
    
    /**
     * Respond to server heartbeat ping
     */
    respondToPing() {
        this.send({
            type: 'ping',
            timestamp: Date.now()
        });
    }
      /**
     * Send data to server if connection is open
     */
    send(data) {
        if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
            this.ws.send(JSON.stringify(data));
            return true;
        } else {
            console.warn('[NodeRedWS] Cannot send data: connection not open');
            return false;
        }
    }
    
    /**
     * Execute SQL query asynchronously (returns Promise)
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters for prepared statement
     * @param {number} timeout - Query timeout in milliseconds (default: 30000)
     * @returns {Promise} Promise that resolves with query results
     */
    async Query(query, params = [], timeout = 30000) {
        return new Promise((resolve, reject) => {
            if (!this.authenticated) {
                reject(new Error('Not authenticated to server'));
                return;
            }
            
            if (this.status !== 'connected') {
                reject(new Error(`Connection not ready. Status: ${this.status}`));
                return;
            }
            
            const queryId = ++this.queryCounter;
            this.queryPromises.set(queryId, { resolve, reject });
            
            const success = this.send({
                type: 'query',
                queryId: queryId,
                query: query,
                params: params
            });
            
            if (!success) {
                this.queryPromises.delete(queryId);
                reject(new Error('Failed to send query to server'));
                return;
            }
            
            // Set timeout for query
            setTimeout(() => {
                if (this.queryPromises.has(queryId)) {
                    this.queryPromises.delete(queryId);
                    reject(new Error(`Query timeout after ${timeout}ms`));
                }
            }, timeout);
        });
    }    /**
     * Execute SQL query synchronously (blocks until result or timeout)
     * WARNING: This method uses busy waiting and should be used sparingly
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters for prepared statement
     * @param {number} timeout - Query timeout in milliseconds (default: 5000)
     * @returns {Object|null} Query results or null if failed/timeout
     */
    SyncQuery(query, params = [], timeout = 5000) {
        let result = null;
        let completed = false;
        let error = null;
        
        // Execute async query
        this.Query(query, params, timeout)
            .then(res => {
                result = res;
                completed = true;
            })
            .catch(err => {
                error = err;
                completed = true;
            });
        
        // Improved wait mechanism that allows event loop processing
        const start = Date.now();
        const checkInterval = 1; // Check every 1ms
        
        while (!completed && (Date.now() - start) < timeout) {
            // Process pending events by yielding to event loop
            const immediateStart = Date.now();
            
            // Force event loop to process by using a micro task
            Promise.resolve().then(() => {});
            
            // Very short wait to allow processing
            while (Date.now() - immediateStart < checkInterval) {
                // Allow some time for event processing
            }
        }
        
        if (error) {
            console.error('[NodeRedWS] SyncQuery error:', error.message);
            return null;
        }
        
        return completed ? result : null;
    }
    
    /**
     * Get current connection status and information
     * @returns {Object} Status object with connection details
     */
    get Status() {
        return {
            connection: this.status,
            authenticated: this.authenticated,
            clientId: this.clientId,
            endpoint: this.endpoint,
            reconnectAttempts: this.reconnectAttempts,
            pendingQueries: this.queryPromises.size
        };
    }
    
    /**
     * Manually disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }
        this.status = 'disconnected';
        this.authenticated = false;
    }
    
    /**
     * Check if connection is ready for queries
     * @returns {boolean} True if connected and authenticated
     */
    isReady() {
        return this.status === 'connected' && this.authenticated;
    }
    
    /**
     * Wait for connection to be ready
     * @param {number} timeout - Maximum wait time in milliseconds
     * @returns {Promise<boolean>} Promise that resolves when ready or rejects on timeout
     */
    waitForReady(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.isReady()) {
                resolve(true);
                return;
            }
            
            const startTime = Date.now();
            const checkReady = () => {
                if (this.isReady()) {
                    resolve(true);
                } else if (Date.now() - startTime >= timeout) {
                    reject(new Error('Timeout waiting for connection to be ready'));
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            checkReady();
        });
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = NodeRedWSConnection;
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.NodeRedWSConnection = NodeRedWSConnection;
} else if (typeof global !== 'undefined') {
    // Global environment
    global.NodeRedWSConnection = NodeRedWSConnection;
}

// For ES6 modules
if (typeof exports !== 'undefined') {
    exports.NodeRedWSConnection = NodeRedWSConnection;
}
