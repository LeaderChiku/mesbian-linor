import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import {
  getPhotosByCategory,
  addPhoto,
  updatePhoto,
  deletePhoto,
  type CategorySlug,
} from '@/lib/photos-server';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

/**
 * GET: List all photos or filter by category.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as CategorySlug | null;

  try {
    const photos = await getPhotosByCategory(category || undefined);
    return NextResponse.json({ success: true, photos });
  } catch (err) {
    console.warn('Error fetching photos:', err);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

/**
 * POST: Add a new photo to a category.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { imageUrl, caption, comments, categorySlug, orderIndex, isCover, dateLabel } = body;

    if (!imageUrl || !caption || !categorySlug) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, caption, categorySlug' },
        { status: 400 }
      );
    }

    const newPhoto = await addPhoto({
      imageUrl: String(imageUrl).trim(),
      caption: String(caption).trim(),
      comments: comments ? String(comments).trim() : undefined,
      categorySlug: categorySlug as CategorySlug,
      orderIndex: typeof orderIndex === 'number' ? orderIndex : 0,
      isCover: Boolean(isCover),
      dateLabel: dateLabel ? String(dateLabel).trim() : undefined,
    });

    return NextResponse.json({ success: true, photo: newPhoto });
  } catch (err) {
    console.warn('Error creating photo:', err);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}

/**
 * PUT: Update an existing photo.
 */
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    const updated = await updatePhoto(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, photo: updated });
  } catch (err) {
    console.warn('Error updating photo:', err);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a photo by ID.
 */
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing photo ID parameter' }, { status: 400 });
  }

  const success = await deletePhoto(id);
  if (!success) {
    return NextResponse.json({ error: 'Photo not found or delete failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
