import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "chart-images";

if (!supabaseUrl || !serviceRoleKey) {
  exitWithHelp("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
}

if (!args.title) {
  exitWithHelp("Missing --title.");
}

if (!args.image && !args.imageUrl) {
  exitWithHelp("Provide either --image /path/to/chart.png or --image-url https://...");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

let imageUrl = args.imageUrl || "";
let imagePath = "";

if (args.image) {
  const filePath = path.resolve(args.image);
  const fileName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const objectPath = `charts/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  const file = await readFile(filePath);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      contentType: guessContentType(fileName),
      cacheControl: "31536000",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  imageUrl = data.publicUrl;
  imagePath = objectPath;
}

const { data: chart, error: insertError } = await supabase
  .from("charts")
  .insert({
    title: args.title,
    heat: Number(args.heat || 0),
    image_url: imageUrl,
    image_path: imagePath || null,
    source: args.source || null
  })
  .select()
  .single();

if (insertError) {
  throw insertError;
}

console.log(JSON.stringify(chart, null, 2));

function parseArgs(values) {
  const parsed = {};

  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const next = values[index + 1];

    if (!key.startsWith("--")) continue;
    if (!next || next.startsWith("--")) {
      parsed[toCamel(key)] = true;
      continue;
    }

    parsed[toCamel(key)] = next;
    index += 1;
  }

  return parsed;
}

function toCamel(value) {
  return value
    .replace(/^--/, "")
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function guessContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".svg") return "image/svg+xml";
  return "image/png";
}

function exitWithHelp(message) {
  console.error(message);
  console.error("");
  console.error("Usage:");
  console.error("  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run upload -- --title \"Market chart\" --heat 91 --image /path/to/chart.png");
  console.error("  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run upload -- --title \"Market chart\" --heat 91 --image-url https://example.com/chart.png");
  process.exit(1);
}
