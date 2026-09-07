const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Execute repository TypeScript in memory with explicit dependency fakes.
// No emitted files, network calls, or application secrets are needed.
function loadTs(filename, mocks = {}, cache = new Map()) {
    const resolved = path.resolve(filename);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const mod = { exports: {} };
    cache.set(resolved, mod);
    const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
    }).outputText;
    function localRequire(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith(".") || name.startsWith("@/")) {
            const base = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(resolved), name);
            const file = [base, base + ".ts", base + ".tsx"].find(item => fs.existsSync(item) && fs.statSync(item).isFile());
            return loadTs(file, mocks, cache);
        }
        return require(name);
    }
    new Function("require", "module", "exports", code)(localRequire, mod, mod.exports);
    return mod.exports;
}
module.exports = { loadTs };
