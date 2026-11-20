export const environment = {
  apiUrl: 'http://localhost:3000',
  // Placeholder. Generate a pair with `npx web-push generate-vapid-keys` in apps/capi and put the
  // public key here (the private key goes in capi's env).
  vapidPublicKey: 'REPLACE_WITH_VAPID_PUBLIC_KEY',
  team: {
    slug: 'Canarinhos',
    name: 'Os Canarinhos',
    subtitle: 'A voar mais alto desde 1974',
  },
};
