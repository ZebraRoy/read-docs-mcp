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
  personalToken,
  includeSrc = false,
}: {
  name: string
  repoPath: string
  branch?: string
  docsPath?: string
  cloneLocation?: string
  personalToken?: string
  includeSrc?: boolean
}) {
  // Use project-specific clone location if not explicitly provided
  const projectCloneLocation = getCloneDir(name, cloneLocation)

  // Ensure clone directory exists
  if (!fs.existsSync(projectCloneLocation)) {
    fs.mkdirSync(projectCloneLocation, { recursive: true })
  }

  // Construct the authenticated repo URL if personal token is provided
  let authenticatedRepoPath = repoPath
  if (personalToken) {
    // Handle different git URL formats
    if (repoPath.startsWith("git@")) {
      // SSH URL format: git@hostname:path/repo.git
      // Convert to HTTPS format: https://hostname/path/repo.git
      const sshMatch = repoPath.match(/^git@([^:]+):(.+)$/)
      if (sshMatch) {
        const [, hostname, repoPath] = sshMatch
        // Check if it's a known GitLab instance (including self-hosted)
        if (hostname.includes("gitlab")) {
          authenticatedRepoPath = `https://oauth2:${personalToken}@${hostname}/${repoPath}`
        }
        else if (hostname.includes("github")) {
          authenticatedRepoPath = `https://${personalToken}@${hostname}/${repoPath}`
        }
        else if (hostname.includes("bitbucket")) {
          authenticatedRepoPath = `https://x-token-auth:${personalToken}@${hostname}/${repoPath}`
        }
        else {
          // Generic self-hosted Git server - try GitLab format first (most common for self-hosted)
          authenticatedRepoPath = `https://oauth2:${personalToken}@${hostname}/${repoPath}`
        }
      }
    }
    else if (repoPath.startsWith("https://github.com/")) {
      // GitHub HTTPS URL - insert token
      authenticatedRepoPath = repoPath.replace("https://github.com/", `https://${personalToken}@github.com/`)
    }
    else if (repoPath.startsWith("https://gitlab.com/") || repoPath.includes("gitlab")) {
      // GitLab HTTPS URL (including self-hosted) - insert token
      authenticatedRepoPath = repoPath.replace("https://", `https://oauth2:${personalToken}@`)
    }
    else if (repoPath.startsWith("https://bitbucket.org/")) {
      // Bitbucket HTTPS URL - insert token
      authenticatedRepoPath = repoPath.replace("https://bitbucket.org/", `https://x-token-auth:${personalToken}@bitbucket.org/`)
    }
    else if (repoPath.startsWith("https://")) {
      // Generic HTTPS URL - try GitLab OAuth2 format for self-hosted instances
      authenticatedRepoPath = repoPath.replace("https://", `https://oauth2:${personalToken}@`)
    }
  }

  // Initialize git
  const git = simpleGit(projectCloneLocation)

  // Check if repo is already cloned
  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    // Initialize empty repo
    await git.init()
    // Add remote
    await git.addRemote("origin", authenticatedRepoPath)
    
    if (!includeSrc) {
      // Enable sparse checkout only if not including source
      await git.raw("config", "core.sparseCheckout", "true")

      // Write the sparse checkout patterns to the git config file
      const sparseCheckoutPath = path.join(projectCloneLocation, ".git", "info", "sparse-checkout")
      fs.writeFileSync(sparseCheckoutPath, docsPath)
    }

    // Fetch the branch
    await git.fetch("origin", branch)
    // Checkout the branch
    await git.checkout(branch)
  }
  else {
    // If repo exists, update it
    // Update the remote URL if personal token is provided and it's different from current
    if (personalToken) {
      const remotes = await git.getRemotes(true)
      const originRemote = remotes.find(remote => remote.name === "origin")
      if (originRemote && originRemote.refs.fetch !== authenticatedRepoPath) {
        await git.removeRemote("origin")
        await git.addRemote("origin", authenticatedRepoPath)
      }
    }
    await git.fetch("origin", branch)
    await git.checkout(branch)
    await git.pull("origin", branch)
  }

  return projectCloneLocation
}
