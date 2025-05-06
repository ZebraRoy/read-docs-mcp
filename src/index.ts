#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createSparseCheckout } from "./utils/sparse-checkout.js"
import { z } from "zod"
import fs from "fs"
import path from "path"
import { convertBaseOnPattern } from "./utils/naming-conversion.js"

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const parsedArgs: Record<string, string> = {}

  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=")
      if (key && value) {
        parsedArgs[key] = value
      }
    }
  })

  return parsedArgs
}

const args = parseArgs()

const repoPath = args["git-repo-path"]
const name = args.name
const branch = args["branch"] || "main"
const docsPath = args["docs-path"] || "docs"
const cloneLocation = args["clone-location"] || undefined

function readMainConfig(dir: string) {
  const configPath = path.join(dir, "read-docs-mcp.json")
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
  return config
}

function readModuleConfig(dir: string) {
  const configPath = path.join(dir, "read-module-docs-mcp.json")
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
  return config
}

async function createReadDocumentServer() {
  const cloneDir = await createSparseCheckout({
    name,
    repoPath,
    branch,
    docsPath,
    cloneLocation,
  })
  const docsDir = path.join(cloneDir, docsPath)
  const mainConfig = readMainConfig(docsDir)

  const {
    name: mcpName,
    description: mcpDescription,
    version: mcpVersion,
    fileName = "overview.md",
    moduleFolderNamingPattern = "kebab", // Default to "kebab" to match with overall folder naming pattern
  } = mainConfig

  let moduleList = mainConfig.moduleList

  const server = new McpServer({
    name: mcpName,
    description: mcpDescription,
    version: mcpVersion,
    capabilities: {
      resources: {},
      tools: {},
    },
  })

  server.tool("get-overview", `Get overview of the ${mcpName} project`, {
  }, async () => {
    const overviewFile = path.join(docsDir, fileName)
    const overview = fs.readFileSync(overviewFile, "utf8")
    return {
      content: [{ type: "text", text: overview }],
    }
  })

  if (!moduleList) {
    // find all the folders in the docs directory
    moduleList = fs.readdirSync(docsDir).filter(file => fs.statSync(path.join(docsDir, file)).isDirectory())
  }

  for (const module of moduleList) {
    // If moduleFolderNamingPattern is set to something other than "original",
    // convert the module name based on the specified pattern
    const moduleFolder = convertBaseOnPattern(module, moduleFolderNamingPattern as "kebab" | "camel" | "snake" | "pascal" | "original")

    const moduleDir = path.join(docsDir, moduleFolder)
    const moduleConfig = readModuleConfig(moduleDir)
    const getListConfig = moduleConfig["get-list"]
    const getDetailsConfig = moduleConfig["get-details"]
    const getOverviewConfig = moduleConfig["get-overview"]
    if (getListConfig) {
      server.tool(getListConfig.name, getListConfig.description, {
      }, async () => {
        const {
          fileName: listFileName = "list.md",
        } = getListConfig
        const listFile = path.join(moduleDir, listFileName)
        const list = fs.readFileSync(listFile, "utf8")
        return {
          content: [{ type: "text", text: list }],
        }
      })
    }
    if (getOverviewConfig) {
      server.tool(getOverviewConfig.name, getOverviewConfig.description, {
      }, async () => {
        const {
          fileName: overviewFileName = "overview.md",
        } = getOverviewConfig
        const overviewFile = path.join(moduleDir, overviewFileName)
        const overview = fs.readFileSync(overviewFile, "utf8")
        return {
          content: [{ type: "text", text: overview }],
        }
      })
    }
    if (getDetailsConfig) {
      server.tool(getDetailsConfig.name, getDetailsConfig.description, {
        name: z.string().describe(getDetailsConfig.paramDescription),
      }, async ({ name }) => {
        const {
          namingPattern = "kebab",
        } = getDetailsConfig
        const detailsFile = path.join(moduleDir, `${convertBaseOnPattern(name, namingPattern)}.md`)
        const details = fs.readFileSync(detailsFile, "utf8")
        return {
          content: [{ type: "text", text: details }],
        }
      })
    }
  }
  return server
}

