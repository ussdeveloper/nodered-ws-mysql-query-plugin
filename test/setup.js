/**
 * Test setup and global configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Suppress console output during tests (optional)
if (process.env.SILENT_TESTS) {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
}

// Global test timeout
const originalTimeout = setTimeout;
global.setTimeout = (fn, delay) => {
    return originalTimeout(fn, Math.min(delay, 10000)); // Max 10s timeout
};

// Mock Node-RED environment for unit tests
global.RED = {
    nodes: {
        createNode: function(node, config) {
            node.status = function() {};
            node.error = function() {};
            node.log = function() {};
            node.warn = function() {};
            node.on = function() {};
            return node;
        },
        registerType: function(name, constructor) {
            // Store for testing
            global.registeredNodes = global.registeredNodes || {};
            global.registeredNodes[name] = constructor;
        }
    }
};

// Test database configuration (for integration tests)
if (process.env.NODE_ENV === 'test' && !process.env.CI) {
    console.log('\n🧪 Test Environment Setup');
    console.log('================================');
    console.log('For integration tests, set these environment variables:');
    console.log('TEST_MYSQL_HOST=localhost');
    console.log('TEST_MYSQL_PORT=3306');
    console.log('TEST_MYSQL_USER=root');
    console.log('TEST_MYSQL_PASSWORD=your_password');
    console.log('TEST_MYSQL_DATABASE=test');
    console.log('================================\n');
}
