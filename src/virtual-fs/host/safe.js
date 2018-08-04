"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * A Host that filters out errors. The only exception is `read()` which will still error out if
 * the delegate returned an error (e.g. NodeJS will error out if the file doesn't exist).
 */
class SafeReadonlyHost {
    constructor(_delegate) {
        this._delegate = _delegate;
    }
    get capabilities() {
        return this._delegate.capabilities;
    }
    read(path) {
        return this._delegate.read(path);
    }
    list(path) {
        return this._delegate.list(path).pipe(operators_1.catchError(() => rxjs_1.of([])));
    }
    exists(path) {
        return this._delegate.exists(path);
    }
    isDirectory(path) {
        return this._delegate.isDirectory(path).pipe(operators_1.catchError(() => rxjs_1.of(false)));
    }
    isFile(path) {
        return this._delegate.isFile(path).pipe(operators_1.catchError(() => rxjs_1.of(false)));
    }
    // Some hosts may not support stats.
    stat(path) {
        const maybeStat = this._delegate.stat(path);
        return maybeStat && maybeStat.pipe(operators_1.catchError(() => rxjs_1.of(null)));
    }
}
exports.SafeReadonlyHost = SafeReadonlyHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FmZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3NhZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQkFBc0M7QUFDdEMsOENBQTRDO0FBSTVDOzs7R0FHRztBQUNIO0lBQ0UsWUFBb0IsU0FBK0I7UUFBL0IsY0FBUyxHQUFULFNBQVMsQ0FBc0I7SUFBRyxDQUFDO0lBRXZELElBQUksWUFBWTtRQUNkLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7SUFDckMsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVU7UUFDYixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDbkMsc0JBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDekIsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFVO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUMxQyxzQkFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUM1QixDQUFDO0lBQ0osQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQ3JDLHNCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQzVCLENBQUM7SUFDSixDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFNUMsT0FBTyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FDaEMsc0JBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDM0IsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXZDRCw0Q0F1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFBhdGgsIFBhdGhGcmFnbWVudCB9IGZyb20gJy4uL3BhdGgnO1xuaW1wb3J0IHsgRmlsZUJ1ZmZlciwgSG9zdENhcGFiaWxpdGllcywgUmVhZG9ubHlIb3N0LCBTdGF0cyB9IGZyb20gJy4vaW50ZXJmYWNlJztcblxuLyoqXG4gKiBBIEhvc3QgdGhhdCBmaWx0ZXJzIG91dCBlcnJvcnMuIFRoZSBvbmx5IGV4Y2VwdGlvbiBpcyBgcmVhZCgpYCB3aGljaCB3aWxsIHN0aWxsIGVycm9yIG91dCBpZlxuICogdGhlIGRlbGVnYXRlIHJldHVybmVkIGFuIGVycm9yIChlLmcuIE5vZGVKUyB3aWxsIGVycm9yIG91dCBpZiB0aGUgZmlsZSBkb2Vzbid0IGV4aXN0KS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNhZmVSZWFkb25seUhvc3Q8U3RhdHNUIGV4dGVuZHMgb2JqZWN0ID0ge30+IGltcGxlbWVudHMgUmVhZG9ubHlIb3N0PFN0YXRzVD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9kZWxlZ2F0ZTogUmVhZG9ubHlIb3N0PFN0YXRzVD4pIHt9XG5cbiAgZ2V0IGNhcGFiaWxpdGllcygpOiBIb3N0Q2FwYWJpbGl0aWVzIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUuY2FwYWJpbGl0aWVzO1xuICB9XG5cbiAgcmVhZChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxGaWxlQnVmZmVyPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLnJlYWQocGF0aCk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFBhdGhGcmFnbWVudFtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLmxpc3QocGF0aCkucGlwZShcbiAgICAgIGNhdGNoRXJyb3IoKCkgPT4gb2YoW10pKSxcbiAgICApO1xuICB9XG5cbiAgZXhpc3RzKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUuZXhpc3RzKHBhdGgpO1xuICB9XG4gIGlzRGlyZWN0b3J5KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUuaXNEaXJlY3RvcnkocGF0aCkucGlwZShcbiAgICAgIGNhdGNoRXJyb3IoKCkgPT4gb2YoZmFsc2UpKSxcbiAgICApO1xuICB9XG4gIGlzRmlsZShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLmlzRmlsZShwYXRoKS5waXBlKFxuICAgICAgY2F0Y2hFcnJvcigoKSA9PiBvZihmYWxzZSkpLFxuICAgICk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCBzdGF0cy5cbiAgc3RhdChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxTdGF0czxTdGF0c1Q+IHwgbnVsbD4gfCBudWxsIHtcbiAgICBjb25zdCBtYXliZVN0YXQgPSB0aGlzLl9kZWxlZ2F0ZS5zdGF0KHBhdGgpO1xuXG4gICAgcmV0dXJuIG1heWJlU3RhdCAmJiBtYXliZVN0YXQucGlwZShcbiAgICAgIGNhdGNoRXJyb3IoKCkgPT4gb2YobnVsbCkpLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==