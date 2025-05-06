import { simpleGit } from "simple-git"
import os from "os"
import path from "path"
import fs from "fs"

// clone it into user's home directory with project name subfolder
const getCloneDir = (name: string, cloneLocation?: string) => {
  if (cloneLocation) {
    return path.join(cloneLocation, name)
  }
  return path.join(os.homedir(), ".temp-repo", name)
}

export async function createSparseCheckout({
  name,
  repoPath,
  branch = "main",
  docsPath = "docs",
  cloneLocation,
}: {
  name: string
  repoPath: string
  branch?: string
  docsPath?: string
  cloneLocation?: string
}) {
  // Use project-specific clone location if not explicitly provided
  const projectCloneLocation = getCloneDir(name, cloneLocation)

  // Ensure clone directory exists
  if (!fs.existsSync(projectCloneLocation)) {
    fs.mkdirSync(projectCloneLocation, { recursive: true })
  }

  // Initialize git
  const git = simpleGit(projectCloneLocation)

  // Check if repo is already cloned
  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    // Initialize empty repo
    await git.init()
    // Add remote
    await git.addRemote("origin", repoPath)
    // Enable sparse checkout
    await git.raw("config", "core.sparseCheckout", "true")

    // Write the sparse checkout patterns to the git config file
    const sparseCheckoutPath = path.join(projectCloneLocation, ".git", "info", "sparse-checkout")
    fs.writeFileSync(sparseCheckoutPath, docsPath)

    // Fetch the branch
    await git.fetch("origin", branch)
    // Checkout the branch
    await git.checkout(branch)
  }
  else {
    // If repo exists, update it
    await git.fetch("origin", branch)
    await git.checkout(branch)
    await git.pull("origin", branch)
  }

  return projectCloneLocation
}
