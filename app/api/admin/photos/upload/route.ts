import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { uploadPhotoFile, type CategorySlug } from '@/lib/photos-server';

function isAuthorized(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  return verifyAdminToken(cookieToken || headerToken);
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const categorySlug = (formData.get('categorySlug') as CategorySlug) || 'the-golden-hour';
    const customCaption = (formData.get('caption') as string) || '';

    // Extract all files (supports multiple or single)
    const rawFiles = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const files: File[] = rawFiles.length > 0 ? rawFiles : singleFile ? [singleFile] : [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided for upload.' },
        { status: 400 }
      );
    }

    const uploaded = [];
    const failed = [];

    // Process each file sequentially to maintain ordering and handle errors gracefully
    for (const file of files) {
      try {
        const result = await uploadPhotoFile(file, categorySlug, customCaption || undefined);
        if (result.success && result.photo) {
          uploaded.push(result.photo);
        } else {
          failed.push({
            filename: file.name,
            error: result.error || 'Upload failed',
          });
        }
      } catch (err: unknown) {
        failed.push({
          filename: file.name,
          error: err instanceof Error ? err.message : 'Unknown upload error',
        });
      }
    }

    return NextResponse.json({
      success: uploaded.length > 0,
      uploaded,
      failed,
      total: files.length,
      message: `Uploaded ${uploaded.length} photo(s)${failed.length > 0 ? `, ${failed.length} failed` : ''}.`,
    });
  } catch (err) {
    console.warn('[upload api error]:', err);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
