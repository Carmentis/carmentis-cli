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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeygenCommand = void 0;
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = require("node:path");
const inquirer_1 = __importDefault(require("inquirer"));
const client_1 = require("@cmts-dev/carmentis-sdk/client");
class KeygenCommand {
    static register(program) {
        program
            .command('keygen')
            .description('Generate a signing key pair and export it to a file.')
            .option('-o, --output <file>', 'Output file path for the key')
            .option('--format <format>', 'Export format (json)', 'json')
            .option('--type <type>', 'Key type: secp256k1|mldsa', 'secp256k1')
            .action(async (options) => this.run(options).catch((e) => this.handleError(e)));
    }
    static async run(options) {
        const format = (options.format || 'json').toLowerCase();
        const type = (options.type || 'secp256k1').toLowerCase();
        if (format !== 'json') {
            console.error(`Unsupported format: ${options.format}. Only "json" is supported at the moment.`);
            process.exit(1);
        }
        const encoder = client_1.HCVSignatureEncoder.createHexHCVSignatureEncoder();
        let sk;
        let scheme;
        if (type === 'secp256k1') {
            sk = client_1.Secp256k1PrivateSignatureKey.gen();
            scheme = client_1.SignatureAlgorithmId.SECP256K1;
        }
        else if (type === 'mldsa') {
            sk = client_1.MLDSA65PrivateSignatureKey.gen();
            scheme = client_1.SignatureAlgorithmId.ML_DSA_65;
        }
        else {
            console.error(`Unknown key type: ${options.type}. Use "secp256k1" or "mldsa".`);
            process.exit(1);
        }
        const pk = sk.getPublicKey();
        const outJson = {
            privateKey: encoder.encodePrivateKey(sk),
            publicKey: encoder.encodePublicKey(pk),
        };
        const outPath = options.output;
        if (outPath) {
            // Confirm overwrite if file exists
            const exists = await fs
                .access(outPath)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                const { overwrite } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: `Output file "${outPath}" already exists. Overwrite?`,
                        default: false,
                    },
                ]);
                if (!overwrite) {
                    console.log('Operation cancelled.');
                    return;
                }
            }
            await fs.mkdir((0, node_path_1.dirname)(outPath), { recursive: true }).catch(() => { });
            await fs.writeFile(outPath, JSON.stringify(outJson, null, 2), 'utf8');
            console.log(`Key generated and saved to ${outPath}`);
        }
        else {
            console.log(outJson);
        }
    }
    static handleError(e) {
        console.error(e?.message ?? String(e));
        process.exit(1);
    }
}
exports.KeygenCommand = KeygenCommand;
