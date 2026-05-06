"use server";

import prisma from "@/lib/prisma";

export async function saveJournalEntry(data: {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  type: string;
  title: string;
  content: string;
  theme?: string;
  cards?: any;
  deckImage?: string;
  numerologyData?: any;
}) {
  try {
    // Upsert user if they don't exist in our DB
    const user = await prisma.user.upsert({
      where: { id: data.userId },
      update: {
        email: data.email,
        name: data.name,
        image: data.image
      },
      create: {
        id: data.userId,
        email: data.email,
        name: data.name,
        image: data.image
      }
    });

    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        content: data.content,
        theme: data.theme,
        cards: data.cards || null,
        deckImage: data.deckImage,
        numerologyData: data.numerologyData || null,
      }
    });
    
    return { success: true, id: entry.id };
  } catch (error) {
    console.error("Failed to save journal entry:", error);
    return { success: false, error: "Failed to save journal entry" };
  }
}

export async function getDbJournalEntries(userId: string) {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    // Serialize dates to ISO strings for client components
    return {
      success: true,
      entries: entries.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
    return { success: false, entries: [] };
  }
}

export async function deleteDbJournalEntry(entryId: string, userId: string) {
  try {
    // Verify ownership before deleting
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) return { success: false, error: "Entry not found" };

    await prisma.journalEntry.delete({ where: { id: entryId } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    return { success: false, error: "Failed to delete" };
  }
}

export async function clearDbJournal(userId: string) {
  try {
    await prisma.journalEntry.deleteMany({ where: { userId } });
    return { success: true };
  } catch (error) {
    console.error("Failed to clear journal:", error);
    return { success: false };
  }
}
