"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeReadonlyHost = void 0;
const rxjs_1 = require("rxjs");
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
        return this._delegate.list(path).pipe((0, rxjs_1.catchError)(() => (0, rxjs_1.of)([])));
    }
    exists(path) {
        return this._delegate.exists(path);
    }
    isDirectory(path) {
        return this._delegate.isDirectory(path).pipe((0, rxjs_1.catchError)(() => (0, rxjs_1.of)(false)));
    }
    isFile(path) {
        return this._delegate.isFile(path).pipe((0, rxjs_1.catchError)(() => (0, rxjs_1.of)(false)));
    }
    // Some hosts may not support stats.
    stat(path) {
        const maybeStat = this._delegate.stat(path);
        return maybeStat && maybeStat.pipe((0, rxjs_1.catchError)(() => (0, rxjs_1.of)(null)));
    }
}
exports.SafeReadonlyHost = SafeReadonlyHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3ZpcnR1YWwtZnMvaG9zdC9zYWZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUFrRDtBQUlsRDs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUMzQixZQUFvQixTQUErQjtRQUEvQixjQUFTLEdBQVQsU0FBUyxDQUFzQjtJQUFHLENBQUM7SUFFdkQsSUFBSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztJQUNyQyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVU7UUFDYixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxJQUFJLENBQUMsSUFBVTtRQUNiLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUEsaUJBQVUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLFNBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBQ0QsV0FBVyxDQUFDLElBQVU7UUFDcEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBQSxpQkFBVSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsU0FBRSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVU7UUFDZixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFBLGlCQUFVLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxTQUFFLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxvQ0FBb0M7SUFDcEMsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU1QyxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEsaUJBQVUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLFNBQUUsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztDQUNGO0FBL0JELDRDQStCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjYXRjaEVycm9yLCBvZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgUGF0aCwgUGF0aEZyYWdtZW50IH0gZnJvbSAnLi4vcGF0aCc7XG5pbXBvcnQgeyBGaWxlQnVmZmVyLCBIb3N0Q2FwYWJpbGl0aWVzLCBSZWFkb25seUhvc3QsIFN0YXRzIH0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG4vKipcbiAqIEEgSG9zdCB0aGF0IGZpbHRlcnMgb3V0IGVycm9ycy4gVGhlIG9ubHkgZXhjZXB0aW9uIGlzIGByZWFkKClgIHdoaWNoIHdpbGwgc3RpbGwgZXJyb3Igb3V0IGlmXG4gKiB0aGUgZGVsZWdhdGUgcmV0dXJuZWQgYW4gZXJyb3IgKGUuZy4gTm9kZUpTIHdpbGwgZXJyb3Igb3V0IGlmIHRoZSBmaWxlIGRvZXNuJ3QgZXhpc3QpLlxuICovXG5leHBvcnQgY2xhc3MgU2FmZVJlYWRvbmx5SG9zdDxTdGF0c1QgZXh0ZW5kcyBvYmplY3QgPSB7fT4gaW1wbGVtZW50cyBSZWFkb25seUhvc3Q8U3RhdHNUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RlbGVnYXRlOiBSZWFkb25seUhvc3Q8U3RhdHNUPikge31cblxuICBnZXQgY2FwYWJpbGl0aWVzKCk6IEhvc3RDYXBhYmlsaXRpZXMge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5jYXBhYmlsaXRpZXM7XG4gIH1cblxuICByZWFkKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPEZpbGVCdWZmZXI+IHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUucmVhZChwYXRoKTtcbiAgfVxuXG4gIGxpc3QocGF0aDogUGF0aCk6IE9ic2VydmFibGU8UGF0aEZyYWdtZW50W10+IHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUubGlzdChwYXRoKS5waXBlKGNhdGNoRXJyb3IoKCkgPT4gb2YoW10pKSk7XG4gIH1cblxuICBleGlzdHMocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5leGlzdHMocGF0aCk7XG4gIH1cbiAgaXNEaXJlY3RvcnkocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5pc0RpcmVjdG9yeShwYXRoKS5waXBlKGNhdGNoRXJyb3IoKCkgPT4gb2YoZmFsc2UpKSk7XG4gIH1cbiAgaXNGaWxlKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUuaXNGaWxlKHBhdGgpLnBpcGUoY2F0Y2hFcnJvcigoKSA9PiBvZihmYWxzZSkpKTtcbiAgfVxuXG4gIC8vIFNvbWUgaG9zdHMgbWF5IG5vdCBzdXBwb3J0IHN0YXRzLlxuICBzdGF0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFN0YXRzPFN0YXRzVD4gfCBudWxsPiB8IG51bGwge1xuICAgIGNvbnN0IG1heWJlU3RhdCA9IHRoaXMuX2RlbGVnYXRlLnN0YXQocGF0aCk7XG5cbiAgICByZXR1cm4gbWF5YmVTdGF0ICYmIG1heWJlU3RhdC5waXBlKGNhdGNoRXJyb3IoKCkgPT4gb2YobnVsbCkpKTtcbiAgfVxufVxuIl19