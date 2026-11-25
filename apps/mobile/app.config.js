const estatico = require("./app.json").expo;

/** Solo el id que venga en EAS_PROJECT_ID. Sin variable, el campo queda vacío. */
function proyectoEas(env = process.env) {
  const projectId = typeof env.EAS_PROJECT_ID === "string" ? env.EAS_PROJECT_ID.trim() : "";
  return projectId ? { projectId } : {};
}

module.exports = ({ config } = {}) => {
  const base = config && config.slug ? config : estatico;
  return {
    ...base,
    extra: {
      ...(base.extra ?? {}),
      eas: proyectoEas(),
    },
  };
};

module.exports.proyectoEas = proyectoEas;
