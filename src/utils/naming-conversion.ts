export function convertToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase()
}

export function convertToCamelCase(str: string) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function convertToSnakeCase(str: string) {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase()
}

export function convertToPascalCase(str: string) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function convertBaseOnPattern(str: string, pattern: "kebab" | "camel" | "snake" | "pascal" | "original") {
  if (pattern === "original") {
    return str
  }
  if (pattern === "kebab") {
    return convertToKebabCase(str)
  }
  if (pattern === "camel") {
    return convertToCamelCase(str)
  }
  if (pattern === "snake") {
    return convertToSnakeCase(str)
  }
  if (pattern === "pascal") {
    return convertToPascalCase(str)
  }
  throw new Error(`Invalid pattern: ${pattern}`)
}
