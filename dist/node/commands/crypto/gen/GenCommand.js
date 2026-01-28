"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenCommand = void 0;
const client_1 = require("@cmts-dev/carmentis-sdk/client");
class GenCommand {
    static register(program) {
        const genCommand = program
            .command('gen')
            .description("Used to generate cryptographic material");
        genCommand.command('seed')
            .description("Generate a seed")
            .action(async (options) => {
            const walletCrypto = client_1.WalletCrypto.generateWallet();
            console.log(walletCrypto.encode());
        });
        genCommand.command('wallet-sig')
            .description("Generate a wallet signature key pair")
            .requiredOption('--from-seed <seed>', 'Specify a seed to use')
            .action(async (options) => {
            const walletCrypto = client_1.WalletCrypto.parseFromString(options.fromSeed);
            const sigEncoder = client_1.CryptoEncoderFactory.defaultStringSignatureEncoder();
            const walletPrivateKey = walletCrypto.getPrivateSignatureKey(client_1.SignatureSchemeId.SECP256K1);
            const walletPublicKey = await walletPrivateKey.getPublicKey();
            console.log(await sigEncoder.encodePrivateKey(walletPrivateKey));
            console.log(await sigEncoder.encodePublicKey(walletPublicKey));
        });
        genCommand.command('account-sig')
            .description("Generate a wallet signature key pair")
            .requiredOption('--from-seed <seed>', 'Specify a seed to use')
            .requiredOption('-n,--nonce <nonce>', 'Specify a nonce')
            .action(async (options) => {
            const walletCrypto = client_1.WalletCrypto.parseFromString(options.fromSeed);
            const accountCrypto = walletCrypto.getAccount(Number.parseInt(options.nonce));
            const sigEncoder = client_1.CryptoEncoderFactory.defaultStringSignatureEncoder();
            const accountPrivateKey = await accountCrypto.getPrivateSignatureKey(client_1.SignatureSchemeId.SECP256K1);
            const accountPublicKey = await accountPrivateKey.getPublicKey();
            console.log(await sigEncoder.encodePrivateKey(accountPrivateKey));
            console.log(await sigEncoder.encodePublicKey(accountPublicKey));
        });
    }
}
exports.GenCommand = GenCommand;
