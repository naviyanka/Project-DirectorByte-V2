# Render MCP Server Setup

The Render Model Context Protocol (MCP) server allows AI assistants (like Cursor, Claude Desktop, or Antigravity) to interact with your Render resources directly.

## Prerequisites
- A Render account.
- A Render API Key (Generate one in **Account Settings** > **API Keys**).

## Setup Steps

### 1. Configure the MCP Server
You can connect to the Render MCP server using the following URL:
`https://mcp.render.com/mcp`

### 2. Add to your AI Tool
#### For Claude Desktop
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": ["-y", "@renderinc/mcp-server"],
      "env": {
        "RENDER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### For Cursor
1. Go to **Settings** > **Features** > **MCP**.
2. Add a new MCP server.
3. Name: `Render`
4. Type: `command`
5. Command: `npx -y @renderinc/mcp-server`
6. Add Environment Variable: `RENDER_API_KEY=your_api_key_here`

## Features
Once connected, the AI can:
- List your services.
- Check deploy status.
- Trigger new deploys.
- View logs.
- Manage environment variables.

For more details, visit the [official documentation](https://render.com/docs/mcp-server).
