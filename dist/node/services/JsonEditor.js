"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonEditor = void 0;
const fs = __importStar(require("fs"));
class JsonEditor {
    constructor(path) {
        this.path = path;
    }
    write(propertyPath, value) {
        // Step 1: Read the file
        const raw = fs.readFileSync(this.path, 'utf-8');
        const json = JSON.parse(raw);
        // Step 2: Navigate and update the property
        let current = json;
        for (let i = 0; i < propertyPath.length - 1; i++) {
            const key = propertyPath[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        // Step 3: Set the final value
        current[propertyPath[propertyPath.length - 1]] = value;
        // Step 4: Write back to the file (pretty-printed)
        fs.writeFileSync(this.path, JSON.stringify(json, null, 2), 'utf-8');
    }
}
exports.JsonEditor = JsonEditor;
