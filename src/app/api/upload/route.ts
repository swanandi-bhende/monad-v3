import { NextResponse } from "next/server";

const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const jwt = process.env.Pinata_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "File uploads are not configured on this server." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a file to upload." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Files must be between 1 byte and 25 MB." }, { status: 400 });
  }

  const upload = new FormData();
  upload.append("file", file, file.name);
  upload.append("network", "public");

  const response = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: upload,
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: "The file could not be stored. Try again." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { data?: { cid?: string } };
  const cid = data.data?.cid;
  if (!cid) {
    return NextResponse.json(
      { error: "The file could not be stored. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ name: file.name, cid, url: `${PINATA_GATEWAY}/${cid}` });
}
