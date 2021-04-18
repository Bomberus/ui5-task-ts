/**
 * UI5 Task Convert TS -> UI5 Class
 *
 * @param {object} parameters Parameters
 * @param {module:@ui5/fs.DuplexCollection} parameters.workspace DuplexCollection to read and write files
 * @param {module:@ui5/fs.AbstractReader} parameters.dependencies Reader or Collection to read dependency files
 * @param {object} parameters.taskUtil Specification Version dependent interface to a
 *                [TaskUtil]{@link module:@ui5/builder.tasks.TaskUtil} instance
 * @param {object} parameters.options Options
 * @param {string} parameters.options.projectName Project name
 * @param {string} [parameters.options.projectNamespace] Project namespace if available
 * @param {string} [parameters.options.configuration] Task configuration if given in ui5.yaml
 * @returns {Promise<undefined>} Promise resolving with <code>undefined</code> once data has been written
 */
module.exports = async function({workspace, dependencies, taskUtil, options}) {
    const { transpileTS } = require("ui5-ts-amd");
    const { join } = require("path");
    const { readFileSync } = require("fs");
    const config = options.configuration || { appId: "" };
    const { appId } = config;

    const tsConfig = JSON.parse(readFileSync(join('tsconfig.json')).toString());
          tsConfig.compilerOptions.sourceMap = false;
          tsConfig.compilerOptions.inlineSourceMap = false;

    const tsResources = await workspace.byGlob("**/*.ts");
    await Promise.all(tsResources.map(async (resource) => {
        let tsFile = (await resource.getBuffer()).toString();
        const namespace = appId +
          resource
            .getPath()
            .replace("/", ".")
            .replace(".controller.", "")
            .replace(".ts", "");
          
        let js = transpileTS(
          namespace,
          resource.getPath().substr(1),
          tsFile,
          tsConfig
        );

        js = resource.getPath() === "/Component.ts" ? 
          readFileSync(
            join(
              'node_modules/ui5-ts-amd/lib/ts-polyfill.js'
            )
          ).toString() + "\n" +  js : 
          js

        resource.setPath(resource.getPath().replace(".ts", ".js"));
        resource.setString(js);
        return workspace.write(resource);
    }));
};