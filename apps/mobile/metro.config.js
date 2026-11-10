const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

const resolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("fonts/private/Gazpacho")) {
    const archivo = path.join(projectRoot, "assets/fonts/private/Gazpacho-Heavy.otf");
    return {
      type: "sourceFile",
      filePath: fs.existsSync(archivo) ? archivo : path.join(projectRoot, "src/fuente-ausente.js"),
    };
  }
  if (resolver) return resolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
