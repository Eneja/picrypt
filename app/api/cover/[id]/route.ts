import { generateCoverSvg } from "@/lib/cover-image";
import { isValidDropId } from "@/lib/url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isValidDropId(id)) {
    return new Response("Not found", { status: 404 });
  }

  const svg = generateCoverSvg(id);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
