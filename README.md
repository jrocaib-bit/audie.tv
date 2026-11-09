# Audite

Private draft of Audite, a calm Spanish-first Bible listening app. This slice describes the Genesis 1–2 pilot and keeps a personal path and listening progress on the device. It is not the whole Bible, not a store release, and not a paid service.

## Repositorio público

Audite no es software libre. Este repositorio no lleva licencia MIT ni ninguna otra licencia de uso. El fichero `apps/mobile/LICENSE` es la licencia MIT de la plantilla de Expo (650 Industries), no una licencia de Audite.

No están en git el texto bíblico (© Conferencia Episcopal Española), los másteres de audio ni las imágenes grandes del piloto. `npm run catalog` y `npm run validate` necesitan ese kit en local; sin él se detienen. La web pública lee `content/canon`, donde todavía no hay audio reproducible.

El proyecto de Supabase previsto es `qdjowihivtqoelurvyke` (`https://qdjowihivtqoelurvyke.supabase.co`, región `eu-west-1`). La URL está en `.env.example`. Las claves no. Ver `docs/MIGRACION.md`. No se han aplicado migraciones.

## Tipografía

Tokens en `apps/web/src/app/globals.css`:

- `--audite-font-display`: Gazpacho, luego Georgia. Los OTF de Gazpacho (© Santi Rey) no se versionan: la licencia para la app no está confirmada. Si existen en `apps/web/public/fonts/private/` (carpeta ignorada), la web los usa; si no, cae a Georgia.
- `--audite-font-secundaria` y `--audite-font-text`: Inter (SIL OFL), incrustada en `apps/web/public/fonts/inter/` y en la app Android. Es el texto y la interfaz en web y Android.
- `--audite-font-ios-system`: `-apple-system, "SF Pro Text", "SF Pro Display", system-ui`. Solo en la app iOS, como fuente del sistema. SF Pro no se incrusta ni se distribuye.

Las capturas locales pueden llevar Gazpacho si los OTF privados están en esa carpeta. Un clon público se ve con Georgia + Inter.

## What you can do

- Describe the Spanish pilot: Genesis 1–2, 8:18, two recordings joined at 6:07.517. Those audio files are not in this public repository.
- Open Hoy, Camino, Biblioteca, or Ajustes. The listening screen is a full-bleed gallery; a small player stays on the other screens.
- Pause, seek (±15 and ±30 seconds), change speed, set a sleep timer, and resume in this browser.
- Follow images and captions from the supplied timing proposal. Captions stay in their own band and do not fade with the picture.
- Build a listening path from episodes that actually have audio. Right now that is only the pilot.
- Read credits and license notes. The reference text itself is not in this public repository.
- Switch light and dark appearance, text size, captions, and interface language (Spanish or English). The narration stays Spanish.

## What this draft does not do

- No account, no server, and no sync between devices. Progress stays in this browser (`localStorage`) or, in the mobile scaffold, on that device (`AsyncStorage`).
- No price and no checkout. The membership page says the annual plan is still to come.
- English and Italian are listed as not attached. They are not playable.
- Genesis episodes 2–10 are an approved outline only. They have no titles, text, or audio here, and they cannot be added to a path.
- Image files are documented as PD-Art or CC0 reproductions. That record is not a legal opinion or a museum endorsement. Text and voice for this pilot were confirmed by Javier Roca.
- The image sequence is an editorial draft. It is not a claim that every cut is final.
- The mobile project typechecks on this Linux machine and its web target can be opened in a browser. It has not been run on an iPhone, Android device, or emulator, and it has not been submitted to the App Store or Google Play.

## Run the web draft

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43123

Other checks:

```bash
npm test
npm run typecheck
npm run lint
npm run validate
npm run build
```

`npm run catalog` rewrites `content/catalog/manifest.json` from the private pilot kit and then validates it. Without that kit the command stops. The writer is idempotent: the same kit produces the same file. Do not commit the biblical text it would embed.

## Content

`content/pilot` keeps the timing proposal and the asset manifest. The two Spanish MP3s, the five artwork files, the reference text, and the automatic transcript are not in this public repository. Hashes and durations are checked when those files are present locally.

`content/catalog/manifest.json` is the older kit catalog used by validation. In this tree its captions and reference paragraphs are omitted. The listening apps and the public pages read `content/canon/01_canon/manifiesto.json`. An episode is playable only when its language state is `audio_listo` and the master file is present. In the current manifest nothing is playable yet. A text credit is shown only when `fuente_texto` names it; otherwise it stays pending. Short labels use `titulo_corto`, then `titulo`, then `etiqueta`.

`AUDITE_DEMO=1` is a separate demo mode. `npm run content:fixture` writes that pilot only under `content/demo`. It is not mixed into the real catalog.

```bash
npm run content:fixture
npm run content:sync -- --root=/workspace/audite
```

`content:fixture` rebuilds the pilot manifest from the kit already in this repo. `content:sync` copies `01_canon/manifiesto.json` and the masters, subtitles, and art it names from a local content root. If that folder is missing, the script stops and leaves the fixture in place. Logo files, when they exist under `03_identidad/logos`, are copied the same way; screens keep using the placeholder mark until those files are there.

The public site is `/es` and `/en` (home, catalog, membership). Membership has no price and no checkout. Adding a language means adding a translation file in `content/sitio` and registering it in `apps/web/src/sitio/i18n.ts`.

Validation fails closed when a playable file is missing, a checksum or duration does not match, text or voice confirmation is absent, an image has no license or credit, the timeline has a gap, or English or Italian is marked playable. A missing legal sign-off for images, and the draft status of the timing, are warnings.

## Mobile scaffold

`apps/mobile` is an Expo Router app (SDK 58) that imports `@audite/domain` and the canon catalog. Playback uses `expo-audio` and asks the web app for the master. Bundle identifiers `es.audite.pilot` are placeholders. See `docs/DEVICE_TESTING.md`. `eas.json` has development and preview profiles only; do not run `eas build` or `eas submit` from this draft.

```bash
cd apps/mobile
npm install
npm run typecheck
npx expo start --web --port 43124
```

Run it with Expo Go or a development build on a machine that can open a simulator or a phone. This environment did not do that.

## Next integrations, when you want them

None of these need a secret for the draft to run.

- Accounts and sync, if listening should follow a person across devices.
- A real annual price and a payment provider, shown only when the price exists.
- The remaining Genesis episodes, each with audio, rights, and a catalog entry before it can be played or added to a path.
- Validated English and Italian masters, attached the same way as the Spanish pilot.
- A reviewed image lock, if the draft cuts should become final.
- Store builds, after a device pass that this Linux draft does not claim to have done.
