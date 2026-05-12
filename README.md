# AInvest Finance Chart

This version uses:

- GitHub Pages for the public website.
- Supabase Database for chart metadata.
- Supabase Storage for chart images.
- A private upload script for adding charts.

No Cloudflare or R2 is required.

## Folder Map

- `docs/index.html` - the website GitHub Pages will publish.
- `docs/config.js` - public Supabase project URL and anon key used by the website.
- `supabase/schema.sql` - SQL to create the `charts` table and public read policy.
- `scripts/upload-chart.mjs` - private upload script for chart images and metadata.
- `package.json` - Node dependency and upload command.

## Part 1: Create Supabase Backend

1. Go to https://supabase.com and create a free project.

2. In the Supabase dashboard, open **SQL Editor**.

3. Copy everything from `supabase/schema.sql` and run it.

4. Open **Storage**.

5. Create a bucket named:

```txt
chart-images
```

6. Make the `chart-images` bucket public.

The public bucket is important because the website needs to display chart images without logging users in. Supabase's docs note that `getPublicUrl` is for public buckets.

## Part 2: Add Supabase Public Config To The Website

In Supabase, open:

```txt
Project Settings > API
```

Copy:

- Project URL
- anon public key

Open:

```txt
docs/config.js
```

Replace:

```js
url: "https://YOUR_PROJECT_REF.supabase.co",
anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
```

with your real values.

The anon key is okay to be public. Do not put the service role key in `docs/config.js`.

## Part 3: Publish The Website With GitHub Pages

Create a new GitHub repo, then from this folder run:

```bash
git init
git add .
git commit -m "Initial AInvest chart site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

In GitHub:

1. Open your repo.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Branch: `main`.
5. Folder: `/docs`.
6. Save.

GitHub will give you a URL like:

```txt
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

That is your public website.

## Part 4: Upload Charts Privately

Install the upload script dependency:

```bash
npm install
```

In Supabase, open:

```txt
Project Settings > API
```

Copy:

- Project URL
- service_role secret key

The service role key is private. Do not commit it to GitHub and do not put it in frontend files.

Upload a local chart image:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_SECRET_KEY" \
npm run upload -- \
  --title "Fed rate expectations move markets" \
  --heat 91 \
  --source "internal-research" \
  --image "/absolute/path/to/chart.png"
```

Upload metadata with an image that is already hosted somewhere:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_SECRET_KEY" \
npm run upload -- \
  --title "NVDA implied volatility update" \
  --heat 76 \
  --source "internal-research" \
  --image-url "https://example.com/chart.png"
```

After upload, refresh your GitHub Pages website. The chart should appear in the waterfall list.

## Company Integration

Your company can either:

- Run `scripts/upload-chart.mjs` from an internal machine.
- Recreate the same logic in Python/Java/Go/etc.
- Upload the image to Supabase Storage, call `getPublicUrl`, then insert a row into `public.charts`.

The row shape is:

```json
{
  "title": "Chart title",
  "heat": 91,
  "image_url": "https://...public-image-url...",
  "image_path": "charts/file.png",
  "source": "internal-research"
}
```

## Useful Docs

- Supabase JS client: https://supabase.com/docs/reference/javascript
- Supabase Storage upload: https://supabase.com/docs/reference/javascript/storage-from-upload
- Supabase public image URL: https://supabase.com/docs/reference/javascript/storage-from-getpublicurl
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- GitHub Pages: https://docs.github.com/pages
