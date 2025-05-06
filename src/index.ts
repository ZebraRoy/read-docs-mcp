#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
// import { z } from "zod"
// import fs from "fs"
// import path from "path"

// Parse command-line arguments
// function parseArgs() {
//   const args = process.argv.slice(2)
//   const parsedArgs: Record<string, string> = {}

//   args.forEach((arg) => {
//     if (arg.startsWith("--")) {
//       const [key, value] = arg.substring(2).split("=")
//       if (key && value) {
//         parsedArgs[key] = value
//       }
//     }
//   })

//   return parsedArgs
// }

// const args = parseArgs()

// args should have:
// gitRepoPath: string = path to the git repo, can be http or ssh. It must be provided, otherwise the program will exit with an error.
// branch: string = branch to read the docs from, default is main
// docsPath: string = path to the docs folder, default is docs
// authToken: string = token to use for the git repo, default is empty

// const repoPath = args.gitRepoPath
// const branch = args.branch || "main"
// const docsPath = args.docsPath || "docs"
// const authToken = args.authToken || ""

// TODO: it should use the json from the repo to get the name, description, version, and capabilities
const server = new McpServer({
  name: "ReadDocs",
  description: "Provide tools to help agents read docs.",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.log("ReadDocs MCP server is running on stdio")
}

main()
  .catch((error) => {
    console.error("Fatal error in main():", error)
    process.exit(1)
  })
