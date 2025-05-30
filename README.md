# read-docs-mcp

A Model Context Protocol (MCP) server that enables AI agents to access and understand package documentation through a structured interface.

## Features

- Automatically generates MCP tools from documentation structure
- Supports multiple documentation modules (hooks, components, utilities, etc.)
- Configurable naming patterns for documentation files and module folders
- Provides listing, overview, and detailed documentation access
- Dynamic tool generation based on configured modules
- Fallback to package.json for version information
- Customizable documentation path

## Dual Usage Modes

This MCP server has two distinct usage modes:

1. **Read Documentation Mode** (`read-docs-{name}`): When both `name` and `git-repo-path` are provided, the server functions as a document reader for the specified repository, generating tools to access the documentation.

2. **Create Documentation Mode** (`create-read-docs`): When no repository information is provided, the server functions as a guide for creating documentation structure, providing instructions on how to set up documentation files.

## Configuration

The MCP supports the following command-line arguments:

- `--name`: Name of the package/library (required for Read Documentation Mode)
- `--git-repo-path`: Path to the git repository (http or ssh) (required for Read Documentation Mode)
  - If not provided, the MCP server will only provide construction instructions
- `--branch`: Branch to read the docs from
  - Default: `main`
- `--docs-path`: Path to the docs folder
  - Default: `docs`
- `--clone-location`: Path to clone the git repository
  - Default: {os home directory}/.temp-repo

### Important Note on Git Authentication

This MCP requires direct cloning of the target git repository. You must ensure you have proper access to the repository before using this tool. For private repositories, make sure:

1. Your local machine has the necessary SSH keys configured for SSH URLs
2. For HTTPS URLs, you've either:
   - Used a personal access token in the URL
   - Configured Git credential storage on your machine

Without proper authentication, the MCP will fail to clone private repositories.

## Setting up in Cursor

To use this MCP in Cursor, add the following configuration to your Cursor settings:

### Read Documentation Mode (Mac/Linux)

```json
{
  "mcpServers": {
    "read-docs-{name}": {
      "command": "npx",
      "args": [
        "-y",
        "read-docs-mcp",
        "--git-repo-path=https://github.com/user/repo",
        "--name=YourLibName"
      ]
    }
  }
}
```

### Create Documentation Mode (Mac/Linux)

```json
{
  "mcpServers": {
    "create-read-docs": {
      "command": "npx",
      "args": ["-y", "read-docs-mcp"]
    }
  }
}
```

### Read Documentation Mode (Windows)

```json
{
  "mcpServers": {
    "read-docs-{name}": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "read-docs-mcp",
        "--git-repo-path=https://github.com/user/repo",
        "--name=YourLibName"
      ]
    }
  }
}
```

### Create Documentation Mode (Windows)

```json
{
  "mcpServers": {
    "create-read-docs": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "read-docs-mcp"]
    }
  }
}
```

### Custom Documentation Path

If you want to specify a custom documentation directory:

```json
{
  "mcpServers": {
    "read-docs-{name}": {
      "command": "npx",
      "args": [
        "-y",
        "read-docs-mcp",
        "--git-repo-path=https://github.com/user/repo",
        "--name=YourLibName",
        "--docs-path=documentation"
      ]
    }
  }
}
```

## Documentation Structure

The MCP server expects the following structure for Read Documentation Mode:

```
repository/
├── docs/ (configurable)
│   ├── read-docs-mcp.json
│   ├── hooks/
│   │   ├── read-module-docs-mcp.json
│   │   ├── list.md
│   │   ├── overview.md
│   │   ├── use-state.md
│   │   └── ...
│   ├── components/
│   │   ├── read-module-docs-mcp.json
│   │   └── ...
│   └── ...
└── package.json
```

### Main Configuration: read-docs-mcp.json

```json
{
  "name": "SomeLibrary",
  "description": "A library for some purpose",
  "version": "1.0.1",
  "moduleList": ["hooks", "components", "directives", "utils"],
  "fileName": "overview.md",
  "moduleFolderNamingPattern": "kebab"
}
```

- `name`, `description`: Used in MCP server construction
- `version`: If not provided, falls back to version in package.json, or defaults to "0.1.0"
- `moduleList`: List of documentation modules; if not provided, all folders in the docs directory are used
- `fileName`: The file to use for the overview. If not provided, defaults to "overview.md"
- `moduleFolderNamingPattern`: Naming pattern for module folders. Can be "kebab", "camel", "snake", "pascal", or "original". Default is "kebab"

### Naming Pattern Rules

The following naming patterns are supported for module folders and detail files:

- **kebab-case** (default): Words are lowercase and separated by hyphens

  - Example: "form-control", "use-state", "data-table"

- **camelCase**: First word is lowercase, subsequent words are capitalized with no separators

  - Example: "formControl", "useState", "dataTable"

