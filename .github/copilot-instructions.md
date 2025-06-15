<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions - Node-RED MySQL Query Plugin

## Project Context
This is a Node-RED plugin for executing MySQL queries with WebSocket support. The plugin consists of three main files:

1. **mysql-query.js** - main backend logic
2. **mysql-query.html** - user interface and documentation 
3. **package.json** - NPM package configuration

## Places to describe functionality

### 1. In mysql-query.js file
**Lines 8-18**: Main comment describing node functionality
- Description of what the plugin does
- What configuration parameters it supports
- How it works with WebSocket

### 2. In mysql-query.html file
**Lines 1-10**: Comment describing user interface
**Lines 47-54**: oneditprepare function - validation and initialization
**Lines 59-64**: oneditsave function - saving configuration  
**Lines 69-74**: oneditcancel function - canceling editing
**Lines 77-82**: HTML template description
**Lines 104-108**: Help documentation section

### 3. In package.json file
**Line 3**: "description" field - brief functionality description
**Lines 6-12**: Keywords describing the plugin

## Coding conventions
- Use JSDoc comments for functions
- Comments in English
- Error handling with appropriate messages
- Node status shows current operation state

## Security
- Always use prepared statements
- Validate input data
- Don't log passwords in code
