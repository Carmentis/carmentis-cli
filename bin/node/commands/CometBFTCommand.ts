import commander from "commander";
import {SafeCommandRunner} from "./safeCommandRunner";
import * as ed25519 from "@noble/ed25519";
import * as v from "valibot";
import {CometBftKeySchema, CometBftPubKeySchema, ValidatorKeySchema} from "../types/CometBFTKeys";
import { readFileSync } from "fs";
import {sha256, sha512} from "@noble/hashes/sha2.js";
import {hashes} from "@noble/ed25519";
hashes.sha512 = sha512;

export class CometBFTCommand {
    constructor() {
    }


    /**
     * Parse et valide un fichier de clé CometBFT (node_key.json ou
     * priv_validator_key.json), puis signe le message avec Ed25519.
     *
     * Lève une ValiError si le JSON ne correspond pas au schéma attendu,
     * ou une Error si le type de clé n'est pas Ed25519.
     */
    static signWithCometBftKey(
        rawKey: unknown,
        message: Uint8Array | string
    ): { signature: Uint8Array; signatureBase64: string } {
        const key = v.parse(CometBftKeySchema, rawKey);

        if (key.priv_key.type !== "tendermint/PrivKeyEd25519") {
            throw new Error(`Type de clé non supporté pour la signature : ${key.priv_key.type}`);
        }

        // Les 32 premiers bytes sont la clé privée scalaire
        const privKey = key.priv_key.value.subarray(0, 32);
        const msgBytes =
            typeof message === "string" ? new TextEncoder().encode(message) : message;

        const signature = ed25519.sign(msgBytes, privKey);

        return {
            signature,
            signatureBase64: Buffer.from(signature).toString("base64"),
        };
    }

    /**
     * Parse et valide un fichier de clé CometBFT, puis vérifie une signature.
     *
     * Accepte soit un fichier de clé complet (la clé publique est extraite
     * des 32 derniers bytes de priv_key.value), soit un fichier ne contenant
     * que la clé publique (objet pub_key de type tendermint/PubKeyEd25519).
     */
    static verifyWithCometBftKey(
        rawKey: unknown,
        message: Uint8Array | string,
        signature: Uint8Array | string
    ): boolean {
        const pubKey = this.extractEd25519PubKey(rawKey);
        const msgBytes =
            typeof message === "string" ? new TextEncoder().encode(message) : message;
        const sigBytes =
            typeof signature === "string"
                ? Buffer.from(signature, "base64")
                : signature;

        return ed25519.verify(sigBytes, msgBytes, pubKey);
    }

    /**
     * Extrait la clé publique Ed25519 d'un JSON, qu'il s'agisse d'un fichier
     * de clé complet ou d'un fichier ne contenant que la clé publique.
     */
    private static extractEd25519PubKey(rawKey: unknown): Uint8Array {
        // Fichier ne contenant que la clé publique
        const pubOnly = v.safeParse(CometBftPubKeySchema, rawKey);
        if (pubOnly.success) {
            return pubOnly.output;
        }

        // Fichier de clé complet : la clé publique correspond aux 32 derniers
        // bytes de priv_key.value.
        const key = v.parse(CometBftKeySchema, rawKey);
        if (key.priv_key.type !== "tendermint/PrivKeyEd25519") {
            throw new Error(`Type de clé non supporté pour la vérification : ${key.priv_key.type}`);
        }
        return key.priv_key.value.subarray(32);
    }

    static register(program: commander.Command) {
        const docker = program
            .command('cometbft')
            .description('CometBFT utility command');

        docker
            .command("sign")
            .arguments('<keyPath>')
            .arguments('<message>')
            .action(async (keyPath: string, message: string) => {
                await SafeCommandRunner.safeRun(async () => {
                    // read the file from the provided key path
                    const raw = JSON.parse(readFileSync(keyPath, "utf-8"));
                    const signature = this.signWithCometBftKey(raw, message);
                    console.log(
                        `Signature: ${signature.signatureBase64}`
                    )
                });
            });

        docker.command("verify")
            .description("Verify a signed message")
            .arguments('<keyPath>')
            .arguments('<message>')
            .arguments('<signature>')
            .action(async (keyPath: string, message: string, signature: string) => {
                await SafeCommandRunner.safeRun(async () => {
                    const raw = JSON.parse(readFileSync(keyPath, "utf-8"));
                    const verified = this.verifyWithCometBftKey(raw, message, signature);
                    console.log(
                        verified ? "Signature is valid" : "Signature is invalid"
                    )
                });
            });

    }
}
