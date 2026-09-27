# NameIt

**What should I name it?** Give NameIt a picture and tell it the vibe, and it finds names that fit: teddy bears, bikes, cars, pets, plants, babies, game characters, the laptop you've had for nine years.

NameIt is **anonymous and stateless**. It has no accounts, no history, no database of users, and no image storage.

---

## Features

- **Photo in, names out.** Take a photo (native camera on phones, a live viewfinder on desktops) or upload one, including by drag and drop.
- **Natural-language brief.** Write whatever you want ("something badass and Norse for my motorcycle"). Quick-style chips and example prompts help, but nothing is a required field.
- **Grounded in real names.** Candidates come from a name dataset with origins and meanings. The model picks from that pool, and where a name is in the dataset, the dataset's meaning and origin replace anything the model claims.
- **Staged loading screen** that follows the real pipeline: looking → understanding → finding → shortlisting.
- **Give Me More** returns a new batch that leaves out every name you've already seen. It reuses the earlier image analysis, so it's faster.
- **Copy** button on every name, and **Name Something Else** clears everything.
- Friendly handling for bad files, oversized images, AI failures, network drops and rate limits.
- Responsive, mobile-first layout. Honours `prefers-reduced-motion`.

## Tech stack

- **Next.js 16** (App Router, Route Handlers), **React 19**, **TypeScript**
- **Tailwind CSS 4**
- **zod** for validating requests and model output
- Any **OpenAI-compatible vision model**, with open-weight models (Qwen2.5-VL, Llama 4 Scout, LLaVA…) as the intended default

## Running locally

```bash
npm install
cp .env.example .env.local     # optional: demo mode works with no config
npm run dev                    # http://localhost:3000
```

With no AI configured, NameIt runs in **demo mode**. The whole UI works, but names come straight from the dataset without looking at the photo, and the results page says so. To get image-aware names, configure a model:

### Recommended: OpenRouter free vision models

