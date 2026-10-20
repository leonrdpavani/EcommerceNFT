// Gera as variantes WebP responsivas das artes a partir dos originais exportados do Figma.
// Uso: npm run images
import { mkdir, readdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const SOURCE_DIR = path.resolve("design-assets/nfts")
const OUTPUT_DIR = path.resolve("public/images/nfts")
const WIDTHS = [160, 320, 640, 960]

await mkdir(OUTPUT_DIR, { recursive: true })

const files = (await readdir(SOURCE_DIR)).filter((file) => file.endsWith(".png"))

for (const file of files) {
  const name = path.basename(file, ".png")
  for (const width of WIDTHS) {
    const output = path.join(OUTPUT_DIR, `${name}-${width}.webp`)
    await sharp(path.join(SOURCE_DIR, file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(output)
  }
  console.log(`✓ ${name} (${WIDTHS.join(", ")})`)
}
