"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs = require("fs");
const path = require("path");
const src_1 = require("../src");
const fs_1 = require("./fs");
/**
 * Exception thrown when a module could not be resolved.
 */
class ModuleNotFoundException extends src_1.BaseException {
    constructor(moduleName, basePath) {
        super(`Could not find module ${JSON.stringify(moduleName)} from ${JSON.stringify(basePath)}.`);
        this.moduleName = moduleName;
        this.basePath = basePath;
        this.code = 'MODULE_NOT_FOUND';
    }
}
exports.ModuleNotFoundException = ModuleNotFoundException;
/**
 * Returns a list of all the callers from the resolve() call.
 * @returns {string[]}
 * @private
 */
function _caller() {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    const error = Error;
    const origPrepareStackTrace = error.prepareStackTrace;
    error.prepareStackTrace = (_, stack) => stack;
    const stack = (new Error()).stack;
    error.prepareStackTrace = origPrepareStackTrace;
    return stack ? stack.map(x => x.getFileName()) : [];
}
/**
 * Get the global directory for node_modules. This is based on NPM code itself, and may be subject
 * to change, but is relatively stable.
 * @returns {string} The path to node_modules itself.
 * @private
 */
function _getGlobalNodeModules() {
    let globalPrefix;
    if (process.env.PREFIX) {
        globalPrefix = process.env.PREFIX;
    }
    else if (process.platform === 'win32') {
        // c:\node\node.exe --> prefix=c:\node\
        globalPrefix = path.dirname(process.execPath);
    }
    else {
        // /usr/local/bin/node --> prefix=/usr/local
        globalPrefix = path.dirname(path.dirname(process.execPath));
        // destdir only is respected on Unix
        const destdir = process.env.DESTDIR;
        if (destdir) {
            globalPrefix = path.join(destdir, globalPrefix);
        }
    }
    return (process.platform !== 'win32')
        ? path.resolve(globalPrefix || '', 'lib', 'node_modules')
        : path.resolve(globalPrefix || '', 'node_modules');
}
let _resolveHook = null;
function setResolveHook(hook) {
    _resolveHook = hook;
}
exports.setResolveHook = setResolveHook;
/**
 * Resolve a package using a logic similar to npm require.resolve, but with more options.
 * @param x The package name to resolve.
 * @param options A list of options. See documentation of those options.
 * @returns {string} Path to the index to include, or if `resolvePackageJson` option was
 *                   passed, a path to that file.
 * @throws {ModuleNotFoundException} If no module with that name was found anywhere.
 */