function createInstructionsServer() {
  const server = new McpServer({
    name: "CreateReadDocs",
    description: "Provide tools to help agents create documents for ReadDocs MCP.",
    version: "0.1.0",
    capabilities: {},
  })

  server.tool("get-create-docs-instructions", "Get instructions to create a new document", {
  }, async () => {
    return {
      content: [{ type: "text", text: `
  Create a folder to store the docs for this package.
  The folder should be named as 'docs', but you can change it to a more suitable name.
  Within the folder, create a file named 'overview.md'.
  This file will contain a high-level overview of the package.
  It should has a json named 'read-docs-mcp.json' to describe the docs structure.
  The json should have the following fields:
  - name: string = name of the package
  - description: string = description of the package
  - version: string = version of the package
  - moduleList: string[] = list of modules in the package
  - fileName?: string = name of the file to store the overview, default is 'overview.md'
  - moduleFolderNamingPattern?: string = naming pattern for module folders, can be "kebab", "camel", "snake", "pascal", or "original", default is "kebab"
  
  ## Naming Pattern Rules
  
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

  By default, the module folder will be converted to kebab-case.
  
  For each module listed in moduleList, create a folder with that name.
  Inside each module folder:
  
  1. Create a 'read-module-docs-mcp.json' file with configuration for that module:
  
  {
    "get-list": {
      "name": "get-[module]-list",
      "description": "Get a list of [items] in the module",
      "fileName": "list.md"
    },
    "get-details": {
      "name": "get-[module]-details",
      "description": "Get details of a [item]",
      "paramDescription": "An [item] name",
      "namingPattern": "kebab"
    },
    "get-overview": {
      "name": "get-[module]-overview",
      "description": "Get an overview of the [module]",
      "fileName": "overview.md"
    }
  }
  
  Replace [module] and [item] with your actual module name and item type.
     
  2. Create these documentation files:
     - list.md: A list of all items in the module
     - overview.md: An overview of the module's purpose and usage
     - Individual detail files for each item (e.g., button.md, use-state.md)
       named according to the namingPattern (default is kebab-case)
  
  ## Examples of Documentation File Formats

  ### Example of overview.md
  
  \`\`\`markdown
  # Hooks Overview
  
  Hooks are functions that let you "hook into" different aspects of the library's 
  functionality. They provide a way to reuse stateful logic across components.
  
  ## When to Use Hooks
  
  Use hooks when you need to:
  - Manage component state
  - Perform side effects
  - Share logic between components
  
  ## Best Practices
  
  - Only call hooks at the top level
  - Only call hooks from functional components
  - Create custom hooks for reusable logic
  
  ## Available Hooks
  
  For a complete list of available hooks, see the [Hooks List](./list.md).
  \`\`\`
  
  ### Example of list.md
  
  \`\`\`markdown
  # Hooks List
  
  This page provides a comprehensive list of all hooks available in our library.
  
  ## Core Hooks
  
  - [useState](./use-state.md) - State management for components
  - [useEffect](./use-effect.md) - Side effect management 
  - [useMemo](./use-memo.md) - Memoized values
  
  ## Routing Hooks
  
  - [useRouter](./use-router.md) - Access the router instance
  - [useParams](./use-params.md) - Access route parameters
  
  ## Form Hooks
  
  - [useForm](./use-form.md) - Form state management
  - [useField](./use-field.md) - Individual field management
  
  ## Data Fetching Hooks
  
  - [useQuery](./use-query.md) - Data fetching with automatic caching
  - [useMutation](./use-mutation.md) - Server state updates
  \`\`\`
  
  ### Example of a hook detail file (use-state.md)
  
  \`\`\`markdown
  # useState
  
  A hook that lets you add state to functional components.
  
  ## Signature
  
  \`\`\`typescript
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void]
  \`\`\`
  
  ## Parameters
  
  - \`initialState\`: The initial state value or a function that returns the initial state
  
  ## Returns
  
  An array with two elements:
  1. The current state value
  2. A function to update the state
  
  ## Examples
  
  ### Basic Example
  
  \`\`\`jsx
  import { useState } from 'our-library';
  
  function Counter() {
    const [count, setCount] = useState(0);
    
    return (
      <div>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </div>
    );
  }
  \`\`\`
  
  ### Functional Updates
  
  \`\`\`jsx
  function Counter() {
    const [count, setCount] = useState(0);
    
    function increment() {
      setCount(prevCount => prevCount + 1);
    }
    
    return (
      <div>
        <p>Count: {count}</p>
        <button onClick={increment}>Increment</button>
      </div>
    );
  }
  \`\`\`
  
  ### Lazy Initial State
  
  \`\`\`jsx
  function TodoList() {
    // This function is only executed once when the component mounts
    const [todos, setTodos] = useState(() => {
      const savedTodos = localStorage.getItem('todos');
      return savedTodos ? JSON.parse(savedTodos) : [];
    });
    
    // Rest of component...
  }
  \`\`\`
  
  ## Best Practices
  
  - Use multiple \`useState\` calls for different state variables
  - Use functional updates when new state depends on old state
  - For complex state logic, consider using \`useReducer\` instead
  
  ## Related Hooks
  
  - [useReducer](./use-reducer.md) - An alternative to useState for complex state logic
  - [useEffect](./use-effect.md) - Used for side effects that might depend on state
  \`\`\`
  
  ### Example of a component detail file (button.md)
  
  \`\`\`markdown
  # Button
  
  A customizable button component with different variants and sizes.
  
  ## Import
  
  \`\`\`jsx
  import { Button } from 'our-component-library';
  \`\`\`
  
  ## Props
  
  <table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>variant</td>
    <td>'primary' | 'secondary' | 'outline' | 'text'</td>
    <td>'primary'</td>
    <td>The visual style of the button</td>
  </tr>
  <tr>
    <td>size</td>
    <td>'small' | 'medium' | 'large'</td>
    <td>'medium'</td>
    <td>The size of the button</td>
  </tr>
  <tr>
    <td>disabled</td>
    <td>boolean</td>
    <td>false</td>
    <td>Whether the button is disabled</td>
  </tr>
  <tr>
    <td>onClick</td>
    <td>(event: MouseEvent) => void</td>
    <td>-</td>
    <td>Function called when button is clicked</td>
  </tr>
  <tr>
    <td>children</td>
    <td>ReactNode</td>
    <td>-</td>
    <td>The content of the button</td>
  </tr>
  </table>
  
  ## Examples
  
  ### Basic Usage
  
  \`\`\`jsx
  <Button onClick={() => console.log('Clicked!')}>
    Click Me
  </Button>
  \`\`\`
  
  ### Button Variants
  
  \`\`\`jsx
  <div>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="text">Text</Button>
  </div>
  \`\`\`
  
  ### Button Sizes
  
  \`\`\`jsx
  <div>
    <Button size="small">Small</Button>
    <Button size="medium">Medium</Button>
    <Button size="large">Large</Button>
  </div>
  \`\`\`
  
  ### Disabled Button
  
  \`\`\`jsx
  <Button disabled>Disabled</Button>
  \`\`\`
  
  ## Accessibility
  
  - Buttons include proper ARIA attributes
  - Focus states are visually indicated
  - Color contrast meets WCAG 2.1 AA standards
  
  ## Design Guidelines
  
  - Use primary buttons for main actions
  - Use secondary buttons for supporting actions
  - Limit the number of primary buttons on a page
  
  ## Related Components
  
  - [IconButton](./icon-button.md) - Button with only an icon
  - [ButtonGroup](./button-group.md) - Group of related buttons
  \`\`\`
  
  The MCP server will automatically generate tools based on this structure.
` }],
    }
  })
  return server
}

function createServer() {
  if (name && repoPath) {
    return createReadDocumentServer()
  }
  else {
    // else, it means we are running a mcp server that only provides construction instructions
    return createInstructionsServer()
  }
}

// if cloneDir is provided, it means we are running a mcp document server

async function main() {
  const transport = new StdioServerTransport()
  const server = await createServer()
  await server?.connect(transport)
}

main()
  .catch((error) => {
    console.error("Fatal error in main():", error)
    process.exit(1)
  })
