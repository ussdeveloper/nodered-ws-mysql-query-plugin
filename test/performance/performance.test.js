const { expect } = require('chai');
const { performance } = require('perf_hooks');

// Import client library
const NodeRedWSConnection = require('../../client/nodered-ws-client.js');

describe('Performance Tests', function() {
    this.timeout(30000);
    
    describe('Client Connection Performance', function() {
        it('should connect within acceptable time', function(done) {
            const startTime = performance.now();
            
            // Mock fast WebSocket
            global.WebSocket = class FastWebSocket {
                constructor() {
                    this.readyState = 1;
                    setTimeout(() => {
                        if (this.onopen) this.onopen();
                    }, 5);
                }
                send() {}
                close() {
                    if (this.onclose) this.onclose({ code: 1000 });
                }
            };
            
            const client = new NodeRedWSConnection('ws://localhost:8080/test');
            
            client.onConnect = () => {
                const connectionTime = performance.now() - startTime;
                expect(connectionTime).to.be.below(100); // Should connect within 100ms
                client.disconnect();
                done();
            };
        });
        
        it('should handle multiple concurrent connections', function(done) {
            const connectionCount = 10;
            let completedConnections = 0;
            const startTime = performance.now();
            
            // Mock WebSocket for concurrent testing
            global.WebSocket = class ConcurrentWebSocket {
                constructor() {
                    this.readyState = 1;
                    setTimeout(() => {
                        if (this.onopen) this.onopen();
                    }, Math.random() * 20);
                }
                send() {}
                close() {
                    if (this.onclose) this.onclose({ code: 1000 });
                }
            };
            
            for (let i = 0; i < connectionCount; i++) {
                const client = new NodeRedWSConnection(`ws://localhost:8080/test${i}`);
                
                client.onConnect = () => {
                    completedConnections++;
                    client.disconnect();
                    
                    if (completedConnections === connectionCount) {
                        const totalTime = performance.now() - startTime;
                        expect(totalTime).to.be.below(1000); // All connections within 1s
                        done();
                    }
                };
            }
        });
    });
    
    describe('Message Processing Performance', function() {
        let client;
        
        beforeEach(function(done) {
            // Mock WebSocket with message handling
            global.WebSocket = class MessageWebSocket {
                constructor() {
                    this.readyState = 1;
                    this.messageQueue = [];
                    setTimeout(() => {
                        if (this.onopen) this.onopen();
                    }, 5);
                }
                
                send(data) {
                    // Process message immediately for testing
                    if (this.onmessage) {
                        const message = JSON.parse(data);
                        if (message.type === 'query') {
                            setTimeout(() => {
                                this.onmessage({
                                    data: JSON.stringify({
                                        type: 'query_response',
                                        queryId: message.queryId,
                                        success: true,
                                        data: [{ id: 1 }],
                                        rowCount: 1
                                    })
                                });
                            }, 1);
                        }
                    }
                }
                
                close() {
                    if (this.onclose) this.onclose({ code: 1000 });
                }
            };
            
            client = new NodeRedWSConnection('ws://localhost:8080/perf-test');
            client.onConnect = () => {
                client.authenticated = true;
                done();
            };
        });
        
        afterEach(function() {
            if (client) {
                client.disconnect();
            }
        });
          it('should process queries quickly', async function() {
            // Ensure client is ready for queries
            if (!client.authenticated) {
                client.authenticated = true;
            }
            if (client.status !== 'connected') {
                client.status = 'connected';
            }
            
            const queryCount = 100;
            const startTime = performance.now();
            
            const promises = [];
            for (let i = 0; i < queryCount; i++) {
                promises.push(client.Query(`SELECT ${i} as id`));
            }
            
            try {
                await Promise.all(promises);
                
                const totalTime = performance.now() - startTime;
                const avgTime = totalTime / queryCount;
                
                expect(avgTime).to.be.below(10); // Average less than 10ms per query
                console.log(`\n    📊 Processed ${queryCount} queries in ${totalTime.toFixed(2)}ms`);
                console.log(`    📊 Average time per query: ${avgTime.toFixed(2)}ms`);
            } catch (error) {
                throw new Error(`Failed to process queries: ${error.message}`);
            }
        });
          it('should handle large result sets efficiently', async function() {
            // Ensure client is ready for queries
            if (!client.authenticated) {
                client.authenticated = true;
            }
            if (client.status !== 'connected') {
                client.status = 'connected';
            }
            
            // Mock large dataset response
            const originalSend = client.ws.send;
            client.ws.send = function(data) {
                const message = JSON.parse(data);
                if (message.type === 'query') {
                    const largeData = Array(1000).fill(null).map((_, i) => ({ 
                        id: i, 
                        name: `User ${i}`,
                        email: `user${i}@example.com` 
                    }));
                    
                    setTimeout(() => {
                        this.onmessage({
                            data: JSON.stringify({
                                type: 'query_response',
                                queryId: message.queryId,
                                success: true,
                                data: largeData,
                                rowCount: largeData.length
                            })
                        });
                    }, 10);
                }
            };
            
            const startTime = performance.now();
            const result = await client.Query('SELECT * FROM large_table');
            const processingTime = performance.now() - startTime;
            
            expect(result.rowCount).to.equal(1000);
            expect(processingTime).to.be.below(100); // Process 1000 rows in under 100ms
            
            console.log(`\n    📊 Processed ${result.rowCount} rows in ${processingTime.toFixed(2)}ms`);
        });
    });
    
    describe('Memory Usage', function() {
        it('should not leak memory during multiple connections', function(done) {
            this.timeout(10000);
            
            const initialMemory = process.memoryUsage().heapUsed;
            let connectionsMade = 0;
            const targetConnections = 50;
            
            // Mock WebSocket
            global.WebSocket = class MemoryTestWebSocket {
                constructor() {
                    this.readyState = 1;
                    setTimeout(() => {
                        if (this.onopen) this.onopen();
                    }, 1);
                }
                send() {}
                close() {
                    if (this.onclose) this.onclose({ code: 1000 });
                }
            };
            
            function createAndDestroyConnection() {
                if (connectionsMade >= targetConnections) {
                    // Force garbage collection if available
                    if (global.gc) {
                        global.gc();
                    }
                    
                    setTimeout(() => {
                        const finalMemory = process.memoryUsage().heapUsed;
                        const memoryIncrease = finalMemory - initialMemory;
                        const memoryIncreaseKB = memoryIncrease / 1024;
                        
                        console.log(`\n    📊 Memory increase after ${targetConnections} connections: ${memoryIncreaseKB.toFixed(2)} KB`);
                        
                        // Should not increase memory by more than 1MB
                        expect(memoryIncrease).to.be.below(1024 * 1024);
                        done();
                    }, 100);
                    return;
                }
                
                const client = new NodeRedWSConnection(`ws://localhost:8080/memory-test-${connectionsMade}`);
                
                client.onConnect = () => {
                    connectionsMade++;
                    client.disconnect();
                    
                    // Create next connection after a short delay
                    setTimeout(createAndDestroyConnection, 1);
                };
            }
            
            createAndDestroyConnection();
        });
    });
    
    describe('Stress Testing', function() {        it('should handle rapid message bursts', function(done) {
            this.timeout(15000);
            
            const messageCount = 1000;
            let messagesProcessed = 0;
            let responsesReceived = 0;
            
            // Mock high-throughput WebSocket
            global.WebSocket = class BurstWebSocket {
                constructor() {
                    this.readyState = 1;
                    setTimeout(() => {
                        if (this.onopen) this.onopen();
                    }, 5);
                }
                
                send(data) {
                    const message = JSON.parse(data);
                    
                    // Simulate rapid responses
                    if (message.type === 'query') {
                        setImmediate(() => {
                            if (this.onmessage) {
                                responsesReceived++;
                                this.onmessage({
                                    data: JSON.stringify({
                                        type: 'query_response',
                                        queryId: message.queryId,
                                        success: true,
                                        data: [{ result: 'ok' }],
                                        rowCount: 1
                                    })
                                });
                            }
                        });
                    }
                }
                
                close() {
                    if (this.onclose) this.onclose({ code: 1000 });
                }
            };
            
            const client = new NodeRedWSConnection('ws://localhost:8080/stress-test');
            
            client.onConnect = async () => {
                client.authenticated = true;
                const startTime = performance.now();
                
                // Send burst of queries
                const promises = [];
                for (let i = 0; i < messageCount; i++) {
                    promises.push(
                        client.Query(`SELECT ${i} as test_id`)
                            .then(() => {
                                messagesProcessed++;
                            })
                            .catch((error) => {
                                console.error(`Query ${i} failed:`, error);
                            })
                    );
                }
                
                try {
                    await Promise.all(promises);
                    const totalTime = performance.now() - startTime;
                    
                    expect(messagesProcessed).to.equal(messageCount);
                    console.log(`\n    📊 Processed ${messageCount} messages in ${totalTime.toFixed(2)}ms`);
                    console.log(`    📊 Responses received: ${responsesReceived}`);
                    console.log(`    📊 Throughput: ${(messageCount / totalTime * 1000).toFixed(0)} messages/second`);
                    
                    client.disconnect();
                    done();
                } catch (error) {
                    done(error);
                }
            };
        });
    });
});
