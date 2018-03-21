"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exception_1 = require("../../exception/exception");
class SynchronousDelegateExpectedException extends exception_1.BaseException {
    constructor() { super(`Expected a synchronous delegate but got an asynchronous one.`); }
}
exports.SynchronousDelegateExpectedException = SynchronousDelegateExpectedException;
/**
 * Implement a synchronous-only host interface (remove the Observable parts).
 */
class SyncDelegateHost {
    constructor(_delegate) {
        this._delegate = _delegate;
        if (!_delegate.capabilities.synchronous) {
            throw new SynchronousDelegateExpectedException();
        }
    }
    _doSyncCall(observable) {
        let completed = false;
        let result = undefined;
        let errorResult = undefined;
        observable.subscribe({
            next(x) { result = x; },
            error(err) { errorResult = err; },
            complete() { completed = true; },
        });
        if (errorResult !== undefined) {
            throw errorResult;
        }
        if (!completed) {
            throw new SynchronousDelegateExpectedException();
        }
        // The non-null operation is to work around `void` type. We don't allow to return undefined
        // but ResultT could be void, which is undefined in JavaScript, so this doesn't change the
        // behaviour.
        // tslint:disable-next-line:non-null-operator
        return result;
    }
    get capabilities() {
        return this._delegate.capabilities;
    }
    get delegate() {
        return this._delegate;
    }
    write(path, content) {
        return this._doSyncCall(this._delegate.write(path, content));
    }
    read(path) {
        return this._doSyncCall(this._delegate.read(path));
    }
    delete(path) {
        return this._doSyncCall(this._delegate.delete(path));
    }
    rename(from, to) {
        return this._doSyncCall(this._delegate.rename(from, to));
    }
    list(path) {
        return this._doSyncCall(this._delegate.list(path));
    }
    exists(path) {
        return this._doSyncCall(this._delegate.exists(path));
    }
    isDirectory(path) {
        return this._doSyncCall(this._delegate.isDirectory(path));
    }
    isFile(path) {
        return this._doSyncCall(this._delegate.isFile(path));
    }
    // Some hosts may not support stat.
    stat(path) {
        const result = this._delegate.stat(path);
        if (result) {
            return this._doSyncCall(result);
        }
        else {
            return null;
        }
    }
    watch(path, options) {
        return this._delegate.watch(path, options);
    }
}
exports.SyncDelegateHost = SyncDelegateHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3N5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx5REFBMEQ7QUFZMUQsMENBQWtELFNBQVEseUJBQWE7SUFDckUsZ0JBQWdCLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN6RjtBQUZELG9GQUVDO0FBRUQ7O0dBRUc7QUFDSDtJQUNFLFlBQXNCLFNBQWtCO1FBQWxCLGNBQVMsR0FBVCxTQUFTLENBQVM7UUFDdEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxJQUFJLG9DQUFvQyxFQUFFLENBQUM7UUFDbkQsQ0FBQztJQUNILENBQUM7SUFFUyxXQUFXLENBQVUsVUFBK0I7UUFDNUQsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLElBQUksTUFBTSxHQUF3QixTQUFTLENBQUM7UUFDNUMsSUFBSSxXQUFXLEdBQXNCLFNBQVMsQ0FBQztRQUMvQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ25CLElBQUksQ0FBQyxDQUFVLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsS0FBSyxDQUFDLEdBQVUsSUFBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN4QyxRQUFRLEtBQUssU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDakMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsTUFBTSxXQUFXLENBQUM7UUFDcEIsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNmLE1BQU0sSUFBSSxvQ0FBb0MsRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFRCwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLGFBQWE7UUFDYiw2Q0FBNkM7UUFDN0MsTUFBTSxDQUFDLE1BQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsSUFBSSxZQUFZO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO0lBQ3JDLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQVUsRUFBRSxPQUFtQjtRQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQ0QsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFDRCxNQUFNLENBQUMsSUFBVTtRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVLEVBQUUsRUFBUTtRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFVO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxNQUFNLEdBQWdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsSUFBVSxFQUFFLE9BQTBCO1FBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBL0VELDRDQStFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgUGF0aCwgUGF0aEZyYWdtZW50IH0gZnJvbSAnLi4vcGF0aCc7XG5pbXBvcnQge1xuICBGaWxlQnVmZmVyLFxuICBIb3N0LFxuICBIb3N0Q2FwYWJpbGl0aWVzLFxuICBIb3N0V2F0Y2hFdmVudCxcbiAgSG9zdFdhdGNoT3B0aW9ucyxcbiAgU3RhdHMsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcblxuXG5leHBvcnQgY2xhc3MgU3luY2hyb25vdXNEZWxlZ2F0ZUV4cGVjdGVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcihgRXhwZWN0ZWQgYSBzeW5jaHJvbm91cyBkZWxlZ2F0ZSBidXQgZ290IGFuIGFzeW5jaHJvbm91cyBvbmUuYCk7IH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnQgYSBzeW5jaHJvbm91cy1vbmx5IGhvc3QgaW50ZXJmYWNlIChyZW1vdmUgdGhlIE9ic2VydmFibGUgcGFydHMpLlxuICovXG5leHBvcnQgY2xhc3MgU3luY0RlbGVnYXRlSG9zdDxUIGV4dGVuZHMgb2JqZWN0ID0ge30+IHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9kZWxlZ2F0ZTogSG9zdDxUPikge1xuICAgIGlmICghX2RlbGVnYXRlLmNhcGFiaWxpdGllcy5zeW5jaHJvbm91cykge1xuICAgICAgdGhyb3cgbmV3IFN5bmNocm9ub3VzRGVsZWdhdGVFeHBlY3RlZEV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfZG9TeW5jQ2FsbDxSZXN1bHRUPihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFJlc3VsdFQ+KTogUmVzdWx0VCB7XG4gICAgbGV0IGNvbXBsZXRlZCA9IGZhbHNlO1xuICAgIGxldCByZXN1bHQ6IFJlc3VsdFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgbGV0IGVycm9yUmVzdWx0OiBFcnJvciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBvYnNlcnZhYmxlLnN1YnNjcmliZSh7XG4gICAgICBuZXh0KHg6IFJlc3VsdFQpIHsgcmVzdWx0ID0geDsgfSxcbiAgICAgIGVycm9yKGVycjogRXJyb3IpIHsgZXJyb3JSZXN1bHQgPSBlcnI7IH0sXG4gICAgICBjb21wbGV0ZSgpIHsgY29tcGxldGVkID0gdHJ1ZTsgfSxcbiAgICB9KTtcblxuICAgIGlmIChlcnJvclJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBlcnJvclJlc3VsdDtcbiAgICB9XG4gICAgaWYgKCFjb21wbGV0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBTeW5jaHJvbm91c0RlbGVnYXRlRXhwZWN0ZWRFeGNlcHRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbm9uLW51bGwgb3BlcmF0aW9uIGlzIHRvIHdvcmsgYXJvdW5kIGB2b2lkYCB0eXBlLiBXZSBkb24ndCBhbGxvdyB0byByZXR1cm4gdW5kZWZpbmVkXG4gICAgLy8gYnV0IFJlc3VsdFQgY291bGQgYmUgdm9pZCwgd2hpY2ggaXMgdW5kZWZpbmVkIGluIEphdmFTY3JpcHQsIHNvIHRoaXMgZG9lc24ndCBjaGFuZ2UgdGhlXG4gICAgLy8gYmVoYXZpb3VyLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpub24tbnVsbC1vcGVyYXRvclxuICAgIHJldHVybiByZXN1bHQgITtcbiAgfVxuXG4gIGdldCBjYXBhYmlsaXRpZXMoKTogSG9zdENhcGFiaWxpdGllcyB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLmNhcGFiaWxpdGllcztcbiAgfVxuICBnZXQgZGVsZWdhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlO1xuICB9XG5cbiAgd3JpdGUocGF0aDogUGF0aCwgY29udGVudDogRmlsZUJ1ZmZlcik6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLndyaXRlKHBhdGgsIGNvbnRlbnQpKTtcbiAgfVxuICByZWFkKHBhdGg6IFBhdGgpOiBGaWxlQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZG9TeW5jQ2FsbCh0aGlzLl9kZWxlZ2F0ZS5yZWFkKHBhdGgpKTtcbiAgfVxuICBkZWxldGUocGF0aDogUGF0aCk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmRlbGV0ZShwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IFBhdGgsIHRvOiBQYXRoKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUucmVuYW1lKGZyb20sIHRvKSk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBQYXRoRnJhZ21lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUubGlzdChwYXRoKSk7XG4gIH1cblxuICBleGlzdHMocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmV4aXN0cyhwYXRoKSk7XG4gIH1cbiAgaXNEaXJlY3RvcnkocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmlzRGlyZWN0b3J5KHBhdGgpKTtcbiAgfVxuICBpc0ZpbGUocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmlzRmlsZShwYXRoKSk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCBzdGF0LlxuICBzdGF0KHBhdGg6IFBhdGgpOiBTdGF0czxUPiB8IG51bGwge1xuICAgIGNvbnN0IHJlc3VsdDogT2JzZXJ2YWJsZTxTdGF0czxUPj4gfCBudWxsID0gdGhpcy5fZGVsZWdhdGUuc3RhdChwYXRoKTtcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHdhdGNoKHBhdGg6IFBhdGgsIG9wdGlvbnM/OiBIb3N0V2F0Y2hPcHRpb25zKTogT2JzZXJ2YWJsZTxIb3N0V2F0Y2hFdmVudD4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUud2F0Y2gocGF0aCwgb3B0aW9ucyk7XG4gIH1cbn1cbiJdfQ==