- **snake_case**: Words are lowercase and separated by underscores

  - Example: "form_control", "use_state", "data_table"

- **PascalCase**: Each word is capitalized with no separators

  - Example: "FormControl", "UseState", "DataTable"

- **original**: Uses the name exactly as provided in the moduleList, with no conversion
  - Example: Names in moduleList will be used as-is for directory names

### Module Configuration: read-module-docs-mcp.json

```json
{
  "get-all": {
    "name": "get-hook-list",
    "description": "Get a list of hooks",
    "fileName": "list.md"
  },
  "get-details": {
    "name": "get-hook-details",
    "description": "Get details of a hook",
    "paramDescription": "A hook name",
    "namingPattern": "kebab"
  },
  "get-overview": {
    "name": "get-hook-overview",
    "description": "Get an overview of the hook module",
    "fileName": "overview.md"
  }
}
```

## Working with Agents

### Using Read Documentation Mode

When you have set up the MCP server with a repository, you can use it to explore documentation:

```
Using the read-docs-{YourLibName} MCP, I'd like to explore the documentation for {YourLibName}. Can you:

1. Get an overview of the available modules
2. Show me the list of hooks available
3. Provide details on a specific hook
4. Give me an overview of the components module
```

### Using Create Documentation Mode

When you use the MCP server without a repository, you can ask for help creating documentation:

```
Using the create-read-docs MCP, I need to create documentation for my library that can be used with read-docs-mcp.
Can you help me set up the required structure and files?
```

### Example Prompts for Read Documentation Mode

#### Exploring Package Documentation

```
Using the read-docs-{PackageName} MCP, I'd like to explore the documentation for [Package Name]. Can you:

1. Get an overview of the available modules
2. Show me the list of hooks available
3. Provide details on the useAuth hook
4. Give me an overview of the components module

I'm particularly interested in understanding how authentication works in this library.
```

#### Learning How to Use a Component

```
Using the read-docs-{PackageName} MCP, I need to implement a form with validation using the [Package Name] library. Please:

1. Show me the available components
2. Get details on the Form component
3. Get details on the Input component
4. Explain how to use form validation with these components

If there are any code examples in the documentation, please highlight those.
```

### Example Prompts for Create Documentation Mode

```
Using the create-read-docs MCP, I need to set up documentation for my React component library. Can you help me create the folder structure and necessary configuration files?
```

```
Using the create-read-docs MCP, I've started creating documentation for my utility functions. How should I structure the detailed documentation for individual utility functions?
```

## Tools

### Read Documentation Mode Tools

The MCP dynamically generates tools based on the documentation structure. For each module in the `moduleList`, up to three tools can be generated:

#### get-[module]-list

Get a list of all items in the module.

Parameters:

- None

Returns:

- Content of the list file (default: `list.md`)

#### get-[module]-details

Get details about a specific item in the module.

Parameters:

- `name` (string): Name of the item to get details for

Returns:

- Content of the details file, named according to the `namingPattern` (default is kebab-case)

#### get-[module]-overview

Get an overview of the module.

Parameters:

- None

Returns:

- Content of the overview file (default: `overview.md`)

### Create Documentation Mode Tools

The MCP provides a single tool to help with creating documentation:

#### get-create-docs-instructions

Get detailed instructions for creating documentation structure.

Parameters:

- None

Returns:

- Detailed instructions on setting up documentation files and structure

## Creating Documentation for Read Documentation Mode

You can either manually create the documentation structure or use the Create Documentation Mode to get guidance. Follow these steps to create documentation that can be accessed by the Read Documentation Mode:

### Step 1: Create the main configuration file

Create a `read-docs-mcp.json` file in your documentation directory:

```json
{
  "name": "YourLibrary",
  "description": "Description of your library",
  "version": "1.0.0",
  "moduleList": ["hooks", "components", "utils"],
  "moduleFolderNamingPattern": "kebab"
}
```

The `moduleFolderNamingPattern` determines how your module folder names will be converted. For example, if your moduleList contains `["FormControl", "useHooks"]` and you choose "kebab" pattern, the folders will be created as `form-control/` and `use-hooks/`.

### Step 2: Create module directories and configurations

For each module, create a directory and a `read-module-docs-mcp.json` file:

```json
{
  "get-all": {
    "name": "get-component-list",
    "description": "Get a list of components",
    "fileName": "list.md"
  },
  "get-details": {
    "name": "get-component-details",
    "description": "Get details of a component",
    "paramDescription": "A component name",
    "namingPattern": "kebab"
  },
  "get-overview": {
    "name": "get-component-overview",
    "description": "Get an overview of components",
    "fileName": "overview.md"
  }
}
```

### Step 3: Create documentation files

Create the necessary markdown files:

- `list.md` - List of all items in the module
- `overview.md` - Overview of the module
- Individual detail files (e.g., `button.md`, `input.md`, etc.)

## License

MIT
