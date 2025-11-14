import commander from "commander";
import {CryptoEncoderFactory, SignatureSchemeId, WalletCrypto} from "../../../../../../carmentis-core";

export class GenCommand {
    static register(program: commander.Command) {
        const genCommand = program
            .command('gen')
            .description("Used to generate cryptographic material");

        genCommand.command('seed')
            .description("Generate a seed")
            .action(async (options) => {
                const walletCrypto = WalletCrypto.generateWallet();
                console.log(walletCrypto.encode());
            });

        genCommand.command('wallet-sig')
            .description("Generate a wallet signature key pair")
            .requiredOption('--from-seed <seed>', 'Specify a seed to use')
            .action(async (options) => {
                const walletCrypto = WalletCrypto.parseFromString(options.fromSeed);
                const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
                const walletPrivateKey = walletCrypto.getPrivateSignatureKey(SignatureSchemeId.SECP256K1);
                const walletPublicKey = walletPrivateKey.getPublicKey();
                console.log(sigEncoder.encodePrivateKey(walletPrivateKey));
                console.log(sigEncoder.encodePublicKey(walletPublicKey));
            });

        genCommand.command('account-sig')
            .description("Generate a wallet signature key pair")
            .requiredOption('--from-seed <seed>', 'Specify a seed to use')
            .requiredOption('-n,--nonce <nonce>', 'Specify a nonce')
            .action(async (options) => {
                const walletCrypto = WalletCrypto.parseFromString(options.fromSeed);
                const accountCrypto = walletCrypto.getAccount(Number.parseInt(options.nonce));
                const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
                const accountPrivateKey = accountCrypto.getPrivateSignatureKey(SignatureSchemeId.SECP256K1);
                const accountPublicKey = accountPrivateKey.getPublicKey();
                console.log(sigEncoder.encodePrivateKey(accountPrivateKey));
                console.log(sigEncoder.encodePublicKey(accountPublicKey));
            });
    }
}