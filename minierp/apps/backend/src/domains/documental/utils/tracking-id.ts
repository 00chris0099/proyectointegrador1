import { prisma } from '../../../config/database';

function generateRandomChars(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateTrackingId(): Promise<string> {
  const year = new Date().getFullYear();
  let isUnique = false;
  let trackingId = '';

  while (!isUnique) {
    const randomChars = generateRandomChars(4);
    trackingId = `TRM-${year}-${randomChars}`;

    const existing = await prisma.tramite.findUnique({
      where: { idSeguimiento: trackingId },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return trackingId;
}
