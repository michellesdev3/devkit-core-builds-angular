"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonWorkspace = void 0;
const jsonc_parser_1 = require("jsonc-parser");
const metadata_1 = require("./metadata");
async function writeJsonWorkspace(workspace, host, path, options = {}) {
    const metadata = workspace[metadata_1.JsonWorkspaceSymbol];
    if (metadata) {
        if (!metadata.hasChanges) {
            return;
        }
        // update existing JSON workspace
        const data = updateJsonWorkspace(metadata);
        return host.writeFile(path ?? metadata.filePath, data);
    }
    else {
        // serialize directly
        if (!path) {
            throw new Error('path option is required');
        }
        const obj = convertJsonWorkspace(workspace, options.schema);
        const data = JSON.stringify(obj, null, 2);
        return host.writeFile(path, data);
    }
}
exports.writeJsonWorkspace = writeJsonWorkspace;
function convertJsonWorkspace(workspace, schema) {
    const obj = {
        $schema: schema || './node_modules/@angular/cli/lib/config/schema.json',
        version: 1,
        ...workspace.extensions,
        ...(isEmpty(workspace.projects)
            ? {}
            : { projects: convertJsonProjectCollection(workspace.projects) }),
    };
    return obj;
}
function convertJsonProjectCollection(collection) {
    const projects = Object.create(null);
    for (const [projectName, project] of collection) {
        projects[projectName] = convertJsonProject(project);
    }
    return projects;
}
function convertJsonProject(project) {
    let targets;
    if (project.targets.size > 0) {
        targets = Object.create(null);
        for (const [targetName, target] of project.targets) {
            targets[targetName] = convertJsonTarget(target);
        }
    }
    const obj = {
        ...project.extensions,
        root: project.root,
        ...(project.sourceRoot === undefined ? {} : { sourceRoot: project.sourceRoot }),
        ...(project.prefix === undefined ? {} : { prefix: project.prefix }),
        ...(targets === undefined ? {} : { architect: targets }),
    };
    return obj;
}
function isEmpty(obj) {
    return obj === undefined || Object.keys(obj).length === 0;
}
function convertJsonTarget(target) {
    return {
        builder: target.builder,
        ...(isEmpty(target.options) ? {} : { options: target.options }),
        ...(isEmpty(target.configurations)
            ? {}
            : { configurations: target.configurations }),
        ...(target.defaultConfiguration === undefined
            ? {}
            : { defaultConfiguration: target.defaultConfiguration }),
    };
}
function convertJsonTargetCollection(collection) {
    const targets = Object.create(null);
    for (const [projectName, target] of collection) {
        targets[projectName] = convertJsonTarget(target);
    }
    return targets;
}
function normalizeValue(value, type) {
    if (value === undefined) {
        return undefined;
    }
    switch (type) {
        case 'project':
            return convertJsonProject(value);
        case 'projectcollection':
            const projects = convertJsonProjectCollection(value);
            return isEmpty(projects) ? undefined : projects;
        case 'target':
            return convertJsonTarget(value);
        case 'targetcollection':
            const targets = convertJsonTargetCollection(value);
            return isEmpty(targets) ? undefined : targets;
        default:
            return value;
    }
}
function updateJsonWorkspace(metadata) {
    let { raw: content } = metadata;
    const { changes, hasLegacyTargetsName } = metadata;
    for (const { jsonPath, value, type } of changes.values()) {
        // Determine which key to use if (architect or targets)
        if (hasLegacyTargetsName && jsonPath[2] === 'targets') {
            jsonPath[2] = 'architect';
        }
        // TODO: `modify` re-parses the content every time.
        // See: https://github.com/microsoft/node-jsonc-parser/blob/35d94cd71bd48f9784453b2439262c938e21d49b/src/impl/edit.ts#L18
        // Ideally this should accept a string or an AST to avoid the potentially expensive repeat parsing operation.
        const edits = (0, jsonc_parser_1.modify)(content, jsonPath, normalizeValue(value, type), {
            formattingOptions: {
                insertSpaces: true,
                tabSize: 2,
            },
        });
        content = (0, jsonc_parser_1.applyEdits)(content, edits);
    }
    return content;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvd29ya3NwYWNlL2pzb24vd3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFrRDtBQUlsRCx5Q0FLb0I7QUFFYixLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLFNBQThCLEVBQzlCLElBQW1CLEVBQ25CLElBQWEsRUFDYixVQUVJLEVBQUU7SUFFTixNQUFNLFFBQVEsR0FBSSxTQUFxQyxDQUFDLDhCQUFtQixDQUFDLENBQUM7SUFFN0UsSUFBSSxRQUFRLEVBQUU7UUFDWixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtZQUN4QixPQUFPO1NBQ1I7UUFDRCxpQ0FBaUM7UUFDakMsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFM0MsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3hEO1NBQU07UUFDTCxxQkFBcUI7UUFDckIsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUM1QztRQUVELE1BQU0sR0FBRyxHQUFHLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbkM7QUFDSCxDQUFDO0FBN0JELGdEQTZCQztBQUVELFNBQVMsb0JBQW9CLENBQUMsU0FBOEIsRUFBRSxNQUFlO0lBQzNFLE1BQU0sR0FBRyxHQUFHO1FBQ1YsT0FBTyxFQUFFLE1BQU0sSUFBSSxvREFBb0Q7UUFDdkUsT0FBTyxFQUFFLENBQUM7UUFDVixHQUFHLFNBQVMsQ0FBQyxVQUFVO1FBQ3ZCLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUM3QixDQUFDLENBQUMsRUFBRTtZQUNKLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztLQUNwRSxDQUFDO0lBRUYsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsU0FBUyw0QkFBNEIsQ0FDbkMsVUFBaUQ7SUFFakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQWUsQ0FBQztJQUVuRCxLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLElBQUksVUFBVSxFQUFFO1FBQy9DLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyRDtJQUVELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE9BQTBCO0lBQ3BELElBQUksT0FBK0IsQ0FBQztJQUNwQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtRQUM1QixPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQWUsQ0FBQztRQUM1QyxLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNsRCxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakQ7S0FDRjtJQUVELE1BQU0sR0FBRyxHQUFHO1FBQ1YsR0FBRyxPQUFPLENBQUMsVUFBVTtRQUNyQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7UUFDbEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvRSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25FLEdBQUcsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDO0tBQ3pELENBQUM7SUFFRixPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxHQUF1QjtJQUN0QyxPQUFPLEdBQUcsS0FBSyxTQUFTLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE1BQXdCO0lBQ2pELE9BQU87UUFDTCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87UUFDdkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQXFCLEVBQUUsQ0FBQztRQUM3RSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7WUFDaEMsQ0FBQyxDQUFDLEVBQUU7WUFDSixDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLGNBQTRCLEVBQUUsQ0FBQztRQUM1RCxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixLQUFLLFNBQVM7WUFDM0MsQ0FBQyxDQUFDLEVBQUU7WUFDSixDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztLQUMzRCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsMkJBQTJCLENBQUMsVUFBZ0Q7SUFDbkYsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQWUsQ0FBQztJQUVsRCxLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksVUFBVSxFQUFFO1FBQzlDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNsRDtJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FDckIsS0FBc0MsRUFDdEMsSUFBd0I7SUFFeEIsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsUUFBUSxJQUFJLEVBQUU7UUFDWixLQUFLLFNBQVM7WUFDWixPQUFPLGtCQUFrQixDQUFDLEtBQTBCLENBQUMsQ0FBQztRQUN4RCxLQUFLLG1CQUFtQjtZQUN0QixNQUFNLFFBQVEsR0FBRyw0QkFBNEIsQ0FBQyxLQUE4QyxDQUFDLENBQUM7WUFFOUYsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ2xELEtBQUssUUFBUTtZQUNYLE9BQU8saUJBQWlCLENBQUMsS0FBeUIsQ0FBQyxDQUFDO1FBQ3RELEtBQUssa0JBQWtCO1lBQ3JCLE1BQU0sT0FBTyxHQUFHLDJCQUEyQixDQUFDLEtBQTZDLENBQUMsQ0FBQztZQUUzRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDaEQ7WUFDRSxPQUFPLEtBQWtCLENBQUM7S0FDN0I7QUFDSCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxRQUErQjtJQUMxRCxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLFFBQVEsQ0FBQztJQUNoQyxNQUFNLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLEdBQUcsUUFBUSxDQUFDO0lBRW5ELEtBQUssTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ3hELHVEQUF1RDtRQUN2RCxJQUFJLG9CQUFvQixJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDckQsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQztTQUMzQjtRQUVELG1EQUFtRDtRQUNuRCx5SEFBeUg7UUFDekgsNkdBQTZHO1FBQzdHLE1BQU0sS0FBSyxHQUFHLElBQUEscUJBQU0sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDbkUsaUJBQWlCLEVBQUU7Z0JBQ2pCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixPQUFPLEVBQUUsQ0FBQzthQUNYO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLElBQUEseUJBQVUsRUFBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDdEM7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGFwcGx5RWRpdHMsIG1vZGlmeSB9IGZyb20gJ2pzb25jLXBhcnNlcic7XG5pbXBvcnQgeyBKc29uT2JqZWN0LCBKc29uVmFsdWUgfSBmcm9tICcuLi8uLi9qc29uJztcbmltcG9ydCB7IFByb2plY3REZWZpbml0aW9uLCBUYXJnZXREZWZpbml0aW9uLCBXb3Jrc3BhY2VEZWZpbml0aW9uIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMnO1xuaW1wb3J0IHsgV29ya3NwYWNlSG9zdCB9IGZyb20gJy4uL2hvc3QnO1xuaW1wb3J0IHtcbiAgSnNvbkNoYW5nZSxcbiAgSnNvbldvcmtzcGFjZURlZmluaXRpb24sXG4gIEpzb25Xb3Jrc3BhY2VNZXRhZGF0YSxcbiAgSnNvbldvcmtzcGFjZVN5bWJvbCxcbn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUpzb25Xb3Jrc3BhY2UoXG4gIHdvcmtzcGFjZTogV29ya3NwYWNlRGVmaW5pdGlvbixcbiAgaG9zdDogV29ya3NwYWNlSG9zdCxcbiAgcGF0aD86IHN0cmluZyxcbiAgb3B0aW9uczoge1xuICAgIHNjaGVtYT86IHN0cmluZztcbiAgfSA9IHt9LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG1ldGFkYXRhID0gKHdvcmtzcGFjZSBhcyBKc29uV29ya3NwYWNlRGVmaW5pdGlvbilbSnNvbldvcmtzcGFjZVN5bWJvbF07XG5cbiAgaWYgKG1ldGFkYXRhKSB7XG4gICAgaWYgKCFtZXRhZGF0YS5oYXNDaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHVwZGF0ZSBleGlzdGluZyBKU09OIHdvcmtzcGFjZVxuICAgIGNvbnN0IGRhdGEgPSB1cGRhdGVKc29uV29ya3NwYWNlKG1ldGFkYXRhKTtcblxuICAgIHJldHVybiBob3N0LndyaXRlRmlsZShwYXRoID8/IG1ldGFkYXRhLmZpbGVQYXRoLCBkYXRhKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBzZXJpYWxpemUgZGlyZWN0bHlcbiAgICBpZiAoIXBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGF0aCBvcHRpb24gaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBvYmogPSBjb252ZXJ0SnNvbldvcmtzcGFjZSh3b3Jrc3BhY2UsIG9wdGlvbnMuc2NoZW1hKTtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKTtcblxuICAgIHJldHVybiBob3N0LndyaXRlRmlsZShwYXRoLCBkYXRhKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0SnNvbldvcmtzcGFjZSh3b3Jrc3BhY2U6IFdvcmtzcGFjZURlZmluaXRpb24sIHNjaGVtYT86IHN0cmluZyk6IEpzb25PYmplY3Qge1xuICBjb25zdCBvYmogPSB7XG4gICAgJHNjaGVtYTogc2NoZW1hIHx8ICcuL25vZGVfbW9kdWxlcy9AYW5ndWxhci9jbGkvbGliL2NvbmZpZy9zY2hlbWEuanNvbicsXG4gICAgdmVyc2lvbjogMSxcbiAgICAuLi53b3Jrc3BhY2UuZXh0ZW5zaW9ucyxcbiAgICAuLi4oaXNFbXB0eSh3b3Jrc3BhY2UucHJvamVjdHMpXG4gICAgICA/IHt9XG4gICAgICA6IHsgcHJvamVjdHM6IGNvbnZlcnRKc29uUHJvamVjdENvbGxlY3Rpb24od29ya3NwYWNlLnByb2plY3RzKSB9KSxcbiAgfTtcblxuICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SnNvblByb2plY3RDb2xsZWN0aW9uKFxuICBjb2xsZWN0aW9uOiBJdGVyYWJsZTxbc3RyaW5nLCBQcm9qZWN0RGVmaW5pdGlvbl0+LFxuKTogSnNvbk9iamVjdCB7XG4gIGNvbnN0IHByb2plY3RzID0gT2JqZWN0LmNyZWF0ZShudWxsKSBhcyBKc29uT2JqZWN0O1xuXG4gIGZvciAoY29uc3QgW3Byb2plY3ROYW1lLCBwcm9qZWN0XSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgcHJvamVjdHNbcHJvamVjdE5hbWVdID0gY29udmVydEpzb25Qcm9qZWN0KHByb2plY3QpO1xuICB9XG5cbiAgcmV0dXJuIHByb2plY3RzO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SnNvblByb2plY3QocHJvamVjdDogUHJvamVjdERlZmluaXRpb24pOiBKc29uT2JqZWN0IHtcbiAgbGV0IHRhcmdldHM6IEpzb25PYmplY3QgfCB1bmRlZmluZWQ7XG4gIGlmIChwcm9qZWN0LnRhcmdldHMuc2l6ZSA+IDApIHtcbiAgICB0YXJnZXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKSBhcyBKc29uT2JqZWN0O1xuICAgIGZvciAoY29uc3QgW3RhcmdldE5hbWUsIHRhcmdldF0gb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICB0YXJnZXRzW3RhcmdldE5hbWVdID0gY29udmVydEpzb25UYXJnZXQodGFyZ2V0KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBvYmogPSB7XG4gICAgLi4ucHJvamVjdC5leHRlbnNpb25zLFxuICAgIHJvb3Q6IHByb2plY3Qucm9vdCxcbiAgICAuLi4ocHJvamVjdC5zb3VyY2VSb290ID09PSB1bmRlZmluZWQgPyB7fSA6IHsgc291cmNlUm9vdDogcHJvamVjdC5zb3VyY2VSb290IH0pLFxuICAgIC4uLihwcm9qZWN0LnByZWZpeCA9PT0gdW5kZWZpbmVkID8ge30gOiB7IHByZWZpeDogcHJvamVjdC5wcmVmaXggfSksXG4gICAgLi4uKHRhcmdldHMgPT09IHVuZGVmaW5lZCA/IHt9IDogeyBhcmNoaXRlY3Q6IHRhcmdldHMgfSksXG4gIH07XG5cbiAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gaXNFbXB0eShvYmo6IG9iamVjdCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gb2JqID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRKc29uVGFyZ2V0KHRhcmdldDogVGFyZ2V0RGVmaW5pdGlvbik6IEpzb25PYmplY3Qge1xuICByZXR1cm4ge1xuICAgIGJ1aWxkZXI6IHRhcmdldC5idWlsZGVyLFxuICAgIC4uLihpc0VtcHR5KHRhcmdldC5vcHRpb25zKSA/IHt9IDogeyBvcHRpb25zOiB0YXJnZXQub3B0aW9ucyBhcyBKc29uT2JqZWN0IH0pLFxuICAgIC4uLihpc0VtcHR5KHRhcmdldC5jb25maWd1cmF0aW9ucylcbiAgICAgID8ge31cbiAgICAgIDogeyBjb25maWd1cmF0aW9uczogdGFyZ2V0LmNvbmZpZ3VyYXRpb25zIGFzIEpzb25PYmplY3QgfSksXG4gICAgLi4uKHRhcmdldC5kZWZhdWx0Q29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkXG4gICAgICA/IHt9XG4gICAgICA6IHsgZGVmYXVsdENvbmZpZ3VyYXRpb246IHRhcmdldC5kZWZhdWx0Q29uZmlndXJhdGlvbiB9KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEpzb25UYXJnZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb246IEl0ZXJhYmxlPFtzdHJpbmcsIFRhcmdldERlZmluaXRpb25dPik6IEpzb25PYmplY3Qge1xuICBjb25zdCB0YXJnZXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKSBhcyBKc29uT2JqZWN0O1xuXG4gIGZvciAoY29uc3QgW3Byb2plY3ROYW1lLCB0YXJnZXRdIG9mIGNvbGxlY3Rpb24pIHtcbiAgICB0YXJnZXRzW3Byb2plY3ROYW1lXSA9IGNvbnZlcnRKc29uVGFyZ2V0KHRhcmdldCk7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0cztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUoXG4gIHZhbHVlOiBKc29uQ2hhbmdlWyd2YWx1ZSddIHwgdW5kZWZpbmVkLFxuICB0eXBlOiBKc29uQ2hhbmdlWyd0eXBlJ10sXG4pOiBKc29uVmFsdWUgfCB1bmRlZmluZWQge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICdwcm9qZWN0JzpcbiAgICAgIHJldHVybiBjb252ZXJ0SnNvblByb2plY3QodmFsdWUgYXMgUHJvamVjdERlZmluaXRpb24pO1xuICAgIGNhc2UgJ3Byb2plY3Rjb2xsZWN0aW9uJzpcbiAgICAgIGNvbnN0IHByb2plY3RzID0gY29udmVydEpzb25Qcm9qZWN0Q29sbGVjdGlvbih2YWx1ZSBhcyBJdGVyYWJsZTxbc3RyaW5nLCBQcm9qZWN0RGVmaW5pdGlvbl0+KTtcblxuICAgICAgcmV0dXJuIGlzRW1wdHkocHJvamVjdHMpID8gdW5kZWZpbmVkIDogcHJvamVjdHM7XG4gICAgY2FzZSAndGFyZ2V0JzpcbiAgICAgIHJldHVybiBjb252ZXJ0SnNvblRhcmdldCh2YWx1ZSBhcyBUYXJnZXREZWZpbml0aW9uKTtcbiAgICBjYXNlICd0YXJnZXRjb2xsZWN0aW9uJzpcbiAgICAgIGNvbnN0IHRhcmdldHMgPSBjb252ZXJ0SnNvblRhcmdldENvbGxlY3Rpb24odmFsdWUgYXMgSXRlcmFibGU8W3N0cmluZywgVGFyZ2V0RGVmaW5pdGlvbl0+KTtcblxuICAgICAgcmV0dXJuIGlzRW1wdHkodGFyZ2V0cykgPyB1bmRlZmluZWQgOiB0YXJnZXRzO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdmFsdWUgYXMgSnNvblZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUpzb25Xb3Jrc3BhY2UobWV0YWRhdGE6IEpzb25Xb3Jrc3BhY2VNZXRhZGF0YSk6IHN0cmluZyB7XG4gIGxldCB7IHJhdzogY29udGVudCB9ID0gbWV0YWRhdGE7XG4gIGNvbnN0IHsgY2hhbmdlcywgaGFzTGVnYWN5VGFyZ2V0c05hbWUgfSA9IG1ldGFkYXRhO1xuXG4gIGZvciAoY29uc3QgeyBqc29uUGF0aCwgdmFsdWUsIHR5cGUgfSBvZiBjaGFuZ2VzLnZhbHVlcygpKSB7XG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGtleSB0byB1c2UgaWYgKGFyY2hpdGVjdCBvciB0YXJnZXRzKVxuICAgIGlmIChoYXNMZWdhY3lUYXJnZXRzTmFtZSAmJiBqc29uUGF0aFsyXSA9PT0gJ3RhcmdldHMnKSB7XG4gICAgICBqc29uUGF0aFsyXSA9ICdhcmNoaXRlY3QnO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGBtb2RpZnlgIHJlLXBhcnNlcyB0aGUgY29udGVudCBldmVyeSB0aW1lLlxuICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9ub2RlLWpzb25jLXBhcnNlci9ibG9iLzM1ZDk0Y2Q3MWJkNDhmOTc4NDQ1M2IyNDM5MjYyYzkzOGUyMWQ0OWIvc3JjL2ltcGwvZWRpdC50cyNMMThcbiAgICAvLyBJZGVhbGx5IHRoaXMgc2hvdWxkIGFjY2VwdCBhIHN0cmluZyBvciBhbiBBU1QgdG8gYXZvaWQgdGhlIHBvdGVudGlhbGx5IGV4cGVuc2l2ZSByZXBlYXQgcGFyc2luZyBvcGVyYXRpb24uXG4gICAgY29uc3QgZWRpdHMgPSBtb2RpZnkoY29udGVudCwganNvblBhdGgsIG5vcm1hbGl6ZVZhbHVlKHZhbHVlLCB0eXBlKSwge1xuICAgICAgZm9ybWF0dGluZ09wdGlvbnM6IHtcbiAgICAgICAgaW5zZXJ0U3BhY2VzOiB0cnVlLFxuICAgICAgICB0YWJTaXplOiAyLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnRlbnQgPSBhcHBseUVkaXRzKGNvbnRlbnQsIGVkaXRzKTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuIl19