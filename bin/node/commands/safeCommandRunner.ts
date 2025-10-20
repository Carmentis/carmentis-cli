export class SafeCommandRunner {

    static async safeRun(runner: () => Promise<void>) {
        const safeRunner = new SafeCommandRunner(runner);
        await safeRunner.run();
    }
    constructor(private readonly runner: () => Promise<void>) {

    }

    private get shouldRunInDebug() {
        return process.env.CMTS_DEBUG !== undefined
    }

    async run() {
        try {
            await this.runner();
        } catch (error) {
            if (this.shouldRunInDebug) console.error(error);
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    }
}