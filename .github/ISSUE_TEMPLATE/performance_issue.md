---
name: Performance Issue
about: Report performance problems or optimization opportunities
title: '[PERFORMANCE] '
labels: ['performance', 'needs-investigation']
assignees: ''

---

## 🚀 Performance Issue Description

A clear and concise description of the performance problem.

## 📊 Current Performance

**What you're experiencing:**
- Response time: [e.g. 500ms instead of <50ms]
- Throughput: [e.g. 1000 msg/sec instead of expected 10000 msg/sec]
- Memory usage: [e.g. 500MB instead of expected 100MB]
- CPU usage: [e.g. 80% instead of expected 20%]

## 🎯 Expected Performance

**What you expected:**
- Response time: [e.g. <50ms]
- Throughput: [e.g. 10000+ msg/sec]
- Memory usage: [e.g. <100MB]
- CPU usage: [e.g. <30%]

## 🔧 Test Scenario

**Describe your test setup:**

```javascript
// Test configuration
const testConfig = {
  connections: 100,
  messagesPerSecond: 1000,
  queryType: "SELECT * FROM users WHERE id = ?",
  duration: "5 minutes"
};
```

**Load characteristics:**
- Number of concurrent connections: 
- Message rate: 
- Query complexity: 
- Data volume: 

## 🖥️ Environment

**System Specifications:**
- CPU: [e.g. Intel i7-10700K, 8 cores]
- RAM: [e.g. 32GB DDR4]
- Storage: [e.g. NVMe SSD]
- Network: [e.g. Gigabit Ethernet]

**Software Environment:**
- Node.js version: 
- Node-RED version: 
- Plugin version: 
- Operating System: 
- MySQL/MariaDB version: 

## 📈 Performance Data

**Measurements:**

| Metric | Current | Expected | Difference |
|--------|---------|----------|------------|
| Response Time | | | |
| Throughput | | | |
| Memory Usage | | | |
| CPU Usage | | | |

**Performance logs or profiling data:**
```
// Paste performance metrics, profiling data, or monitoring output
```

## 🔍 Analysis

**Potential bottlenecks identified:**
- [ ] Database queries
- [ ] WebSocket message handling
- [ ] Memory allocations
- [ ] Network I/O
- [ ] CPU-intensive operations
- [ ] Other: ___________

## 🛠️ Attempted Solutions

**What you've tried:**
- [ ] Increased connection pool size
- [ ] Optimized queries
- [ ] Adjusted Node.js settings
- [ ] Modified system configuration
- [ ] Other: ___________

## 📝 Additional Context

**Configuration that might impact performance:**

```json
{
  "mysql": {
    "connectionLimit": 10,
    "acquireTimeout": 60000,
    "timeout": 60000
  },
  "websocket": {
    "port": 8080,
    "heartbeatInterval": 30000
  }
}
```

**Any other context about the performance issue:**

## ✅ Checklist

- [ ] I have measured actual performance metrics
- [ ] I have compared with expected/documented performance
- [ ] I have provided system specifications
- [ ] I have described my test scenario clearly
- [ ] I have tried basic optimization steps
