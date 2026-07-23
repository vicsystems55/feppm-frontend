# FEPPM Frontend

Vue 3, Vite, Tailwind CSS, Pinia, and Vue Router frontend.

## Development

1. Run `npm install`.
2. Run `npm run dev`.

Vite loads `.env.development` locally and `.env.production` for production builds. Values beginning with `VITE_` are public browser configuration and must never contain a Cloudinary API secret.

## Checklist photo uploads

Checklist evidence is uploaded directly from the browser using a Cloudinary unsigned upload preset.

In the Cloudinary Console, open **Settings → Upload → Upload presets** and create a preset with:

- Preset name: `feppm_photos`
- Signing mode: `Unsigned`
- Asset folder: `feppm/photos`
- Allowed formats: JPG, JPEG, PNG, WebP, HEIC, and HEIF
- Maximum file size: 10 MB

Do not place the Cloudinary API secret in the Vue application. Netlify and the checked-in Vite environments use `feppm_photos`; keep this value synchronized with the unsigned preset in the Cloudinary Console, then redeploy the site after any change.
