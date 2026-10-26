/**
 * Test Photo Upload System (Priority 2)
 */

import assert from 'node:assert';
import { uploadPhotoFile, getPhotosByCategory, deletePhoto } from '../lib/photos-server.ts';
import { verifyAdminToken } from '../lib/admin-auth.ts';

async function run() {
  console.log('\n--- 1. Testing Photo Upload File Validation ---');

  // Fake File class in Node environment if global File is not present
  const FileClass = globalThis.File || class File {
    constructor(chunks, name, options = {}) {
      this.name = name;
      this.type = options.type || '';
      this.buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
      this.size = this.buffer.length;
    }
    arrayBuffer() {
      return Promise.resolve(this.buffer);
    }
  };

  // 1. Test unsupported file rejection
  const invalidFile = new FileClass(['fake executable content'], 'script.exe', { type: 'application/x-msdownload' });
  const rejectResult = await uploadPhotoFile(invalidFile, 'the-golden-hour');
  assert.strictEqual(rejectResult.success, false, 'Non-image file must be rejected');
  assert.strictEqual(rejectResult.error?.includes('Unsupported format'), true);
  console.log('  ✓ Non-image files are correctly rejected');

  // 2. Test oversized file rejection (> 10MB)
  const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
  const oversizedFile = new FileClass([bigBuffer], 'huge_image.jpg', { type: 'image/jpeg' });
  const sizeResult = await uploadPhotoFile(oversizedFile, 'the-golden-hour');
  assert.strictEqual(sizeResult.success, false, 'Files > 10MB must be rejected');
  assert.strictEqual(sizeResult.error?.includes('exceeds 10MB'), true);
  console.log('  ✓ Oversized files (> 10MB) are correctly rejected');

  // 3. Test valid image upload (JPG)
  const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const validFile = new FileClass([validJpgBuffer], 'sunset_at_beach.jpg', { type: 'image/jpeg' });
  const uploadResult = await uploadPhotoFile(validFile, 'the-golden-hour', 'Sunset at beach');
  assert.strictEqual(uploadResult.success, true, 'Valid image upload must succeed');
  assert.strictEqual(uploadResult.photo?.categorySlug, 'the-golden-hour');
  assert.strictEqual(uploadResult.photo?.caption, 'Sunset at beach');
  console.log('  ✓ Valid image upload succeeds and returns photo item');

  // 4. Verify photo appears in getPhotosByCategory
  const categoryPhotos = await getPhotosByCategory('the-golden-hour');
  const found = categoryPhotos.find((p) => p.id === uploadResult.photo?.id);
  assert.ok(found, 'Uploaded photo must be present in category photos');
  assert.strictEqual(found.caption, 'Sunset at beach');
  console.log('  ✓ Uploaded photo is retrieved by getPhotosByCategory (visitor accessible)');

  // Clean up test photo
  if (uploadResult.photo?.id) {
    await deletePhoto(uploadResult.photo.id);
  }

  // 5. Verify security authorization
  assert.strictEqual(verifyAdminToken(undefined), false);
  console.log('  ✓ Admin token verification protects upload endpoint');

  console.log('\n============================================');
  console.log('All photo upload tests PASSED successfully!');
  console.log('============================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