function resolve(x, options) {
    if (_resolveHook) {
        const maybe = _resolveHook(x, options);
        if (maybe) {
            return maybe;
        }
    }
    const readFileSync = fs.readFileSync;
    const extensions = options.extensions || Object.keys(require.extensions);
    const basePath = options.basedir;
    options.paths = options.paths || [];
    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
        let res = path.resolve(basePath, x);
        if (x === '..' || x.slice(-1) === '/') {
            res += '/';
        }
        const m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) {
            return m;
        }
    }
    else {
        const n = loadNodeModulesSync(x, basePath);
        if (n) {
            return n;
        }
    }
    // Fallback to checking the local (callee) node modules.
    if (options.checkLocal) {
        const callers = _caller();
        for (const caller of callers) {
            const localDir = path.dirname(caller);
            if (localDir !== options.basedir) {
                try {
                    return resolve(x, Object.assign({}, options, { checkLocal: false, checkGlobal: false, basedir: localDir }));
                }
                catch (e) {
                    // Just swap the basePath with the original call one.
                    if (!(e instanceof ModuleNotFoundException)) {
                        throw e;
                    }
                }
            }
        }
    }
    // Fallback to checking the global node modules.
    if (options.checkGlobal) {
        const globalDir = path.dirname(_getGlobalNodeModules());
        if (globalDir !== options.basedir) {
            try {
                return resolve(x, Object.assign({}, options, { checkLocal: false, checkGlobal: false, basedir: globalDir }));
            }
            catch (e) {
                // Just swap the basePath with the original call one.
                if (!(e instanceof ModuleNotFoundException)) {
                    throw e;
                }
            }
        }
    }
    throw new ModuleNotFoundException(x, basePath);
    function loadAsFileSync(x) {
        if (fs_1.isFile(x)) {
            return x;
        }
        return extensions.map(ex => x + ex).find(f => fs_1.isFile(f)) || null;
    }
    function loadAsDirectorySync(x) {
        const pkgfile = path.join(x, 'package.json');
        if (fs_1.isFile(pkgfile)) {
            if (options.resolvePackageJson) {
                return pkgfile;
            }
            try {
                const body = readFileSync(pkgfile, 'UTF8');
                const pkg = JSON.parse(body);
                if (pkg['main']) {
                    if (pkg['main'] === '.' || pkg['main'] === './') {
                        pkg['main'] = 'index';
                    }
                    const m = loadAsFileSync(path.resolve(x, pkg['main']));
                    if (m) {
                        return m;
                    }
                    const n = loadAsDirectorySync(path.resolve(x, pkg['main']));
                    if (n) {
                        return n;
                    }
                }
            }
            catch (e) { }
        }
        return loadAsFileSync(path.join(x, '/index'));
    }
    function loadNodeModulesSync(x, start) {
        const dirs = nodeModulesPaths(start, options);
        for (const dir of dirs) {
            const m = loadAsFileSync(path.join(dir, '/', x));
            if (m) {
                return m;
            }
            const n = loadAsDirectorySync(path.join(dir, '/', x));
            if (n) {
                return n;
            }
        }
        return null;
    }
    function nodeModulesPaths(start, opts) {
        const modules = ['node_modules'];
        // ensure that `start` is an absolute path at this point,
        // resolving against the process' current working directory
        let absoluteStart = path.resolve(start);
        if (opts && opts.preserveSymlinks === false) {
            try {
                absoluteStart = fs.realpathSync(absoluteStart);
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
        let prefix = '/';
        if (/^([A-Za-z]:)/.test(absoluteStart)) {
            prefix = '';
        }
        else if (/^\\\\/.test(absoluteStart)) {
            prefix = '\\\\';
        }
        const paths = [absoluteStart];
        let parsed = path.parse(absoluteStart);
        while (parsed.dir !== paths[paths.length - 1]) {
            paths.push(parsed.dir);
            parsed = path.parse(parsed.dir);
        }
        const dirs = paths.reduce((dirs, aPath) => {
            return dirs.concat(modules.map(function (moduleDir) {
                return path.join(prefix, aPath, moduleDir);
            }));
        }, []);
        return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
    }
}
exports.resolve = resolve;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9ub2RlL3Jlc29sdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUF1QztBQUN2Qyw2QkFBOEI7QUFFOUI7O0dBRUc7QUFDSCw2QkFBcUMsU0FBUSxtQkFBYTtJQUd4RCxZQUE0QixVQUFrQixFQUFrQixRQUFnQjtRQUM5RSxLQUFLLENBQUMseUJBQXlCLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFEckUsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUFrQixhQUFRLEdBQVIsUUFBUSxDQUFRO1FBRTlFLElBQUksQ0FBQyxJQUFJLEdBQUcsa0JBQWtCLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBUEQsMERBT0M7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSxnRUFBZ0U7SUFDaEUsTUFBTSxLQUFLLEdBQUcsS0FBOEQsQ0FBQztJQUM3RSxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUN0RCxLQUFLLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDOUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBb0UsQ0FBQztJQUNqRyxLQUFLLENBQUMsaUJBQWlCLEdBQUcscUJBQXFCLENBQUM7SUFFaEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDdEQs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QUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0QsQ0FBQztBQUNILENBQUM7QUEzS0QsMEJBMktDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHsgaXNGaWxlIH0gZnJvbSAnLi9mcyc7XG5cbi8qKlxuICogRXhjZXB0aW9uIHRocm93biB3aGVuIGEgbW9kdWxlIGNvdWxkIG5vdCBiZSByZXNvbHZlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IG1vZHVsZU5hbWU6IHN0cmluZywgcHVibGljIHJlYWRvbmx5IGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ291bGQgbm90IGZpbmQgbW9kdWxlICR7SlNPTi5zdHJpbmdpZnkobW9kdWxlTmFtZSl9IGZyb20gJHtKU09OLnN0cmluZ2lmeShiYXNlUGF0aCl9LmApO1xuICAgIHRoaXMuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgY2FsbGVycyBmcm9tIHRoZSByZXNvbHZlKCkgY2FsbC5cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9jYWxsZXIoKTogc3RyaW5nW10ge1xuICAvLyBzZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC93aWtpL0phdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gIGNvbnN0IGVycm9yID0gRXJyb3IgYXMge30gYXMgeyBwcmVwYXJlU3RhY2tUcmFjZTogKHg6IHt9LCBzdGFjazoge30pID0+IHt9IH07XG4gIGNvbnN0IG9yaWdQcmVwYXJlU3RhY2tUcmFjZSA9IGVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuICBlcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IChfLCBzdGFjaykgPT4gc3RhY2s7XG4gIGNvbnN0IHN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjayBhcyB7fVtdIHwgdW5kZWZpbmVkIGFzIHsgZ2V0RmlsZU5hbWUoKTogc3RyaW5nIH1bXSB8IHVuZGVmaW5lZDtcbiAgZXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSBvcmlnUHJlcGFyZVN0YWNrVHJhY2U7XG5cbiAgcmV0dXJuIHN0YWNrID8gc3RhY2subWFwKHggPT4geC5nZXRGaWxlTmFtZSgpKSA6IFtdO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBnbG9iYWwgZGlyZWN0b3J5IGZvciBub2RlX21vZHVsZXMuIFRoaXMgaXMgYmFzZWQgb24gTlBNIGNvZGUgaXRzZWxmLCBhbmQgbWF5IGJlIHN1YmplY3RcbiAqIHRvIGNoYW5nZSwgYnV0IGlzIHJlbGF0aXZlbHkgc3RhYmxlLlxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHBhdGggdG8gbm9kZV9tb2R1bGVzIGl0c2VsZi5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9nZXRHbG9iYWxOb2RlTW9kdWxlcygpIHtcbiAgbGV0IGdsb2JhbFByZWZpeDtcblxuICBpZiAocHJvY2Vzcy5lbnYuUFJFRklYKSB7XG4gICAgZ2xvYmFsUHJlZml4ID0gcHJvY2Vzcy5lbnYuUFJFRklYO1xuICB9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAvLyBjOlxcbm9kZVxcbm9kZS5leGUgLS0+IHByZWZpeD1jOlxcbm9kZVxcXG4gICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5kaXJuYW1lKHByb2Nlc3MuZXhlY1BhdGgpO1xuICB9IGVsc2Uge1xuICAgIC8vIC91c3IvbG9jYWwvYmluL25vZGUgLS0+IHByZWZpeD0vdXNyL2xvY2FsXG4gICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShwcm9jZXNzLmV4ZWNQYXRoKSk7XG5cbiAgICAvLyBkZXN0ZGlyIG9ubHkgaXMgcmVzcGVjdGVkIG9uIFVuaXhcbiAgICBjb25zdCBkZXN0ZGlyID0gcHJvY2Vzcy5lbnYuREVTVERJUjtcbiAgICBpZiAoZGVzdGRpcikge1xuICAgICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5qb2luKGRlc3RkaXIsIGdsb2JhbFByZWZpeCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKVxuICAgID8gcGF0aC5yZXNvbHZlKGdsb2JhbFByZWZpeCB8fCAnJywgJ2xpYicsICdub2RlX21vZHVsZXMnKVxuICAgIDogcGF0aC5yZXNvbHZlKGdsb2JhbFByZWZpeCB8fCAnJywgJ25vZGVfbW9kdWxlcycpO1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZU9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGJhc2VkaXIgdG8gdXNlIGZyb20gd2hpY2ggdG8gcmVzb2x2ZS5cbiAgICovXG4gIGJhc2VkaXI6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2YgZXh0ZW5zaW9ucyB0byByZXNvbHZlLiBCeSBkZWZhdWx0IHVzZXMgT2JqZWN0LmtleXMocmVxdWlyZS5leHRlbnNpb25zKS5cbiAgICovXG4gIGV4dGVuc2lvbnM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQW4gYWRkaXRpb25hbCBsaXN0IG9mIHBhdGhzIHRvIGxvb2sgaW50by5cbiAgICovXG4gIHBhdGhzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRvIHByZXNlcnZlIHN5bWJvbGljIGxpbmtzLiBJZiBmYWxzZSwgdGhlIGFjdHVhbCBwYXRocyBwb2ludGVkIGJ5XG4gICAqIHRoZSBzeW1ib2xpYyBsaW5rcyB3aWxsIGJlIHVzZWQuIFRoaXMgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICovXG4gIHByZXNlcnZlU3ltbGlua3M/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGZhbGxiYWNrIHRvIGEgZ2xvYmFsIGxvb2t1cCBpZiB0aGUgYmFzZWRpciBvbmUgZmFpbGVkLlxuICAgKi9cbiAgY2hlY2tHbG9iYWw/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGZhbGxiYWNrIHRvIHVzaW5nIHRoZSBsb2NhbCBjYWxsZXIncyBkaXJlY3RvcnkgaWYgdGhlIGJhc2VkaXIgZmFpbGVkLlxuICAgKi9cbiAgY2hlY2tMb2NhbD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gb25seSByZXNvbHZlIGFuZCByZXR1cm4gdGhlIGZpcnN0IHBhY2thZ2UuanNvbiBmaWxlIGZvdW5kLiBCeSBkZWZhdWx0LFxuICAgKiByZXNvbHZlcyB0aGUgbWFpbiBmaWVsZCBvciB0aGUgaW5kZXggb2YgdGhlIHBhY2thZ2UuXG4gICAqL1xuICByZXNvbHZlUGFja2FnZUpzb24/OiBib29sZWFuO1xufVxuXG5cbmxldCBfcmVzb2x2ZUhvb2s6ICgoeDogc3RyaW5nLCBvcHRpb25zOiBSZXNvbHZlT3B0aW9ucykgPT4gc3RyaW5nIHwgbnVsbCkgfCBudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXRSZXNvbHZlSG9vayhcbiAgaG9vazogKCh4OiBzdHJpbmcsIG9wdGlvbnM6IFJlc29sdmVPcHRpb25zKSA9PiBzdHJpbmcgfCBudWxsKSB8IG51bGwsXG4pIHtcbiAgX3Jlc29sdmVIb29rID0gaG9vaztcbn1cblxuXG4vKipcbiAqIFJlc29sdmUgYSBwYWNrYWdlIHVzaW5nIGEgbG9naWMgc2ltaWxhciB0byBucG0gcmVxdWlyZS5yZXNvbHZlLCBidXQgd2l0aCBtb3JlIG9wdGlvbnMuXG4gKiBAcGFyYW0geCBUaGUgcGFja2FnZSBuYW1lIHRvIHJlc29sdmUuXG4gKiBAcGFyYW0gb3B0aW9ucyBBIGxpc3Qgb2Ygb3B0aW9ucy4gU2VlIGRvY3VtZW50YXRpb24gb2YgdGhvc2Ugb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFBhdGggdG8gdGhlIGluZGV4IHRvIGluY2x1ZGUsIG9yIGlmIGByZXNvbHZlUGFja2FnZUpzb25gIG9wdGlvbiB3YXNcbiAqICAgICAgICAgICAgICAgICAgIHBhc3NlZCwgYSBwYXRoIHRvIHRoYXQgZmlsZS5cbiAqIEB0aHJvd3Mge01vZHVsZU5vdEZvdW5kRXhjZXB0aW9ufSBJZiBubyBtb2R1bGUgd2l0aCB0aGF0IG5hbWUgd2FzIGZvdW5kIGFueXdoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZSh4OiBzdHJpbmcsIG9wdGlvbnM6IFJlc29sdmVPcHRpb25zKTogc3RyaW5nIHtcbiAgaWYgKF9yZXNvbHZlSG9vaykge1xuICAgIGNvbnN0IG1heWJlID0gX3Jlc29sdmVIb29rKHgsIG9wdGlvbnMpO1xuICAgIGlmIChtYXliZSkge1xuICAgICAgcmV0dXJuIG1heWJlO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlYWRGaWxlU3luYyA9IGZzLnJlYWRGaWxlU3luYztcblxuICBjb25zdCBleHRlbnNpb25zOiBzdHJpbmdbXSA9IG9wdGlvbnMuZXh0ZW5zaW9ucyB8fCBPYmplY3Qua2V5cyhyZXF1aXJlLmV4dGVuc2lvbnMpO1xuICBjb25zdCBiYXNlUGF0aCA9IG9wdGlvbnMuYmFzZWRpcjtcblxuICBvcHRpb25zLnBhdGhzID0gb3B0aW9ucy5wYXRocyB8fCBbXTtcblxuICBpZiAoL14oPzpcXC5cXC4/KD86XFwvfCQpfFxcL3woW0EtWmEtel06KT9bL1xcXFxdKS8udGVzdCh4KSkge1xuICAgIGxldCByZXMgPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHgpO1xuICAgIGlmICh4ID09PSAnLi4nIHx8IHguc2xpY2UoLTEpID09PSAnLycpIHtcbiAgICAgIHJlcyArPSAnLyc7XG4gICAgfVxuXG4gICAgY29uc3QgbSA9IGxvYWRBc0ZpbGVTeW5jKHJlcykgfHwgbG9hZEFzRGlyZWN0b3J5U3luYyhyZXMpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXR1cm4gbTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbiA9IGxvYWROb2RlTW9kdWxlc1N5bmMoeCwgYmFzZVBhdGgpO1xuICAgIGlmIChuKSB7XG4gICAgICByZXR1cm4gbjtcbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBjaGVja2luZyB0aGUgbG9jYWwgKGNhbGxlZSkgbm9kZSBtb2R1bGVzLlxuICBpZiAob3B0aW9ucy5jaGVja0xvY2FsKSB7XG4gICAgY29uc3QgY2FsbGVycyA9IF9jYWxsZXIoKTtcbiAgICBmb3IgKGNvbnN0IGNhbGxlciBvZiBjYWxsZXJzKSB7XG4gICAgICBjb25zdCBsb2NhbERpciA9IHBhdGguZGlybmFtZShjYWxsZXIpO1xuICAgICAgaWYgKGxvY2FsRGlyICE9PSBvcHRpb25zLmJhc2VkaXIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh4LCB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgY2hlY2tMb2NhbDogZmFsc2UsXG4gICAgICAgICAgICBjaGVja0dsb2JhbDogZmFsc2UsXG4gICAgICAgICAgICBiYXNlZGlyOiBsb2NhbERpcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIEp1c3Qgc3dhcCB0aGUgYmFzZVBhdGggd2l0aCB0aGUgb3JpZ2luYWwgY2FsbCBvbmUuXG4gICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBjaGVja2luZyB0aGUgZ2xvYmFsIG5vZGUgbW9kdWxlcy5cbiAgaWYgKG9wdGlvbnMuY2hlY2tHbG9iYWwpIHtcbiAgICBjb25zdCBnbG9iYWxEaXIgPSBwYXRoLmRpcm5hbWUoX2dldEdsb2JhbE5vZGVNb2R1bGVzKCkpO1xuICAgIGlmIChnbG9iYWxEaXIgIT09IG9wdGlvbnMuYmFzZWRpcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeCwge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgY2hlY2tMb2NhbDogZmFsc2UsXG4gICAgICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgICAgIGJhc2VkaXI6IGdsb2JhbERpcixcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIEp1c3Qgc3dhcCB0aGUgYmFzZVBhdGggd2l0aCB0aGUgb3JpZ2luYWwgY2FsbCBvbmUuXG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBNb2R1bGVOb3RGb3VuZEV4Y2VwdGlvbikpIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IE1vZHVsZU5vdEZvdW5kRXhjZXB0aW9uKHgsIGJhc2VQYXRoKTtcblxuICBmdW5jdGlvbiBsb2FkQXNGaWxlU3luYyh4OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoaXNGaWxlKHgpKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICByZXR1cm4gZXh0ZW5zaW9ucy5tYXAoZXggPT4geCArIGV4KS5maW5kKGYgPT4gaXNGaWxlKGYpKSB8fCBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZEFzRGlyZWN0b3J5U3luYyh4OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBwa2dmaWxlID0gcGF0aC5qb2luKHgsICdwYWNrYWdlLmpzb24nKTtcbiAgICBpZiAoaXNGaWxlKHBrZ2ZpbGUpKSB7XG4gICAgICBpZiAob3B0aW9ucy5yZXNvbHZlUGFja2FnZUpzb24pIHtcbiAgICAgICAgcmV0dXJuIHBrZ2ZpbGU7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSByZWFkRmlsZVN5bmMocGtnZmlsZSwgJ1VURjgnKTtcbiAgICAgICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZShib2R5KTtcblxuICAgICAgICBpZiAocGtnWydtYWluJ10pIHtcbiAgICAgICAgICBpZiAocGtnWydtYWluJ10gPT09ICcuJyB8fCBwa2dbJ21haW4nXSA9PT0gJy4vJykge1xuICAgICAgICAgICAgcGtnWydtYWluJ10gPSAnaW5kZXgnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG0gPSBsb2FkQXNGaWxlU3luYyhwYXRoLnJlc29sdmUoeCwgcGtnWydtYWluJ10pKTtcbiAgICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IG4gPSBsb2FkQXNEaXJlY3RvcnlTeW5jKHBhdGgucmVzb2x2ZSh4LCBwa2dbJ21haW4nXSkpO1xuICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvYWRBc0ZpbGVTeW5jKHBhdGguam9pbih4LCAnL2luZGV4JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZE5vZGVNb2R1bGVzU3luYyh4OiBzdHJpbmcsIHN0YXJ0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBkaXJzID0gbm9kZU1vZHVsZXNQYXRocyhzdGFydCwgb3B0aW9ucyk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgZGlycykge1xuICAgICAgY29uc3QgbSA9IGxvYWRBc0ZpbGVTeW5jKHBhdGguam9pbihkaXIsICcvJywgeCkpO1xuICAgICAgaWYgKG0pIHtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgICB9XG4gICAgICBjb25zdCBuID0gbG9hZEFzRGlyZWN0b3J5U3luYyhwYXRoLmpvaW4oZGlyLCAnLycsIHgpKTtcbiAgICAgIGlmIChuKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9kZU1vZHVsZXNQYXRocyhzdGFydDogc3RyaW5nLCBvcHRzOiBSZXNvbHZlT3B0aW9ucykge1xuICAgIGNvbnN0IG1vZHVsZXMgPSBbJ25vZGVfbW9kdWxlcyddO1xuXG4gICAgLy8gZW5zdXJlIHRoYXQgYHN0YXJ0YCBpcyBhbiBhYnNvbHV0ZSBwYXRoIGF0IHRoaXMgcG9pbnQsXG4gICAgLy8gcmVzb2x2aW5nIGFnYWluc3QgdGhlIHByb2Nlc3MnIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAgICBsZXQgYWJzb2x1dGVTdGFydCA9IHBhdGgucmVzb2x2ZShzdGFydCk7XG5cbiAgICBpZiAob3B0cyAmJiBvcHRzLnByZXNlcnZlU3ltbGlua3MgPT09IGZhbHNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhYnNvbHV0ZVN0YXJ0ID0gZnMucmVhbHBhdGhTeW5jKGFic29sdXRlU3RhcnQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcHJlZml4ID0gJy8nO1xuICAgIGlmICgvXihbQS1aYS16XTopLy50ZXN0KGFic29sdXRlU3RhcnQpKSB7XG4gICAgICBwcmVmaXggPSAnJztcbiAgICB9IGVsc2UgaWYgKC9eXFxcXFxcXFwvLnRlc3QoYWJzb2x1dGVTdGFydCkpIHtcbiAgICAgIHByZWZpeCA9ICdcXFxcXFxcXCc7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aHMgPSBbYWJzb2x1dGVTdGFydF07XG4gICAgbGV0IHBhcnNlZCA9IHBhdGgucGFyc2UoYWJzb2x1dGVTdGFydCk7XG4gICAgd2hpbGUgKHBhcnNlZC5kaXIgIT09IHBhdGhzW3BhdGhzLmxlbmd0aCAtIDFdKSB7XG4gICAgICBwYXRocy5wdXNoKHBhcnNlZC5kaXIpO1xuICAgICAgcGFyc2VkID0gcGF0aC5wYXJzZShwYXJzZWQuZGlyKTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJzID0gcGF0aHMucmVkdWNlKChkaXJzOiBzdHJpbmdbXSwgYVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIGRpcnMuY29uY2F0KG1vZHVsZXMubWFwKGZ1bmN0aW9uIChtb2R1bGVEaXIpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbihwcmVmaXgsIGFQYXRoLCBtb2R1bGVEaXIpO1xuICAgICAgfSkpO1xuICAgIH0sIFtdKTtcblxuICAgIHJldHVybiBvcHRzICYmIG9wdHMucGF0aHMgPyBkaXJzLmNvbmNhdChvcHRzLnBhdGhzKSA6IGRpcnM7XG4gIH1cbn1cbiJdfQ==