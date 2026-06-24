import {NetworksStore} from "../services/networksStore";
import commander from "commander";
import {SafeCommandRunner} from "./safeCommandRunner";
import {
    EncoderFactory,
    CryptoEncoderFactory,
    ProviderFactory,
    Hash,
    SectionType,
    CMTSToken,
    SectionLabel
} from "@cmts-dev/carmentis-sdk-core";

export class SwitchKeyCommand {
    constructor(private readonly store = new NetworksStore()) {
    }

    static register(program: commander.Command) {
        program
            .command('switch-key')
            .requiredOption('-n,--node <node>', 'Node name')
            .requiredOption('-i,--id <id>', 'Account ID')
            .requiredOption('-s,--sk <sk>', 'Currently declared private key')
            .requiredOption('-p,--new-pk <pk>', 'New public key to switch to')
            .description('Switch your key for an account.')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {
                    const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
                    const sk = await encoder.decodePrivateKey(options.sk);
                    const pk = await encoder.decodePublicKey(options.pk);
                    const nodeUrl = options.node;
                    const accountId = EncoderFactory.bytesToHexEncoder().decode(options.id);

                    const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);
                    const accountVb = await provider.loadAccountVirtualBlockchain(Hash.from(accountId));
                    const mb = await accountVb.createMicroblock();
                    mb.addSections([
                        {
                            type: SectionType.ACCOUNT_PUBLIC_KEY,
                            publicKey: await pk.getPublicKeyAsBytes(),
                            schemeId: pk.getSignatureSchemeId()
                        },
                        {
                            type: SectionType.CUSTOM,
                        }
                    ])
                    mb.setGasPrice(CMTSToken.createMilliToken(100))
                    await mb.setGasAndSeal(provider, sk, {
                        feesPayerAccount: accountId
                    })

                    console.log(`Switching public key for account ${options.id}: New public key ${options.pk}`)
                    const hash = await provider.publishMicroblock(mb);
                });
            });;
    }
}