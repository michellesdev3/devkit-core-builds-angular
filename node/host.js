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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
const { FSWatcher } = require('chokidar');
function _callFs(fn, ...args) {
    return new rxjs_1.Observable(obs => {
        fn(...args, (err, result) => {
            if (err) {
                obs.error(err);
            }
            else {
                obs.next(result);
                obs.complete();
            }
        });
    });
}
/**
 * An implementation of the Virtual FS using Node as the background. There are two versions; one
 * synchronous and one asynchronous.
 */
class NodeJsAsyncHost {
    get capabilities() {
        return { synchronous: false };
    }
    write(path, content) {
        return new rxjs_1.Observable(obs => {
            // Create folders if necessary.
            const _createDir = (path) => {
                if (fs.existsSync(src_1.getSystemPath(path))) {
                    return;
                }
                if (src_1.dirname(path) === path) {
                    throw new Error();
                }
                _createDir(src_1.dirname(path));
                fs.mkdirSync(src_1.getSystemPath(path));
            };
            _createDir(src_1.dirname(path));
            _callFs(fs.writeFile, src_1.getSystemPath(path), new Uint8Array(content)).subscribe(obs);
        });
    }
    read(path) {
        return _callFs(fs.readFile, src_1.getSystemPath(path)).pipe(operators_1.map(buffer => new Uint8Array(buffer).buffer));
    }
    delete(path) {
        return this.isDirectory(path).pipe(operators_1.mergeMap(isDirectory => {
            if (isDirectory) {
                const allFiles = [];
                const allDirs = [];
                const _recurseList = (path) => {
                    for (const fragment of fs.readdirSync(src_1.getSystemPath(path))) {
                        if (fs.statSync(src_1.getSystemPath(src_1.join(path, fragment))).isDirectory()) {
                            _recurseList(src_1.join(path, fragment));
                            allDirs.push(src_1.join(path, fragment));
                        }
                        else {
                            allFiles.push(src_1.join(path, fragment));
                        }
                    }
                };
                _recurseList(path);
                return rxjs_1.concat(rxjs_1.from(allFiles).pipe(operators_1.mergeMap(p => _callFs(fs.unlink, src_1.getSystemPath(p))), operators_1.ignoreElements()), rxjs_1.from(allDirs).pipe(operators_1.concatMap(p => _callFs(fs.rmdir, src_1.getSystemPath(p))), operators_1.map(() => { })));
            }
            else {
                return _callFs(fs.unlink, src_1.getSystemPath(path));
            }
        }));
    }
    rename(from, to) {
        return _callFs(fs.rename, src_1.getSystemPath(from), src_1.getSystemPath(to));
    }
    list(path) {
        return _callFs(fs.readdir, src_1.getSystemPath(path)).pipe(operators_1.map(names => names.map(name => src_1.fragment(name))));
    }
    exists(path) {
        // Exists is a special case because it cannot error.
        return new rxjs_1.Observable(obs => {
            fs.exists(path, exists => {
                obs.next(exists);
                obs.complete();
            });
        });
    }
    isDirectory(path) {
        return _callFs(fs.stat, src_1.getSystemPath(path)).pipe(operators_1.map(stat => stat.isDirectory()));
    }
    isFile(path) {
        return _callFs(fs.stat, src_1.getSystemPath(path)).pipe(operators_1.map(stat => stat.isDirectory()));
    }
    // Some hosts may not support stat.
    stat(path) {
        return _callFs(fs.stat, src_1.getSystemPath(path));
    }
    // Some hosts may not support watching.
    watch(path, _options) {
        return new rxjs_1.Observable(obs => {
            const watcher = new FSWatcher({ persistent: true }).add(src_1.getSystemPath(path));
            watcher
                .on('change', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 0 /* Changed */,
                });
            })
                .on('add', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 1 /* Created */,
                });
            })
                .on('unlink', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 2 /* Deleted */,
                });
            });
            return () => watcher.close();
        }).pipe(operators_1.publish(), operators_1.refCount());
    }
}
exports.NodeJsAsyncHost = NodeJsAsyncHost;
/**
 * An implementation of the Virtual FS using Node as the backend, synchronously.
 */
