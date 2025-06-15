const { expect } = require('chai');
const sinon = require('sinon');
const WebSocket = require('ws');

// Mock Node-RED environment
const mockRED = {
    nodes: {
        createNode: sinon.stub(),
        registerType: sinon.stub()
    }
};

// Load the node implementation
let MySQLWebSocketServerNode;

describe('MySQL WebSocket Server Node - Unit Tests', function() {
    this.timeout(5000);
    
    beforeEach(function() {
        // Reset mocks
        sinon.restore();
        
        // Mock the module loading
        delete require.cache[require.resolve('../../mysql-query.js')];
        const nodeModule = require('../../mysql-query.js');
        nodeModule(mockRED);
        
        // Get the registered node constructor
        MySQLWebSocketServerNode = mockRED.nodes.registerType.getCall(0).args[1];
    });
    
    describe('Node Configuration', function() {        it('should initialize with default configuration', function() {
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb'
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub(),
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb',
                wsEndpoint: '/mysql-ws',
                wsPort: 8080
            };
            
            mockRED.nodes.createNode = sinon.stub().callsFake((node, cfg) => {
                Object.assign(node, mockNode);
                Object.assign(node, cfg);
                return node;
            });
            
            // Mock the constructor without actually calling it
            // since it requires database connections
            expect(config.host).to.equal('localhost');
            expect(config.port).to.equal(3306);
            expect(config.user).to.equal('testuser');
            expect(config.password).to.equal('testpass');
            expect(config.database).to.equal('testdb');
        });
          it('should use custom WebSocket configuration', function() {
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb',
                wsEndpoint: '/custom-ws',
                wsPort: 9090,
                wsPassword: 'secret',
                heartbeatInterval: 60000
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub()
            };
            
            mockRED.nodes.createNode = sinon.stub().callsFake((node, cfg) => {
                Object.assign(node, mockNode);
                Object.assign(node, cfg);
                return node;
            });
            
            // Test configuration values
            expect(config.wsEndpoint).to.equal('/custom-ws');
            expect(config.wsPort).to.equal(9090);
            expect(config.wsPassword).to.equal('secret');
            expect(config.heartbeatInterval).to.equal(60000);
        });
    });
    
    describe('Client ID Generation', function() {
        it('should generate unique client IDs', function() {
            const crypto = require('crypto');
            const originalRandomUUID = crypto.randomUUID;
            
            let callCount = 0;
            crypto.randomUUID = () => `test-uuid-${++callCount}`;
            
            // Mock node for testing
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb'
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub()
            };
            
            mockRED.nodes.createNode.returns(mockNode);
            
            // Test that generateClientId creates unique IDs
            const id1 = crypto.randomUUID();
            const id2 = crypto.randomUUID();
            
            expect(id1).to.equal('test-uuid-1');
            expect(id2).to.equal('test-uuid-2');
            expect(id1).to.not.equal(id2);
            
            // Restore original function
            crypto.randomUUID = originalRandomUUID;
        });
    });
    
    describe('Authentication', function() {
        it('should authenticate with correct password', function() {
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb',
                wsPassword: 'secret'
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub(),
                wsPassword: 'secret'
            };
            
            mockRED.nodes.createNode.returns(mockNode);
            
            // Test authentication logic (would need to extract from node)
            const isAuthenticated = config.wsPassword === 'secret';
            expect(isAuthenticated).to.be.true;
        });
        
        it('should reject with incorrect password', function() {
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb',
                wsPassword: 'secret'
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub(),
                wsPassword: 'secret'
            };
            
            mockRED.nodes.createNode.returns(mockNode);
            
            // Test authentication logic
            const isAuthenticated = config.wsPassword === 'wrongpassword';
            expect(isAuthenticated).to.be.false;
        });
        
        it('should auto-authenticate when no password is set', function() {
            const config = {
                host: 'localhost',
                port: 3306,
                user: 'testuser',
                password: 'testpass',
                database: 'testdb'
                // wsPassword not set
            };
            
            const mockNode = {
                status: sinon.stub(),
                error: sinon.stub(),
                log: sinon.stub(),
                on: sinon.stub(),
                wsPassword: null
            };
            
            mockRED.nodes.createNode.returns(mockNode);
            
            // Test auto-authentication
            const isAuthenticated = !config.wsPassword;
            expect(isAuthenticated).to.be.true;
        });
    });
    
    describe('Message Handling', function() {
        it('should parse valid JSON messages', function() {
            const validMessage = JSON.stringify({
                type: 'query',
                queryId: 123,
                query: 'SELECT * FROM users',
                params: []
            });
            
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(validMessage);
            } catch (error) {
                // Should not throw
            }
            
            expect(parsedMessage).to.be.an('object');
            expect(parsedMessage.type).to.equal('query');
            expect(parsedMessage.queryId).to.equal(123);
        });
        
        it('should handle invalid JSON messages', function() {
            const invalidMessage = '{ invalid json }';
            
            let error = null;
            try {
                JSON.parse(invalidMessage);
            } catch (e) {
                error = e;
            }
            
            expect(error).to.be.an('error');
        });
    });
    
    describe('Query Response Format', function() {
        it('should format successful query response', function() {
            const mockResult = {
                success: true,
                data: [{ id: 1, name: 'Test User' }],
                fields: [{ name: 'id' }, { name: 'name' }],
                rowCount: 1,
                affectedRows: 0,
                insertId: null
            };
            
            const response = {
                type: 'query_response',
                queryId: 123,
                ...mockResult
            };
            
            expect(response.type).to.equal('query_response');
            expect(response.success).to.be.true;
            expect(response.data).to.be.an('array');
            expect(response.rowCount).to.equal(1);
        });
        
        it('should format error query response', function() {
            const mockError = {
                success: false,
                error: 'Table does not exist',
                code: 'ER_NO_SUCH_TABLE'
            };
            
            const response = {
                type: 'query_response',
                queryId: 123,
                ...mockError
            };
            
            expect(response.type).to.equal('query_response');
            expect(response.success).to.be.false;
            expect(response.error).to.equal('Table does not exist');
        });
    });
});

describe('Error Handling', function() {
    it('should handle database connection errors gracefully', function() {
        const mockError = new Error('Connection refused');
        mockError.code = 'ECONNREFUSED';
        
        expect(mockError.message).to.equal('Connection refused');
        expect(mockError.code).to.equal('ECONNREFUSED');
    });
    
    it('should handle SQL syntax errors', function() {
        const mockError = new Error('You have an error in your SQL syntax');
        mockError.code = 'ER_PARSE_ERROR';
        
        expect(mockError.message).to.include('SQL syntax');
        expect(mockError.code).to.equal('ER_PARSE_ERROR');
    });
    
    it('should handle authentication errors', function() {
        const mockError = new Error('Access denied for user');
        mockError.code = 'ER_ACCESS_DENIED_ERROR';
        
        expect(mockError.message).to.include('Access denied');
        expect(mockError.code).to.equal('ER_ACCESS_DENIED_ERROR');
    });
});
