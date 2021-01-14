/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MergeStates, OpenApiTypes, rules } from "../rule"
import { isValidEnum, transformEnum } from "./utilities/rules-helper"
export const UniqueXmsEnumName: string = "UniqueXmsEnumName"
import { nodes,stringify } from "jsonpath"

rules.push({
  id: "R4005",
  name: UniqueXmsEnumName,
  severity: "error",
  category: "SDKViolation",
  mergeState: MergeStates.composed,
  openapiType: OpenApiTypes.arm | OpenApiTypes.dataplane,
  appliesTo_JsonQuery: "$.definitions",
  *run(doc, node, path) {
    const msg: string = `Must not have duplicate name of x-ms-enum extension , make sure every x-ms-enum name unique.`
    if (node) {
      const enumMap = new Map<string, any>()
      for (const section of nodes(node, "$..*[?(@.enum)]")) {
        if (section.value["x-ms-enum"] && isValidEnum(section.value)) {
          const enumName = section.value["x-ms-enum"].name.toLowerCase()
          if (enumMap.has(enumName)) {
            const curEnum =  section.value.enum
            const existingNode = enumMap.get(enumName)
            const existingEnum = existingNode.value.enum
            /**
             * if existing , check if the two enums' entries are same.
             */
            if (
              section.value.type !== existingNode.value.type ||
              section.value["x-ms-enum"].modelAsString !== existingNode.value["x-ms-enum"].modelAsString ||
              existingEnum.length !== curEnum.length ||
              existingEnum.some((value, index) => curEnum[index] !== value)
            ) {
              yield { message: `${msg} The duplicate x-ms-enum name: ${enumName}, path: ${stringify(existingNode.path)}`, location: path.concat(section.path.slice(1)) }
            }
          } else {
            enumMap.set(enumName, section)
          }
        }
      }
    }
  }
})
