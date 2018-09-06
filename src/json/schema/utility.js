"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const interface_1 = require("../interface");
const allTypes = ['string', 'integer', 'number', 'object', 'array', 'boolean', 'null'];
function getTypesOfSchema(schema) {
    if (!schema) {
        return new Set();
    }
    if (schema === true) {
        return new Set(allTypes);
    }
    let potentials;
    if (typeof schema.type === 'string') {
        potentials = new Set([schema.type]);
    }
    else if (Array.isArray(schema.type)) {
        potentials = new Set(schema.type);
    }
    else {
        potentials = new Set(allTypes);
    }
    if (interface_1.isJsonObject(schema.not)) {
        const notTypes = getTypesOfSchema(schema.not);
        potentials = new Set([...potentials].filter(p => !notTypes.has(p)));
    }
    if (Array.isArray(schema.allOf)) {
        for (const sub of schema.allOf) {
            const types = getTypesOfSchema(sub);
            potentials = new Set([...potentials].filter(p => types.has(p)));
        }
    }
    if (Array.isArray(schema.oneOf)) {
        let options = new Set();
        for (const sub of schema.oneOf) {
            const types = getTypesOfSchema(sub);
            options = new Set([...options, ...types]);
        }
        potentials = new Set([...potentials].filter(p => options.has(p)));
    }
    if (Array.isArray(schema.anyOf)) {
        let options = new Set();
        for (const sub of schema.anyOf) {
            const types = getTypesOfSchema(sub);
            options = new Set([...options, ...types]);
        }
        potentials = new Set([...potentials].filter(p => options.has(p)));
    }
    if (schema.properties) {
        potentials.add('object');
    }
    else if (schema.items) {
        potentials.add('array');
    }
    return potentials;
}
exports.getTypesOfSchema = getTypesOfSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvanNvbi9zY2hlbWEvdXRpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDRDQUF3RDtBQUd4RCxNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZGLFNBQWdCLGdCQUFnQixDQUFDLE1BQXlCO0lBQ3hELElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPLElBQUksR0FBRyxFQUFFLENBQUM7S0FDbEI7SUFDRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsT0FBTyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMxQjtJQUVELElBQUksVUFBdUIsQ0FBQztJQUM1QixJQUFJLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDbkMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDckM7U0FBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3JDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBZ0IsQ0FBQyxDQUFDO0tBQy9DO1NBQU07UUFDTCxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEM7SUFFRCxJQUFJLHdCQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzVCLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDckU7SUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQy9CLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFpQixDQUFDLENBQUM7WUFDbEQsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqRTtLQUNGO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMvQixJQUFJLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ2hDLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFpQixDQUFDLENBQUM7WUFDbEQsT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzNDO1FBQ0QsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNuRTtJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNoQyxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsR0FBaUIsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMzQztRQUNELFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDckIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMxQjtTQUFNLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pCO0lBRUQsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQXRERCw0Q0FzREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBKc29uT2JqZWN0LCBpc0pzb25PYmplY3QgfSBmcm9tICcuLi9pbnRlcmZhY2UnO1xuXG5cbmNvbnN0IGFsbFR5cGVzID0gWydzdHJpbmcnLCAnaW50ZWdlcicsICdudW1iZXInLCAnb2JqZWN0JywgJ2FycmF5JywgJ2Jvb2xlYW4nLCAnbnVsbCddO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZXNPZlNjaGVtYShzY2hlbWE6IEpzb25PYmplY3QgfCB0cnVlKTogU2V0PHN0cmluZz4ge1xuICBpZiAoIXNjaGVtYSkge1xuICAgIHJldHVybiBuZXcgU2V0KCk7XG4gIH1cbiAgaWYgKHNjaGVtYSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBuZXcgU2V0KGFsbFR5cGVzKTtcbiAgfVxuXG4gIGxldCBwb3RlbnRpYWxzOiBTZXQ8c3RyaW5nPjtcbiAgaWYgKHR5cGVvZiBzY2hlbWEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBwb3RlbnRpYWxzID0gbmV3IFNldChbc2NoZW1hLnR5cGVdKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS50eXBlKSkge1xuICAgIHBvdGVudGlhbHMgPSBuZXcgU2V0KHNjaGVtYS50eXBlIGFzIHN0cmluZ1tdKTtcbiAgfSBlbHNlIHtcbiAgICBwb3RlbnRpYWxzID0gbmV3IFNldChhbGxUeXBlcyk7XG4gIH1cblxuICBpZiAoaXNKc29uT2JqZWN0KHNjaGVtYS5ub3QpKSB7XG4gICAgY29uc3Qgbm90VHlwZXMgPSBnZXRUeXBlc09mU2NoZW1hKHNjaGVtYS5ub3QpO1xuICAgIHBvdGVudGlhbHMgPSBuZXcgU2V0KFsuLi5wb3RlbnRpYWxzXS5maWx0ZXIocCA9PiAhbm90VHlwZXMuaGFzKHApKSk7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBzdWIgb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBjb25zdCB0eXBlcyA9IGdldFR5cGVzT2ZTY2hlbWEoc3ViIGFzIEpzb25PYmplY3QpO1xuICAgICAgcG90ZW50aWFscyA9IG5ldyBTZXQoWy4uLnBvdGVudGlhbHNdLmZpbHRlcihwID0+IHR5cGVzLmhhcyhwKSkpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5vbmVPZikpIHtcbiAgICBsZXQgb3B0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3Qgc3ViIG9mIHNjaGVtYS5vbmVPZikge1xuICAgICAgY29uc3QgdHlwZXMgPSBnZXRUeXBlc09mU2NoZW1hKHN1YiBhcyBKc29uT2JqZWN0KTtcbiAgICAgIG9wdGlvbnMgPSBuZXcgU2V0KFsuLi5vcHRpb25zLCAuLi50eXBlc10pO1xuICAgIH1cbiAgICBwb3RlbnRpYWxzID0gbmV3IFNldChbLi4ucG90ZW50aWFsc10uZmlsdGVyKHAgPT4gb3B0aW9ucy5oYXMocCkpKTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICBsZXQgb3B0aW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3Qgc3ViIG9mIHNjaGVtYS5hbnlPZikge1xuICAgICAgY29uc3QgdHlwZXMgPSBnZXRUeXBlc09mU2NoZW1hKHN1YiBhcyBKc29uT2JqZWN0KTtcbiAgICAgIG9wdGlvbnMgPSBuZXcgU2V0KFsuLi5vcHRpb25zLCAuLi50eXBlc10pO1xuICAgIH1cbiAgICBwb3RlbnRpYWxzID0gbmV3IFNldChbLi4ucG90ZW50aWFsc10uZmlsdGVyKHAgPT4gb3B0aW9ucy5oYXMocCkpKTtcbiAgfVxuXG4gIGlmIChzY2hlbWEucHJvcGVydGllcykge1xuICAgIHBvdGVudGlhbHMuYWRkKCdvYmplY3QnKTtcbiAgfSBlbHNlIGlmIChzY2hlbWEuaXRlbXMpIHtcbiAgICBwb3RlbnRpYWxzLmFkZCgnYXJyYXknKTtcbiAgfVxuXG4gIHJldHVybiBwb3RlbnRpYWxzO1xufVxuIl19