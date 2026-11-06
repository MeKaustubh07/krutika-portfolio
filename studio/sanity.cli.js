/* ============================================================
   Sanity CLI settings (dev / build / deploy). Values from
   studio/.env. The first `npm run deploy` asks for a hostname
   (→ https://<hostname>.sanity.studio) and prints an app id;
   paste it into deployment.appId below to skip the prompt next time.
   ============================================================ */
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'set-your-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  deployment: {
    autoUpdates: true,
    // appId: '…',
  },
})
