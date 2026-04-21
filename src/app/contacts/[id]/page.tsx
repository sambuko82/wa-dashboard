import type { Metadata } from "next";
import ContactDetailClient from "./ContactDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Contact ${id} | WA PRO`,
  };
}

export default function ContactDetailPage() {
  return <ContactDetailClient />;
}
