"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
class MCPServer {
    constructor() {
        this.server = null;
        this.tools = new Map();
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        // Add request logging middleware
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            console.log('Headers:', req.headers);
            if (req.body && Object.keys(req.body).length > 0) {
                console.log('Body:', req.body);
            }
            next();
        });
        // Register routes
        this.app.get('/tools', this.handleGetTools.bind(this));
        this.app.post('/invoke/:toolName', this.handleInvokeTool.bind(this));
        // Register default tools
        this.registerDefaultTools();
        // Log registered tools
        console.log('Registered tools:', Array.from(this.tools.keys()));
    }
    registerDefaultTools() {
        // Example tool: Echo
        this.registerTool({
            name: 'echo',
            description: 'Echoes back the input message',
            parameters: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Message to echo back'
                    }
                },
                required: ['message']
            }
        });
        // Example tool: Add numbers
        this.registerTool({
            name: 'add',
            description: 'Adds two numbers together',
            parameters: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'First number'
                    },
                    b: {
                        type: 'number',
                        description: 'Second number'
                    }
                },
                required: ['a', 'b']
            }
        });
        // Browser tool
        this.registerTool({
            name: 'browser',
            description: 'Controls a browser instance',
            parameters: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Browser action to perform (navigate, screenshot, extract)',
                        enum: ['navigate', 'screenshot', 'extract']
                    },
                    url: {
                        type: 'string',
                        description: 'URL to navigate to or interact with'
                    },
                    selector: {
                        type: 'string',
                        description: 'CSS selector for element interaction (optional)'
                    }
                },
                required: ['action']
            }
        });
    }
    registerTool(tool) {
        console.log(`Registering tool: ${tool.name}`);
        this.tools.set(tool.name, tool);
    }
    handleGetTools(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling GET /tools request');
            const toolsList = Array.from(this.tools.values());
            console.log('Returning tools:', toolsList);
            res.json({ tools: toolsList });
        });
    }
    handleInvokeTool(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { toolName } = req.params;
            const params = req.body;
            console.log(`Handling tool invocation: ${toolName}`, params);
            const tool = this.tools.get(toolName);
            if (!tool) {
                console.error(`Tool not found: ${toolName}`);
                return res.status(404).json({ error: `Tool '${toolName}' not found` });
            }
            try {
                let result;
                switch (toolName) {
                    case 'echo':
                        result = params.message;
                        break;
                    case 'add':
                        result = params.a + params.b;
                        break;
                    case 'browser':
                        result = yield this.handleBrowserTool(params);
                        break;
                    default:
                        throw new Error(`Tool '${toolName}' implementation not found`);
                }
                console.log(`Tool ${toolName} execution result:`, result);
                const response = { result };
                res.json(response);
            }
            catch (error) {
                console.error(`Error executing tool ${toolName}:`, error);
                const response = {
                    result: null,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
                res.status(500).json(response);
            }
        });
    }
    handleBrowserTool(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { action, url, selector } = params;
            console.log(`Handling browser action: ${action}`, { url, selector });
            switch (action) {
                case 'navigate':
                    return { status: 'success', message: `Navigated to ${url}` };
                case 'screenshot':
                    return { status: 'success', message: `Screenshot taken of ${url}` };
                case 'extract':
                    return { status: 'success', message: `Content extracted from ${url}` };
                default:
                    throw new Error(`Unknown browser action: ${action}`);
            }
        });
    }
    start(port = 3000) {
        this.server = this.app.listen(port, () => {
            console.log(`MCP Server listening on port ${port}`);
            console.log(`Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
        });
    }
    stop() {
        if (this.server) {
            console.log('Stopping MCP server');
            this.server.close();
            this.server = null;
        }
    }
}
// Create and start the server
const server = new MCPServer();
server.start(3000);
