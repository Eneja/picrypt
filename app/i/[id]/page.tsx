import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppUrl, isValidDropId } from "@/lib/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!isValidDropId(id)) {
    return {};
  }

  const appUrl = getAppUrl();

  return {
    title: "Photo",
    openGraph: {
      title: "Photo",
      images: [`${appUrl}/api/cover/${id}`],
    },
  };
}

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidDropId(id)) {
    notFound();
  }

  const appUrl = getAppUrl();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0C0C0B]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${appUrl}/api/cover/${id}`}
        alt="Photo"
        className="max-h-screen max-w-full object-contain"
      />
    </main>
  );
}
