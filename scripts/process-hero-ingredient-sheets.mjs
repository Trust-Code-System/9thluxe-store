import sharp from "sharp"

const sheets = [
  {
    input: "public/hero/drop/aventus-ingredients-key.png",
    outputs: ["pineapple", "green-apple", "blackcurrant"],
  },
  {
    input: "public/hero/drop/oud-wood-ingredients-key.png",
    outputs: ["sandalwood", "cardamom", "vanilla-tonka"],
  },
]

for (const sheet of sheets) {
  const source = sharp(sheet.input)
  const metadata = await source.metadata()
  const third = Math.floor(metadata.width / 3)

  for (const [index, name] of sheet.outputs.entries()) {
    const left = index * third
    const width = index === 2 ? metadata.width - left : third
    const { data, info } = await sharp(sheet.input)
      .extract({ left, top: 0, width, height: metadata.height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    for (let offset = 0; offset < data.length; offset += 4) {
      const red = data[offset]
      const green = data[offset + 1]
      const blue = data[offset + 2]
      const distance = Math.max(Math.abs(255 - red), green, Math.abs(255 - blue))
      if (distance <= 14) {
        data[offset + 3] = 0
      } else if (distance < 100) {
        data[offset + 3] = Math.round(((distance - 14) / 86) * 255)
        const spill = Math.max(0, Math.min(red, blue) - green)
        data[offset] = Math.max(0, red - spill)
        data[offset + 2] = Math.max(0, blue - spill)
      }
    }

    await sharp(data, { raw: info })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: 420, height: 420, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(`public/hero/drop/${name}.png`)
  }
}
