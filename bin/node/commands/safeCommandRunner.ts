export class SafeCommandRunner {

    static async safeRun(runner: () => Promise<void>) {
        const safeRunner = new SafeCommandRunner(runner);
        await safeRunner.run();
    }
    constructor(private readonly runner: () => Promise<void>) {

    }

    async run() {
        try {
            await this.runner();
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    }
}