class NodeJsSyncHost {
    get capabilities() {
        return { synchronous: true };
    }
    write(path, content) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                // Create folders if necessary.
                const _createDir = (path) => {
                    if (fs.existsSync(src_1.getSystemPath(path))) {
                        return;
                    }
                    _createDir(src_1.dirname(path));
                    fs.mkdirSync(src_1.getSystemPath(path));
                };
                _createDir(src_1.dirname(path));
                fs.writeFileSync(src_1.getSystemPath(path), new Uint8Array(content));
                obs.next();
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    read(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                const buffer = fs.readFileSync(src_1.getSystemPath(path));
                obs.next(new Uint8Array(buffer).buffer);
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    delete(path) {
        return this.isDirectory(path).pipe(operators_1.concatMap(isDir => {
            if (isDir) {
                // Since this is synchronous, we can recurse and safely ignore the result.
                for (const name of fs.readdirSync(src_1.getSystemPath(path))) {
                    this.delete(src_1.join(path, name)).subscribe();
                }
                try {
                    fs.rmdirSync(src_1.getSystemPath(path));
                }
                catch (error) {
                    return rxjs_1.throwError(error);
                }
            }
            else {
                try {
                    fs.unlinkSync(src_1.getSystemPath(path));
                }
                catch (error) {
                    return rxjs_1.throwError(error);
                }
            }
            return rxjs_1.EMPTY;
        }));
    }
    rename(from, to) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                fs.renameSync(src_1.getSystemPath(from), src_1.getSystemPath(to));
                obs.next();
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    list(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                const names = fs.readdirSync(src_1.getSystemPath(path));
                obs.next(names.map(name => src_1.fragment(name)));
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    exists(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                obs.next(fs.existsSync(src_1.getSystemPath(path)));
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    isDirectory(path) {
        // tslint:disable-next-line:non-null-operator
        return this.stat(path).pipe(operators_1.map(stat => stat.isDirectory()));
    }
    isFile(path) {
        // tslint:disable-next-line:non-null-operator
        return this.stat(path).pipe(operators_1.map(stat => stat.isFile()));
    }
    // Some hosts may not support stat.
    stat(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                obs.next(fs.statSync(src_1.getSystemPath(path)));
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    // Some hosts may not support watching.
    watch(path, _options) {
        return new rxjs_1.Observable(obs => {
            const opts = { persistent: false };
            const watcher = new FSWatcher(opts).add(src_1.getSystemPath(path));
            watcher
                .on('change', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 0 /* Changed */,
                });
            })
                .on('add', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 1 /* Created */,
                });
            })
                .on('unlink', path => {
                obs.next({
                    path: src_1.normalize(path),
                    time: new Date(),
                    type: 2 /* Deleted */,
                });
            });
            return () => watcher.close();
        }).pipe(operators_1.publish(), operators_1.refCount());
    }
}
exports.NodeJsSyncHost = NodeJsSyncHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9ub2RlL2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCx5QkFBeUI7QUFDekIsK0JBQXFGO0FBQ3JGLDhDQU93QjtBQUN4QixnQ0FTZ0I7QUFjaEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFtQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFhMUUsaUJBQTBCLEVBQVksRUFBRSxHQUFHLElBQVU7SUFDbkQsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMxQixFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFXLEVBQUUsTUFBZ0IsRUFBRSxFQUFFO1lBQzVDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ1IsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakIsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUdEOzs7R0FHRztBQUNIO0lBQ0UsSUFBSSxZQUFZO1FBQ2QsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBVSxFQUFFLE9BQTZCO1FBQzdDLE1BQU0sQ0FBQyxJQUFJLGlCQUFVLENBQU8sR0FBRyxDQUFDLEVBQUU7WUFDaEMsK0JBQStCO1lBQy9CLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBVSxFQUFFLEVBQUU7Z0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsTUFBTSxDQUFDO2dCQUNULENBQUM7Z0JBQ0QsRUFBRSxDQUFDLENBQUMsYUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDcEIsQ0FBQztnQkFDRCxVQUFVLENBQUMsYUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLEVBQUUsQ0FBQyxTQUFTLENBQUMsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQztZQUNGLFVBQVUsQ0FBQyxhQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUUxQixPQUFPLENBQ0wsRUFBRSxDQUFDLFNBQVMsRUFDWixtQkFBYSxDQUFDLElBQUksQ0FBQyxFQUNuQixJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FDeEIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDbkQsZUFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBOEIsQ0FBQyxDQUNyRSxDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUNoQyxvQkFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE1BQU0sUUFBUSxHQUFXLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxPQUFPLEdBQVcsRUFBRSxDQUFDO2dCQUMzQixNQUFNLFlBQVksR0FBRyxDQUFDLElBQVUsRUFBRSxFQUFFO29CQUNsQyxHQUFHLENBQUMsQ0FBQyxNQUFNLFFBQVEsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNELEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsbUJBQWEsQ0FBQyxVQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ25FLFlBQVksQ0FBQyxVQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7NEJBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUNyQyxDQUFDO3dCQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNOLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxDQUFDO29CQUNILENBQUM7Z0JBQ0gsQ0FBQyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFbkIsTUFBTSxDQUFDLGFBQU0sQ0FDWCxXQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUMzQixvQkFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsbUJBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25ELDBCQUFjLEVBQUUsQ0FDakIsRUFDRCxXQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUMxQixxQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsbUJBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25ELGVBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FDZCxDQUNGLENBQUM7WUFDSixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVSxFQUFFLEVBQVE7UUFDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLG1CQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsbUJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxJQUFJLENBQUMsSUFBVTtRQUNiLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNsRCxlQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDaEQsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLG9EQUFvRDtRQUNwRCxNQUFNLENBQUMsSUFBSSxpQkFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUN2QixHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqQixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBVTtRQUNwQixNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDL0MsZUFBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQ2hDLENBQUM7SUFDSixDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVU7UUFDZixNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDL0MsZUFBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQ2hDLENBQUM7SUFDSixDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLEtBQUssQ0FDSCxJQUFVLEVBQ1YsUUFBcUM7UUFFckMsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBMkIsR0FBRyxDQUFDLEVBQUU7WUFDcEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTdFLE9BQU87aUJBQ0osRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDbkIsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDUCxJQUFJLEVBQUUsZUFBUyxDQUFDLElBQUksQ0FBQztvQkFDckIsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO29CQUNoQixJQUFJLGlCQUFzQztpQkFDM0MsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDO2lCQUNELEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ1AsSUFBSSxFQUFFLGVBQVMsQ0FBQyxJQUFJLENBQUM7b0JBQ3JCLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDaEIsSUFBSSxpQkFBc0M7aUJBQzNDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQztpQkFDRCxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNuQixHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNQLElBQUksRUFBRSxlQUFTLENBQUMsSUFBSSxDQUFDO29CQUNyQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ2hCLElBQUksaUJBQXNDO2lCQUMzQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVMLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNMLG1CQUFPLEVBQUUsRUFDVCxvQkFBUSxFQUFFLENBQ1gsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTlJRCwwQ0E4SUM7QUFHRDs7R0FFRztBQUNIO0lBQ0UsSUFBSSxZQUFZO1FBQ2QsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBVSxFQUFFLE9BQTZCO1FBQzdDLE1BQU0sQ0FBQyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIsMEZBQTBGO1lBQzFGLFNBQVM7WUFDVCxJQUFJLENBQUM7Z0JBQ0gsK0JBQStCO2dCQUMvQixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVUsRUFBRSxFQUFFO29CQUNoQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZDLE1BQU0sQ0FBQztvQkFDVCxDQUFDO29CQUNELFVBQVUsQ0FBQyxhQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDMUIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLENBQUMsQ0FBQztnQkFDRixVQUFVLENBQUMsYUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLEVBQUUsQ0FBQyxhQUFhLENBQUMsbUJBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUUvRCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQiwwRkFBMEY7WUFDMUYsU0FBUztZQUNULElBQUksQ0FBQztnQkFDSCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFcEQsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUE4QixDQUFDLENBQUM7Z0JBQ2hFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQixDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDYixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDaEMscUJBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNoQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNWLDBFQUEwRTtnQkFDMUUsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDNUMsQ0FBQztnQkFDRCxJQUFJLENBQUM7b0JBQ0gsRUFBRSxDQUFDLFNBQVMsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDZixNQUFNLENBQUMsaUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNILENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixJQUFJLENBQUM7b0JBQ0gsRUFBRSxDQUFDLFVBQVUsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDZixNQUFNLENBQUMsaUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNILENBQUM7WUFFRCxNQUFNLENBQUMsWUFBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVSxFQUFFLEVBQVE7UUFDekIsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQiwwRkFBMEY7WUFDMUYsU0FBUztZQUNULElBQUksQ0FBQztnQkFDSCxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsbUJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQiwwRkFBMEY7WUFDMUYsU0FBUztZQUNULElBQUksQ0FBQztnQkFDSCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLG1CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQiwwRkFBMEY7WUFDMUYsU0FBUztZQUNULElBQUksQ0FBQztnQkFDSCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQixDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDYixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBVTtRQUNwQiw2Q0FBNkM7UUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFHLENBQUMsSUFBSSxDQUFDLGVBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsNkNBQTZDO1FBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRyxDQUFDLElBQUksQ0FBQyxlQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxtQ0FBbUM7SUFDbkMsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLENBQUMsSUFBSSxpQkFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLDBGQUEwRjtZQUMxRixTQUFTO1lBQ1QsSUFBSSxDQUFDO2dCQUNILEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxLQUFLLENBQ0gsSUFBVSxFQUNWLFFBQXFDO1FBRXJDLE1BQU0sQ0FBQyxJQUFJLGlCQUFVLENBQTJCLEdBQUcsQ0FBQyxFQUFFO1lBQ3BELE1BQU0sSUFBSSxHQUFHLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxtQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFN0QsT0FBTztpQkFDSixFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNuQixHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNQLElBQUksRUFBRSxlQUFTLENBQUMsSUFBSSxDQUFDO29CQUNyQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ2hCLElBQUksaUJBQXNDO2lCQUMzQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUM7aUJBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDaEIsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDUCxJQUFJLEVBQUUsZUFBUyxDQUFDLElBQUksQ0FBQztvQkFDckIsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO29CQUNoQixJQUFJLGlCQUFzQztpQkFDM0MsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDO2lCQUNELEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ1AsSUFBSSxFQUFFLGVBQVMsQ0FBQyxJQUFJLENBQUM7b0JBQ3JCLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDaEIsSUFBSSxpQkFBc0M7aUJBQzNDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUwsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ0wsbUJBQU8sRUFBRSxFQUNULG9CQUFRLEVBQUUsQ0FDWCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBNUtELHdDQTRLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IEVNUFRZLCBPYnNlcnZhYmxlLCBjb25jYXQsIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIGNvbmNhdE1hcCxcbiAgaWdub3JlRWxlbWVudHMsXG4gIG1hcCxcbiAgbWVyZ2VNYXAsXG4gIHB1Ymxpc2gsXG4gIHJlZkNvdW50LFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBQYXRoLFxuICBQYXRoRnJhZ21lbnQsXG4gIGRpcm5hbWUsXG4gIGZyYWdtZW50LFxuICBnZXRTeXN0ZW1QYXRoLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnLi4vc3JjJztcblxuXG5pbnRlcmZhY2UgQ2hva2lkYXJXYXRjaGVyIHtcbiAgbmV3IChvcHRpb25zOiB7fSk6IENob2tpZGFyV2F0Y2hlcjtcblxuICBhZGQocGF0aDogc3RyaW5nKTogQ2hva2lkYXJXYXRjaGVyO1xuICBvbih0eXBlOiAnY2hhbmdlJywgY2I6IChwYXRoOiBzdHJpbmcpID0+IHZvaWQpOiBDaG9raWRhcldhdGNoZXI7XG4gIG9uKHR5cGU6ICdhZGQnLCBjYjogKHBhdGg6IHN0cmluZykgPT4gdm9pZCk6IENob2tpZGFyV2F0Y2hlcjtcbiAgb24odHlwZTogJ3VubGluaycsIGNiOiAocGF0aDogc3RyaW5nKSA9PiB2b2lkKTogQ2hva2lkYXJXYXRjaGVyO1xuXG4gIGNsb3NlKCk6IHZvaWQ7XG59XG5cbmNvbnN0IHsgRlNXYXRjaGVyIH06IHsgRlNXYXRjaGVyOiBDaG9raWRhcldhdGNoZXIgfSA9IHJlcXVpcmUoJ2Nob2tpZGFyJyk7XG5cblxudHlwZSBGc0Z1bmN0aW9uMDxSPiA9IChjYjogKGVycj86IEVycm9yLCByZXN1bHQ/OiBSKSA9PiB2b2lkKSA9PiB2b2lkO1xudHlwZSBGc0Z1bmN0aW9uMTxSLCBUMT4gPSAocDE6IFQxLCBjYjogKGVycj86IEVycm9yLCByZXN1bHQ/OiBSKSA9PiB2b2lkKSA9PiB2b2lkO1xudHlwZSBGc0Z1bmN0aW9uMjxSLCBUMSwgVDI+XG4gID0gKHAxOiBUMSwgcDI6IFQyLCBjYjogKGVycj86IEVycm9yLCByZXN1bHQ/OiBSKSA9PiB2b2lkKSA9PiB2b2lkO1xuXG5cbmZ1bmN0aW9uIF9jYWxsRnM8Uj4oZm46IEZzRnVuY3Rpb24wPFI+KTogT2JzZXJ2YWJsZTxSPjtcbmZ1bmN0aW9uIF9jYWxsRnM8UiwgVDE+KGZuOiBGc0Z1bmN0aW9uMTxSLCBUMT4sIHAxOiBUMSk6IE9ic2VydmFibGU8Uj47XG5mdW5jdGlvbiBfY2FsbEZzPFIsIFQxLCBUMj4oZm46IEZzRnVuY3Rpb24yPFIsIFQxLCBUMj4sIHAxOiBUMSwgcDI6IFQyKTogT2JzZXJ2YWJsZTxSPjtcblxuZnVuY3Rpb24gX2NhbGxGczxSZXN1bHRUPihmbjogRnVuY3Rpb24sIC4uLmFyZ3M6IHt9W10pOiBPYnNlcnZhYmxlPFJlc3VsdFQ+IHtcbiAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9icyA9PiB7XG4gICAgZm4oLi4uYXJncywgKGVycj86IEVycm9yLCByZXN1bHQ/OiBSZXN1bHRUKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIG9icy5lcnJvcihlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JzLm5leHQocmVzdWx0KTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgdGhlIFZpcnR1YWwgRlMgdXNpbmcgTm9kZSBhcyB0aGUgYmFja2dyb3VuZC4gVGhlcmUgYXJlIHR3byB2ZXJzaW9uczsgb25lXG4gKiBzeW5jaHJvbm91cyBhbmQgb25lIGFzeW5jaHJvbm91cy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVKc0FzeW5jSG9zdCBpbXBsZW1lbnRzIHZpcnR1YWxGcy5Ib3N0PGZzLlN0YXRzPiB7XG4gIGdldCBjYXBhYmlsaXRpZXMoKTogdmlydHVhbEZzLkhvc3RDYXBhYmlsaXRpZXMge1xuICAgIHJldHVybiB7IHN5bmNocm9ub3VzOiBmYWxzZSB9O1xuICB9XG5cbiAgd3JpdGUocGF0aDogUGF0aCwgY29udGVudDogdmlydHVhbEZzLkZpbGVCdWZmZXIpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8dm9pZD4ob2JzID0+IHtcbiAgICAgIC8vIENyZWF0ZSBmb2xkZXJzIGlmIG5lY2Vzc2FyeS5cbiAgICAgIGNvbnN0IF9jcmVhdGVEaXIgPSAocGF0aDogUGF0aCkgPT4ge1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlybmFtZShwYXRoKSA9PT0gcGF0aCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIF9jcmVhdGVEaXIoZGlybmFtZShwYXRoKSk7XG4gICAgICAgIGZzLm1rZGlyU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgIH07XG4gICAgICBfY3JlYXRlRGlyKGRpcm5hbWUocGF0aCkpO1xuXG4gICAgICBfY2FsbEZzPHZvaWQsIHN0cmluZywgVWludDhBcnJheT4oXG4gICAgICAgIGZzLndyaXRlRmlsZSxcbiAgICAgICAgZ2V0U3lzdGVtUGF0aChwYXRoKSxcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoY29udGVudCksXG4gICAgICApLnN1YnNjcmliZShvYnMpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTx2aXJ0dWFsRnMuRmlsZUJ1ZmZlcj4ge1xuICAgIHJldHVybiBfY2FsbEZzKGZzLnJlYWRGaWxlLCBnZXRTeXN0ZW1QYXRoKHBhdGgpKS5waXBlKFxuICAgICAgbWFwKGJ1ZmZlciA9PiBuZXcgVWludDhBcnJheShidWZmZXIpLmJ1ZmZlciBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlciksXG4gICAgKTtcbiAgfVxuXG4gIGRlbGV0ZShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuaXNEaXJlY3RvcnkocGF0aCkucGlwZShcbiAgICAgIG1lcmdlTWFwKGlzRGlyZWN0b3J5ID0+IHtcbiAgICAgICAgaWYgKGlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgY29uc3QgYWxsRmlsZXM6IFBhdGhbXSA9IFtdO1xuICAgICAgICAgIGNvbnN0IGFsbERpcnM6IFBhdGhbXSA9IFtdO1xuICAgICAgICAgIGNvbnN0IF9yZWN1cnNlTGlzdCA9IChwYXRoOiBQYXRoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZyYWdtZW50IG9mIGZzLnJlYWRkaXJTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpKSB7XG4gICAgICAgICAgICAgIGlmIChmcy5zdGF0U3luYyhnZXRTeXN0ZW1QYXRoKGpvaW4ocGF0aCwgZnJhZ21lbnQpKSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIF9yZWN1cnNlTGlzdChqb2luKHBhdGgsIGZyYWdtZW50KSk7XG4gICAgICAgICAgICAgICAgYWxsRGlycy5wdXNoKGpvaW4ocGF0aCwgZnJhZ21lbnQpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbGxGaWxlcy5wdXNoKGpvaW4ocGF0aCwgZnJhZ21lbnQpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgX3JlY3Vyc2VMaXN0KHBhdGgpO1xuXG4gICAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICAgIG9ic2VydmFibGVGcm9tKGFsbEZpbGVzKS5waXBlKFxuICAgICAgICAgICAgICBtZXJnZU1hcChwID0+IF9jYWxsRnMoZnMudW5saW5rLCBnZXRTeXN0ZW1QYXRoKHApKSksXG4gICAgICAgICAgICAgIGlnbm9yZUVsZW1lbnRzKCksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgb2JzZXJ2YWJsZUZyb20oYWxsRGlycykucGlwZShcbiAgICAgICAgICAgICAgY29uY2F0TWFwKHAgPT4gX2NhbGxGcyhmcy5ybWRpciwgZ2V0U3lzdGVtUGF0aChwKSkpLFxuICAgICAgICAgICAgICBtYXAoKCkgPT4ge30pLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfY2FsbEZzKGZzLnVubGluaywgZ2V0U3lzdGVtUGF0aChwYXRoKSk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICByZW5hbWUoZnJvbTogUGF0aCwgdG86IFBhdGgpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gX2NhbGxGcyhmcy5yZW5hbWUsIGdldFN5c3RlbVBhdGgoZnJvbSksIGdldFN5c3RlbVBhdGgodG8pKTtcbiAgfVxuXG4gIGxpc3QocGF0aDogUGF0aCk6IE9ic2VydmFibGU8UGF0aEZyYWdtZW50W10+IHtcbiAgICByZXR1cm4gX2NhbGxGcyhmcy5yZWFkZGlyLCBnZXRTeXN0ZW1QYXRoKHBhdGgpKS5waXBlKFxuICAgICAgbWFwKG5hbWVzID0+IG5hbWVzLm1hcChuYW1lID0+IGZyYWdtZW50KG5hbWUpKSksXG4gICAgKTtcbiAgfVxuXG4gIGV4aXN0cyhwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgLy8gRXhpc3RzIGlzIGEgc3BlY2lhbCBjYXNlIGJlY2F1c2UgaXQgY2Fubm90IGVycm9yLlxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgZnMuZXhpc3RzKHBhdGgsIGV4aXN0cyA9PiB7XG4gICAgICAgIG9icy5uZXh0KGV4aXN0cyk7XG4gICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBpc0RpcmVjdG9yeShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIF9jYWxsRnMoZnMuc3RhdCwgZ2V0U3lzdGVtUGF0aChwYXRoKSkucGlwZShcbiAgICAgIG1hcChzdGF0ID0+IHN0YXQuaXNEaXJlY3RvcnkoKSksXG4gICAgKTtcbiAgfVxuICBpc0ZpbGUocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBfY2FsbEZzKGZzLnN0YXQsIGdldFN5c3RlbVBhdGgocGF0aCkpLnBpcGUoXG4gICAgICBtYXAoc3RhdCA9PiBzdGF0LmlzRGlyZWN0b3J5KCkpLFxuICAgICk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCBzdGF0LlxuICBzdGF0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPHZpcnR1YWxGcy5TdGF0czxmcy5TdGF0cz4+IHwgbnVsbCB7XG4gICAgcmV0dXJuIF9jYWxsRnMoZnMuc3RhdCwgZ2V0U3lzdGVtUGF0aChwYXRoKSk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCB3YXRjaGluZy5cbiAgd2F0Y2goXG4gICAgcGF0aDogUGF0aCxcbiAgICBfb3B0aW9ucz86IHZpcnR1YWxGcy5Ib3N0V2F0Y2hPcHRpb25zLFxuICApOiBPYnNlcnZhYmxlPHZpcnR1YWxGcy5Ib3N0V2F0Y2hFdmVudD4gfCBudWxsIHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8dmlydHVhbEZzLkhvc3RXYXRjaEV2ZW50PihvYnMgPT4ge1xuICAgICAgY29uc3Qgd2F0Y2hlciA9IG5ldyBGU1dhdGNoZXIoeyBwZXJzaXN0ZW50OiB0cnVlIH0pLmFkZChnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcblxuICAgICAgd2F0Y2hlclxuICAgICAgICAub24oJ2NoYW5nZScsIHBhdGggPT4ge1xuICAgICAgICAgIG9icy5uZXh0KHtcbiAgICAgICAgICAgIHBhdGg6IG5vcm1hbGl6ZShwYXRoKSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICB0eXBlOiB2aXJ0dWFsRnMuSG9zdFdhdGNoRXZlbnRUeXBlLkNoYW5nZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgcGF0aCA9PiB7XG4gICAgICAgICAgb2JzLm5leHQoe1xuICAgICAgICAgICAgcGF0aDogbm9ybWFsaXplKHBhdGgpLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHR5cGU6IHZpcnR1YWxGcy5Ib3N0V2F0Y2hFdmVudFR5cGUuQ3JlYXRlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBwYXRoID0+IHtcbiAgICAgICAgICBvYnMubmV4dCh7XG4gICAgICAgICAgICBwYXRoOiBub3JtYWxpemUocGF0aCksXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgdHlwZTogdmlydHVhbEZzLkhvc3RXYXRjaEV2ZW50VHlwZS5EZWxldGVkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuICgpID0+IHdhdGNoZXIuY2xvc2UoKTtcbiAgICB9KS5waXBlKFxuICAgICAgcHVibGlzaCgpLFxuICAgICAgcmVmQ291bnQoKSxcbiAgICApO1xuICB9XG59XG5cblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgVmlydHVhbCBGUyB1c2luZyBOb2RlIGFzIHRoZSBiYWNrZW5kLCBzeW5jaHJvbm91c2x5LlxuICovXG5leHBvcnQgY2xhc3MgTm9kZUpzU3luY0hvc3QgaW1wbGVtZW50cyB2aXJ0dWFsRnMuSG9zdDxmcy5TdGF0cz4ge1xuICBnZXQgY2FwYWJpbGl0aWVzKCk6IHZpcnR1YWxGcy5Ib3N0Q2FwYWJpbGl0aWVzIHtcbiAgICByZXR1cm4geyBzeW5jaHJvbm91czogdHJ1ZSB9O1xuICB9XG5cbiAgd3JpdGUocGF0aDogUGF0aCwgY29udGVudDogdmlydHVhbEZzLkZpbGVCdWZmZXIpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHRyeStjYXRjaCB3aGVuIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9pc3N1ZXMvMzc0MCBpc1xuICAgICAgLy8gZml4ZWQuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBDcmVhdGUgZm9sZGVycyBpZiBuZWNlc3NhcnkuXG4gICAgICAgIGNvbnN0IF9jcmVhdGVEaXIgPSAocGF0aDogUGF0aCkgPT4ge1xuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIF9jcmVhdGVEaXIoZGlybmFtZShwYXRoKSk7XG4gICAgICAgICAgZnMubWtkaXJTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpO1xuICAgICAgICB9O1xuICAgICAgICBfY3JlYXRlRGlyKGRpcm5hbWUocGF0aCkpO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGdldFN5c3RlbVBhdGgocGF0aCksIG5ldyBVaW50OEFycmF5KGNvbnRlbnQpKTtcblxuICAgICAgICBvYnMubmV4dCgpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBvYnMuZXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlYWQocGF0aDogUGF0aCk6IE9ic2VydmFibGU8dmlydHVhbEZzLkZpbGVCdWZmZXI+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHRyeStjYXRjaCB3aGVuIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9pc3N1ZXMvMzc0MCBpc1xuICAgICAgLy8gZml4ZWQuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBmcy5yZWFkRmlsZVN5bmMoZ2V0U3lzdGVtUGF0aChwYXRoKSk7XG5cbiAgICAgICAgb2JzLm5leHQobmV3IFVpbnQ4QXJyYXkoYnVmZmVyKS5idWZmZXIgYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBvYnMuZXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuaXNEaXJlY3RvcnkocGF0aCkucGlwZShcbiAgICAgIGNvbmNhdE1hcChpc0RpciA9PiB7XG4gICAgICAgIGlmIChpc0Rpcikge1xuICAgICAgICAgIC8vIFNpbmNlIHRoaXMgaXMgc3luY2hyb25vdXMsIHdlIGNhbiByZWN1cnNlIGFuZCBzYWZlbHkgaWdub3JlIHRoZSByZXN1bHQuXG4gICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGZzLnJlYWRkaXJTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShqb2luKHBhdGgsIG5hbWUpKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZzLnJtZGlyU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZnMudW5saW5rU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICByZW5hbWUoZnJvbTogUGF0aCwgdG86IFBhdGgpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHRyeStjYXRjaCB3aGVuIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9pc3N1ZXMvMzc0MCBpc1xuICAgICAgLy8gZml4ZWQuXG4gICAgICB0cnkge1xuICAgICAgICBmcy5yZW5hbWVTeW5jKGdldFN5c3RlbVBhdGgoZnJvbSksIGdldFN5c3RlbVBhdGgodG8pKTtcbiAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgb2JzLmVycm9yKGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFBhdGhGcmFnbWVudFtdPiB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9icyA9PiB7XG4gICAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyB0cnkrY2F0Y2ggd2hlbiBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvaXNzdWVzLzM3NDAgaXNcbiAgICAgIC8vIGZpeGVkLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbmFtZXMgPSBmcy5yZWFkZGlyU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgICAgb2JzLm5leHQobmFtZXMubWFwKG5hbWUgPT4gZnJhZ21lbnQobmFtZSkpKTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgb2JzLmVycm9yKGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBleGlzdHMocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgdHJ5K2NhdGNoIHdoZW4gaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zNzQwIGlzXG4gICAgICAvLyBmaXhlZC5cbiAgICAgIHRyeSB7XG4gICAgICAgIG9icy5uZXh0KGZzLmV4aXN0c1N5bmMoZ2V0U3lzdGVtUGF0aChwYXRoKSkpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBvYnMuZXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlzRGlyZWN0b3J5KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm9uLW51bGwtb3BlcmF0b3JcbiAgICByZXR1cm4gdGhpcy5zdGF0KHBhdGgpICEucGlwZShtYXAoc3RhdCA9PiBzdGF0LmlzRGlyZWN0b3J5KCkpKTtcbiAgfVxuICBpc0ZpbGUocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpub24tbnVsbC1vcGVyYXRvclxuICAgIHJldHVybiB0aGlzLnN0YXQocGF0aCkgIS5waXBlKG1hcChzdGF0ID0+IHN0YXQuaXNGaWxlKCkpKTtcbiAgfVxuXG4gIC8vIFNvbWUgaG9zdHMgbWF5IG5vdCBzdXBwb3J0IHN0YXQuXG4gIHN0YXQocGF0aDogUGF0aCk6IE9ic2VydmFibGU8dmlydHVhbEZzLlN0YXRzPGZzLlN0YXRzPj4ge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgdHJ5K2NhdGNoIHdoZW4gaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zNzQwIGlzXG4gICAgICAvLyBmaXhlZC5cbiAgICAgIHRyeSB7XG4gICAgICAgIG9icy5uZXh0KGZzLnN0YXRTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpKTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgb2JzLmVycm9yKGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCB3YXRjaGluZy5cbiAgd2F0Y2goXG4gICAgcGF0aDogUGF0aCxcbiAgICBfb3B0aW9ucz86IHZpcnR1YWxGcy5Ib3N0V2F0Y2hPcHRpb25zLFxuICApOiBPYnNlcnZhYmxlPHZpcnR1YWxGcy5Ib3N0V2F0Y2hFdmVudD4gfCBudWxsIHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8dmlydHVhbEZzLkhvc3RXYXRjaEV2ZW50PihvYnMgPT4ge1xuICAgICAgY29uc3Qgb3B0cyA9IHsgcGVyc2lzdGVudDogZmFsc2UgfTtcbiAgICAgIGNvbnN0IHdhdGNoZXIgPSBuZXcgRlNXYXRjaGVyKG9wdHMpLmFkZChnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcblxuICAgICAgd2F0Y2hlclxuICAgICAgICAub24oJ2NoYW5nZScsIHBhdGggPT4ge1xuICAgICAgICAgIG9icy5uZXh0KHtcbiAgICAgICAgICAgIHBhdGg6IG5vcm1hbGl6ZShwYXRoKSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICB0eXBlOiB2aXJ0dWFsRnMuSG9zdFdhdGNoRXZlbnRUeXBlLkNoYW5nZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgcGF0aCA9PiB7XG4gICAgICAgICAgb2JzLm5leHQoe1xuICAgICAgICAgICAgcGF0aDogbm9ybWFsaXplKHBhdGgpLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHR5cGU6IHZpcnR1YWxGcy5Ib3N0V2F0Y2hFdmVudFR5cGUuQ3JlYXRlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBwYXRoID0+IHtcbiAgICAgICAgICBvYnMubmV4dCh7XG4gICAgICAgICAgICBwYXRoOiBub3JtYWxpemUocGF0aCksXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgdHlwZTogdmlydHVhbEZzLkhvc3RXYXRjaEV2ZW50VHlwZS5EZWxldGVkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuICgpID0+IHdhdGNoZXIuY2xvc2UoKTtcbiAgICB9KS5waXBlKFxuICAgICAgcHVibGlzaCgpLFxuICAgICAgcmVmQ291bnQoKSxcbiAgICApO1xuICB9XG59XG4iXX0=