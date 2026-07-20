import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Apple touch icon: brand mark on the night ground. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111310",
          color: "#E8DFD0",
          fontSize: 96,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 300,
          letterSpacing: "-0.04em",
        }}
      >
        F
      </div>
    ),
    { ...size },
  )
}
