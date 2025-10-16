import * as fs from 'node:fs/promises';
import { dirname } from 'node:path';
import inquirer from 'inquirer';
import commander from 'commander';
import {
    HCVSignatureEncoder,
    Secp256k1PrivateSignatureKey,
    MLDSA65PrivateSignatureKey,
    SignatureAlgorithmId,
    type PrivateSignatureKey,
} from '@cmts-dev/carmentis-sdk/client';

export class KeygenCommand {
    register(program: commander.Command) {
        program
            .command('keygen')
            .description('Generate a signing key pair and export it to a file.')
            .option('-o, --output <file>', 'Output file path for the key')
            .option('--format <format>', 'Export format (json)', 'json')
            .option('--type <type>', 'Key type: secp256k1|mldsa', 'secp256k1')
            .action(async (options) => this.run(options).catch((e) => this.handleError(e)));
    }

    private async run(options: { output: string; format: string; type: string }) {
        const format = (options.format || 'json').toLowerCase();
        const type = (options.type || 'secp256k1').toLowerCase();
        if (format !== 'json') {
            console.error(
                `Unsupported format: ${options.format}. Only "json" is supported at the moment.`,
            );
            process.exit(1);
        }

        const encoder = HCVSignatureEncoder.createHexHCVSignatureEncoder();

        let sk: PrivateSignatureKey;
        let scheme: SignatureAlgorithmId;

        if (type === 'secp256k1') {
            sk = Secp256k1PrivateSignatureKey.gen();
            scheme = SignatureAlgorithmId.SECP256K1;
        } else if (type === 'mldsa') {
            sk = MLDSA65PrivateSignatureKey.gen();
            scheme = SignatureAlgorithmId.ML_DSA_65;
        } else {
            console.error(`Unknown key type: ${options.type}. Use "secp256k1" or "mldsa".`);
            process.exit(1);
        }

        const pk = sk.getPublicKey();

        const outJson = {
            privateKey: encoder.encodePrivateKey(sk),
            publicKey: encoder.encodePublicKey(pk),
        } as const;

        const outPath = options.output;
        if (outPath) {
            // Confirm overwrite if file exists
            const exists = await fs
                .access(outPath)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                const { overwrite } = await inquirer.prompt([
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



            await fs.mkdir(dirname(outPath), { recursive: true }).catch(() => {});
            await fs.writeFile(outPath, JSON.stringify(outJson, null, 2), 'utf8');
            console.log(`Key generated and saved to ${outPath}`);
        } else {
            console.log(outJson);
        }
    }

    private handleError(e: any) {
        console.error(e?.message ?? String(e));
        process.exit(1);
    }
}
