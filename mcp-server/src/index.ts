import express from 'express';
import { Server } from 'http';

interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

interface MCPToolResponse {
  result: any;
  error?: string;
}

class MCPServer {
  private app: express.Application;
  private server: Server | null = null;
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    this.app = express();
    this.app.use(express.json());
    
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

  private registerDefaultTools() {
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

  public registerTool(tool: MCPTool) {
    console.log(`Registering tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  private async handleGetTools(req: express.Request, res: express.Response) {
    console.log('Handling GET /tools request');
    const toolsList = Array.from(this.tools.values());
    console.log('Returning tools:', toolsList);
    res.json({ tools: toolsList });
  }

  private async handleInvokeTool(req: express.Request, res: express.Response) {
    const { toolName } = req.params;
    const params = req.body;

    console.log(`Handling tool invocation: ${toolName}`, params);

    const tool = this.tools.get(toolName);
    if (!tool) {
      console.error(`Tool not found: ${toolName}`);
      return res.status(404).json({ error: `Tool '${toolName}' not found` });
    }

    try {
      let result: any;

      switch (toolName) {
        case 'echo':
          result = params.message;
          break;
        case 'add':
          result = params.a + params.b;
          break;
        case 'browser':
          result = await this.handleBrowserTool(params);
          break;
        default:
          throw new Error(`Tool '${toolName}' implementation not found`);
      }

      console.log(`Tool ${toolName} execution result:`, result);
      const response: MCPToolResponse = { result };
      res.json(response);
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      const response: MCPToolResponse = {
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  private async handleBrowserTool(params: any): Promise<any> {
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
  }

  public start(port: number = 3000) {
    this.server = this.app.listen(port, () => {
      console.log(`MCP Server listening on port ${port}`);
      console.log(`Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
    });
  }

  public stop() {
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