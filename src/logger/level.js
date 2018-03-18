"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class LevelTransformLogger extends logger_1.Logger {
    constructor(name, parent = null, levelTransform) {
        super(name, parent);
        this.name = name;
        this.parent = parent;
        this.levelTransform = levelTransform;
    }
    log(level, message, metadata = {}) {
        return super.log(this.levelTransform(level), message, metadata);
    }
    createChild(name) {
        return new LevelTransformLogger(name, this, this.levelTransform);
    }
}
exports.LevelTransformLogger = LevelTransformLogger;
class LevelCapLogger extends LevelTransformLogger {
    constructor(name, parent = null, levelCap) {
        super(name, parent, (level) => {
            return (LevelCapLogger.levelMap[levelCap][level] || level);
        });
        this.name = name;
        this.parent = parent;
        this.levelCap = levelCap;
    }
}
LevelCapLogger.levelMap = {
    debug: { debug: 'debug', info: 'debug', warn: 'debug', error: 'debug', fatal: 'debug' },
    info: { debug: 'debug', info: 'info', warn: 'info', error: 'info', fatal: 'info' },
    warn: { debug: 'debug', info: 'info', warn: 'warn', error: 'warn', fatal: 'warn' },
    error: { debug: 'debug', info: 'info', warn: 'warn', error: 'error', fatal: 'error' },
    fatal: { debug: 'debug', info: 'info', warn: 'warn', error: 'error', fatal: 'fatal' },
};
exports.LevelCapLogger = LevelCapLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV2ZWwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2xvZ2dlci9sZXZlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLHFDQUE0QztBQUU1QywwQkFBa0MsU0FBUSxlQUFNO0lBQzlDLFlBQ2tCLElBQVksRUFDWixTQUF3QixJQUFJLEVBQzVCLGNBQTZDO1FBRTdELEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFKSixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBc0I7UUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQStCO0lBRy9ELENBQUM7SUFFRCxHQUFHLENBQUMsS0FBZSxFQUFFLE9BQWUsRUFBRSxXQUF1QixFQUFFO1FBQzdELE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBWTtRQUN0QixNQUFNLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFoQkQsb0RBZ0JDO0FBRUQsb0JBQTRCLFNBQVEsb0JBQW9CO0lBU3RELFlBQ2tCLElBQVksRUFDWixTQUF3QixJQUFJLEVBQzVCLFFBQWtCO1FBRWxDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsS0FBZSxFQUFFLEVBQUU7WUFDdEMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQWEsQ0FBQztRQUN6RSxDQUFDLENBQUMsQ0FBQztRQU5hLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixXQUFNLEdBQU4sTUFBTSxDQUFzQjtRQUM1QixhQUFRLEdBQVIsUUFBUSxDQUFVO0lBS3BDLENBQUM7O0FBaEJNLHVCQUFRLEdBQStDO0lBQzVELEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtJQUN2RixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDbEYsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO0lBQ2xGLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtJQUNyRixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7Q0FDdEYsQ0FBQztBQVBKLHdDQWtCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEpzb25PYmplY3QgfSBmcm9tICcuLi9qc29uL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBMb2dMZXZlbCwgTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuXG5leHBvcnQgY2xhc3MgTGV2ZWxUcmFuc2Zvcm1Mb2dnZXIgZXh0ZW5kcyBMb2dnZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBwYXJlbnQ6IExvZ2dlciB8IG51bGwgPSBudWxsLFxuICAgIHB1YmxpYyByZWFkb25seSBsZXZlbFRyYW5zZm9ybTogKGxldmVsOiBMb2dMZXZlbCkgPT4gTG9nTGV2ZWwsXG4gICkge1xuICAgIHN1cGVyKG5hbWUsIHBhcmVudCk7XG4gIH1cblxuICBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhOiBKc29uT2JqZWN0ID0ge30pOiB2b2lkIHtcbiAgICByZXR1cm4gc3VwZXIubG9nKHRoaXMubGV2ZWxUcmFuc2Zvcm0obGV2ZWwpLCBtZXNzYWdlLCBtZXRhZGF0YSk7XG4gIH1cblxuICBjcmVhdGVDaGlsZChuYW1lOiBzdHJpbmcpOiBMb2dnZXIge1xuICAgIHJldHVybiBuZXcgTGV2ZWxUcmFuc2Zvcm1Mb2dnZXIobmFtZSwgdGhpcywgdGhpcy5sZXZlbFRyYW5zZm9ybSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExldmVsQ2FwTG9nZ2VyIGV4dGVuZHMgTGV2ZWxUcmFuc2Zvcm1Mb2dnZXIge1xuICBzdGF0aWMgbGV2ZWxNYXA6IHtbY2FwOiBzdHJpbmddOiB7W2xldmVsOiBzdHJpbmddOiBzdHJpbmd9fSA9IHtcbiAgICBkZWJ1ZzogeyBkZWJ1ZzogJ2RlYnVnJywgaW5mbzogJ2RlYnVnJywgd2FybjogJ2RlYnVnJywgZXJyb3I6ICdkZWJ1ZycsIGZhdGFsOiAnZGVidWcnIH0sXG4gICAgaW5mbzogeyBkZWJ1ZzogJ2RlYnVnJywgaW5mbzogJ2luZm8nLCB3YXJuOiAnaW5mbycsIGVycm9yOiAnaW5mbycsIGZhdGFsOiAnaW5mbycgfSxcbiAgICB3YXJuOiB7IGRlYnVnOiAnZGVidWcnLCBpbmZvOiAnaW5mbycsIHdhcm46ICd3YXJuJywgZXJyb3I6ICd3YXJuJywgZmF0YWw6ICd3YXJuJyB9LFxuICAgIGVycm9yOiB7IGRlYnVnOiAnZGVidWcnLCBpbmZvOiAnaW5mbycsIHdhcm46ICd3YXJuJywgZXJyb3I6ICdlcnJvcicsIGZhdGFsOiAnZXJyb3InIH0sXG4gICAgZmF0YWw6IHsgZGVidWc6ICdkZWJ1ZycsIGluZm86ICdpbmZvJywgd2FybjogJ3dhcm4nLCBlcnJvcjogJ2Vycm9yJywgZmF0YWw6ICdmYXRhbCcgfSxcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBwYXJlbnQ6IExvZ2dlciB8IG51bGwgPSBudWxsLFxuICAgIHB1YmxpYyByZWFkb25seSBsZXZlbENhcDogTG9nTGV2ZWwsXG4gICkge1xuICAgIHN1cGVyKG5hbWUsIHBhcmVudCwgKGxldmVsOiBMb2dMZXZlbCkgPT4ge1xuICAgICAgcmV0dXJuIChMZXZlbENhcExvZ2dlci5sZXZlbE1hcFtsZXZlbENhcF1bbGV2ZWxdIHx8IGxldmVsKSBhcyBMb2dMZXZlbDtcbiAgICB9KTtcbiAgfVxufVxuIl19