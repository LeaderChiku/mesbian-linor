import { NextRequest, NextResponse } from 'next/server';
import { getPhotosByCategory, type CategorySlug } from '@/lib/photos-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as CategorySlug | null;

  try {
    const photos = await getPhotosByCategory(category || undefined);
    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (err) {
    console.warn('Error fetching photos:', err);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
