declare module "@farcaster/miniapp-sdk" {
  export const sdk: {
    actions: {
      ready(options?: { image?: string; postUrl?: string }): Promise<void>;
    };
  };
}
