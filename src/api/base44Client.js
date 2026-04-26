import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId: "69e91ff9d24a19ce6f9abd25",
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});
