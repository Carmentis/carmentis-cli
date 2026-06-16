import * as v from "valibot";

// ──────────────────────────────────────────────
// Schémas Valibot
// ──────────────────────────────────────────────

const Ed25519PrivKeySchema = v.object({
    type: v.literal("tendermint/PrivKeyEd25519"),
    value: v.pipe(
        v.string(),
        v.base64(),
        v.transform((b64) => Buffer.from(b64, "base64")),
        v.check((buf) => buf.length === 64, "La clé Ed25519 CometBFT doit faire 64 bytes (privKey || pubKey)"),
    ),
});

const Secp256k1PrivKeySchema = v.object({
    type: v.literal("tendermint/PrivKeySecp256k1"),
    value: v.pipe(
        v.string(),
        v.base64(),
        v.transform((b64) => Buffer.from(b64, "base64")),
        v.check((buf) => buf.length === 32, "La clé Secp256k1 doit faire 32 bytes"),
    ),
});

const PrivKeySchema = v.variant("type", [
    Ed25519PrivKeySchema,
    Secp256k1PrivKeySchema,
]);

const Ed25519PubKeySchema = v.object({
    type: v.literal("tendermint/PubKeyEd25519"),
    value: v.pipe(
        v.string(),
        v.base64(),
        v.transform((b64) => Buffer.from(b64, "base64")),
        v.check((buf) => buf.length === 32, "La clé publique Ed25519 doit faire 32 bytes"),
    ),
});

// Fichier ne contenant que la clé publique. Accepte soit l'objet pub_key
// brut ({ type, value }), soit un objet l'encapsulant dans un champ pub_key
// (ex: entrée de validateur du genesis, priv_validator_key.json sans priv_key).
// Produit directement la clé publique sous forme de Uint8Array.
export const CometBftPubKeySchema = v.pipe(
    v.union([
        Ed25519PubKeySchema,
        v.object({ pub_key: Ed25519PubKeySchema }),
    ]),
    v.transform((input) => ("pub_key" in input ? input.pub_key.value : input.value)),
);

export const NodeKeySchema = v.object({
    priv_key: Ed25519PrivKeySchema, // node_key.json est toujours Ed25519
});

export const ValidatorKeySchema = v.object({
    address: v.pipe(v.string(), v.hexadecimal(), v.length(40)),
    pub_key: v.object({
        type: v.string(),
        value: v.pipe(v.string(), v.base64()),
    }),
    priv_key: PrivKeySchema,
});

export const CometBftKeySchema = v.union([NodeKeySchema, ValidatorKeySchema]);

// ──────────────────────────────────────────────
// Types inférés
// ──────────────────────────────────────────────

export type NodeKey = v.InferOutput<typeof NodeKeySchema>;
export type ValidatorKey = v.InferOutput<typeof ValidatorKeySchema>;
export type CometBftKey = v.InferOutput<typeof CometBftKeySchema>;
export type CometBftPubKey = v.InferOutput<typeof CometBftPubKeySchema>;