[OpenRouter](https://openrouter.ai) serves several open-weight vision models for free (`:free` variants) behind one key. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys), then:

```env
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=google/gemma-4-31b-it:free
AI_FALLBACK_MODELS=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free,qwen/qwen3.8-27b:free
AI_API_KEY=sk-or-...
AI_EXTRA_BODY={"reasoning":{"enabled":false}}
AI_PROVIDER_LABEL=OpenRouter
AI_PROVIDER_MAY_TRAIN=true
```

- **Quota:** `:free` models allow 20 requests/minute and **50 requests/day**, or **1,000/day** once your account has ever bought $10 of credits. One search uses 2 requests and "Give Me More" uses 1, so that's about 25 or 500 searches a day. When the quota runs out, users see a "we're busy" message instead of a generic error.
- **Fallbacks:** if the main model is rate-limited or down, OpenRouter tries `AI_FALLBACK_MODELS` in order. The server logs which fallback answered.
- **Free models change.** Check [openrouter.ai/models](https://openrouter.ai/models) (filter: free, image input) and update the model ids if one disappears.
- **Privacy:** free endpoints may log prompts and images and use them for training. Keep "allow training on free models" on in your OpenRouter privacy settings, or the free endpoints get filtered out. `AI_PROVIDER_MAY_TRAIN=true` makes the privacy notice say this. For zero retention, use a paid model or Option A.

### Option A: fully local, free and open source (Ollama)

```bash
ollama pull qwen2.5vl:7b        # or llava, llama3.2-vision, gemma3…
```

```env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=qwen2.5vl:7b
```

With this setup, images never leave your machine.

### Option B: a hosted open model

Any provider with an OpenAI-style `/chat/completions` endpoint that accepts `image_url` content will work. For example:

| Provider | `AI_BASE_URL` | Example `AI_MODEL` |
| --- | --- | --- |
| Hugging Face Inference Providers | `https://router.huggingface.co/v1` | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Groq | `https://api.groq.com/openai/v1` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| OpenRouter | `https://openrouter.ai/api/v1` | any vision model id |
| Self-hosted vLLM | `http://your-host:8000/v1` | the model you serve |

Set `AI_API_KEY` for hosted providers. Model availability and free tiers change, so check the provider's current catalogue.

## Environment variables

All variables are server-side only. None of them are exposed to the browser.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | auto | `openai-compatible` or `demo`. Auto picks `openai-compatible` if `AI_BASE_URL` is set, otherwise `demo`. |
| `AI_BASE_URL` | – | OpenAI-compatible API base URL |
| `AI_MODEL` | – | Vision model id |
| `AI_API_KEY` | – | Bearer token (not needed for local Ollama) |
| `AI_FALLBACK_MODELS` | – | Up to 2 comma-separated fallback models, sent as OpenRouter's `models` array (max 3 models in total). Only set this for servers that support it. |
| `AI_EXTRA_BODY` | – | JSON object merged into every request, e.g. `{"reasoning":{"enabled":false}}` |
| `AI_JSON_MODE` | `true` | Request `response_format: json_object`. Turns itself off automatically if the server rejects it. |
| `AI_TIMEOUT_MS` | `60000` | Per model-call timeout |
| `AI_PROVIDER_LABEL` | host name | Provider name shown in the privacy notice |
| `AI_PROVIDER_IS_SELF_HOSTED` | `false` | Set this if a non-localhost URL is infrastructure you run, so the privacy notice says so |
| `AI_PROVIDER_MAY_TRAIN` | `false` | Set this if the provider may keep or train on images; the privacy notice then says so |
| `NAME_SOURCE_DATAMUSE` | `false` | Enable the optional Datamuse word source (see below) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SECONDS` | `10` / `60` | Per-client request limit |
| `ALLOWED_ORIGINS` | – | Extra origins allowed to call the API (same-origin always works) |

## Architecture

```
app/
  page.tsx                        Landing page and app shell (server component)
  api/generate-names/route.ts     The only API: validate → pipeline → JSON
components/
  Hero, ImagePicker, CameraCapture, ImagePreview,
  SpecificationInput, LoadingState, Results, NameCard, ErrorState, …
  useNamingFlow.ts                All client state (in memory only)
  NameItApp.tsx                   Step orchestration
lib/
  ai/
    provider.ts                   VisionAIProvider interface + error type
    vision-model.ts               Picks the provider from env; privacy disclosure
    prompts.ts                    System and user prompts
    schema.ts                     Tolerant JSON extraction + zod validation
    providers/openai-compatible.ts
    providers/demo.ts
  names/
    types.ts                      NameCandidate, NameSource
    repository.ts                 Merges sources, ranks candidates
    vocabulary.ts                 "indian" → Sanskrit/Hindi, "badass" → tags, …
    data/curated.ts               Built-in curated dataset (~490 names)
    sources/                      curated, local JSON imports, Datamuse
  services/generate-names.ts      The naming pipeline
  validation.ts                   Shared limits, magic-byte sniffing, sanitising
  rate-limit.ts, security.ts      Abuse protection
  client/                         Browser-side API call + image downscaling
data/names/                       Drop imported datasets here (*.json)
scripts/import-names.mjs          CSV → dataset converter
```

### The pipeline (`POST /api/generate-names`)

1. **Guard.** Check the origin, apply the rate limit, cap the body size and verify it's multipart.
2. **Validate.** The declared type and size must pass, the image's **magic bytes** must be JPEG, PNG or WEBP, the brief is sanitised and capped at 500 characters, and the exclude list is validated.
3. **Analyse.** The vision model describes the subject as JSON: category, colours, traits, keywords. "Give Me More" sends the earlier analysis back and skips this step.
4. **Retrieve.** The repository scores every candidate against the brief and the analysis (origin, category, style tags, colours, meaning words, length and gender preferences). It returns the top ~54 plus a few random wildcards for variety, never including names already shown.
5. **Choose.** The model gets the image, the analysis, the brief, the candidate pool and the avoid list, and returns 10 suggestions as JSON.
6. **Validate and enrich.** Output is parsed tolerantly (code fences and stray prose are fine) and checked with zod. Names with odd characters are dropped, duplicates and excluded names are removed, and dataset meanings and origins replace the model's. Fewer than 4 usable names counts as a failure.
7. **Discard.** The image buffer is zeroed and released in a `finally` block.

### Prompt design

The system prompts in `lib/ai/prompts.ts` tell the model to prefer the supplied pool, **never invent meanings or origins**, tie each name to something visible, avoid repeats and similar roots, keep things kind, and return JSON only. User text is wrapped in delimiters and labelled as data, and the model is told to ignore instructions inside it. The analysis prompt forbids identifying people or guessing sensitive traits.

## Name data

- **Built in:** `lib/names/data/curated.ts`, about 490 hand-curated names across Japanese, Sanskrit/Hindi, Greek, Latin, Norse, Irish/Welsh, French, Italian, Spanish, Korean, Chinese, Arabic/Persian, Swahili, Hawaiian and English, plus playful originals ("Sir Fluffington", "Leaf Erikson"). Meanings are included only where they're well established. Otherwise the field is left empty.
- **Your own datasets:** convert any openly licensed CSV with
  `node scripts/import-names.mjs names.csv my-set --source "Dataset" --url https://…`.
  Files in `data/names/*.json` are loaded at startup, validated and merged in.
- **Optional external source:** with `NAME_SOURCE_DATAMUSE=true`, related words come from the free [Datamuse API](https://www.datamuse.com/api/). It sends at most 3 derived keywords per request (never the image or the user's text), has a 2-second timeout, and caches results in memory for 24 hours. The app doesn't scrape websites.

Every source can fail without breaking the request. The repository treats a failed source as returning no results.

## Privacy and image handling

- **Nothing is persisted.** There's no database, object storage or temp files. The server never writes the image to disk: it's read into memory, sent to the model, and the buffer is zeroed when the request ends. Neither images nor user text are logged. Only error types are.
- **In the browser**, the image exists as an in-memory `File` and a `blob:` URL (revoked when you change or clear it). It's downscaled to at most 1568px before upload. No `localStorage`, cookies or history, so refreshing forgets everything.
- **The privacy notice is accurate for the configured provider.** It reads the config at request time and says either that the image is sent to a named third-party AI provider (and is subject to that provider's terms), or that it's analysed on your own server, or (in demo mode) that it isn't analysed at all.
- The rate limiter keeps a salted hash of the client IP in memory for the length of the window, and never the raw address.

## Security

- API keys are read only in server modules. `lib/ai/*` imports `server-only`, so importing it from client code breaks the build.
- File type is checked twice: the declared MIME type and the magic bytes. Size is limited to 10 MB on the client, on the declared `Content-Length`, and on the actual file.
- All request fields are validated with explicit length and count limits.
- There are no CORS headers, and cross-site POSTs are rejected. `ALLOWED_ORIGINS` opens specific origins.
- Security headers are set: `nosniff`, `X-Frame-Options: SAMEORIGIN`, a strict referrer policy, and a `Permissions-Policy` that allows only the camera, on this origin.
- Rate limiting is per client. On multi-instance or serverless deployments, each instance counts separately. Swap `lib/rate-limit.ts` for a shared store such as Redis or Upstash if you need a global limit.

## Replacing the AI provider

1. Create `lib/ai/providers/my-provider.ts` implementing `VisionAIProvider`:

   ```ts
   interface VisionAIProvider {
     analyzeImage(image: ImageInput, specification: string): Promise<ImageAnalysis>;
     generateNames(image: ImageInput, specification: string,
                   candidates: NameCandidate[], options: GenerateOptions): Promise<NameRecommendation[]>;
   }
   ```

   Reuse `prompts.ts` and `parseImageAnalysis` / `parseRecommendations` from `schema.ts` to get the same prompt quality and validation.
2. Add a `case` for it in `lib/ai/vision-model.ts`.
3. Set `AI_PROVIDER=my-provider`.

Nothing in the UI, API route or pipeline needs to change.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build (includes type-checking)
npm run start    # serve the production build
npm run lint     # ESLint
```
