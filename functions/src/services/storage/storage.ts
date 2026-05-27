/**
 * Storage service
 * Monitors file uploads to Cloud Storage, generates multiple size variations for images, and records metadata in Firestore
 */

import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, dirname, extname, join } from 'path';

import { Transformer } from '@napi-rs/image';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { StorageObjectData } from 'firebase-functions/v2/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { v4 } from 'uuid';

import type {
  ImageStorageData,
  ImageStorageMetadata,
  ImageStorageVariation,
  StorageData,
  StorageMetadata,
} from '@firestore/types/storage.js';
import { DirectoryDocument } from 'src/models/directory.js';
import { StorageCollection, StorageDocument } from 'src/models/storage.js';

interface StorageUploadEvent {
  bucket?: string;
  data: StorageObjectData;
}

interface StorageDocumentSnapshotLike {
  exists: boolean;
  data(): unknown;
}

interface StorageChangeEvent {
  data?: {
    after?: StorageDocumentSnapshotLike;
  };
}

// Type aliases to avoid @google-cloud/storage CJS/ESM type conflicts
type Bucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;
type File = ReturnType<Bucket['file']>;

const IMAGE_CONFIG = {
  MAX_SIZE: 2048,
  MIN_SIZE: 128,
  QUALITY: 85,
} as const;

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

/**
 * Check if content type is a supported image format
 */
function isSupportedImageType(contentType: string): contentType is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(contentType as SupportedImageType);
}

const FORMAT_MAP = {
  jpeg: { extension: 'jpg', mimeType: 'image/jpeg' },
  png: { extension: 'png', mimeType: 'image/png' },
  webp: { extension: 'webp', mimeType: 'image/webp' },
} as const;

type ImageFormat = keyof typeof FORMAT_MAP;

/**
 * Creates format options for image encoding
 * @returns Array of format options
 */
function createFormatOptions(): FormatOption[] {
  return [
    {
      format: 'webp',
      quality: IMAGE_CONFIG.QUALITY,
    },
  ];
}

/**
 * Encodes image using the specified format
 * @param transformer - Image transformer
 * @param format - Target format
 * @param quality - Encoding quality
 * @returns Encoded image buffer
 */
async function encodeImage(transformer: Transformer, format: ImageFormat, quality: number): Promise<Buffer> {
  switch (format) {
    case 'jpeg':
      return await transformer.jpeg(quality);
    case 'png':
      return await transformer.png();
    case 'webp':
      return await transformer.webp(quality);
  }
}

const METADATA_INACTIVE = { active: 'false' } as const;

/**
 * Generates metadata for Cloud Storage files
 * @param storageData - Storage or image storage data
 * @returns Metadata record for Cloud Storage
 */
function generateMetadata(storageData: StorageData | ImageStorageData): Record<string, string> {
  return {
    firebaseStorageDownloadTokens: v4(),
    active: storageData.active.toString(),
    accessLevel: storageData.accessLevel.toString(),
    ...('width' in storageData && storageData.width && { width: storageData.width.toString() }),
    ...('height' in storageData && storageData.height && { height: storageData.height.toString() }),
    ...(storageData.beginDate && { beginDate: Math.floor(storageData.beginDate.getTime() / 1000).toString() }),
    ...(storageData.endDate && { endDate: Math.floor(storageData.endDate.getTime() / 1000).toString() }),
  };
}

interface FormatOption {
  format: ImageFormat;
  quality: number;
}

interface UploadTask {
  scale: number;
  width: number;
  height: number;
  uploadBases: string[];
}

/**
 * Creates default metadata object with zero/empty values
 * @returns Default metadata structure
 */
function createDefaultMetadata(): ImageStorageMetadata {
  return {
    width: 0,
    height: 0,
    space: '',
    channels: 0,
    chromaSubsampling: '',
    density: 0,
    depth: '',
    format: '',
    hasAlpha: false,
  };
}

/**
 * Creates a metadata result object
 * @param width - Image width
 * @param height - Image height
 * @param format - Image format
 * @returns Metadata result object
 */
function createMetadataResult(width: number, height: number, format: string): ImageStorageMetadata {
  return {
    ...createDefaultMetadata(),
    width,
    height,
    format,
  };
}

/**
 * Resizes an image and uploads it in multiple formats
 * @param bucket - Cloud Storage bucket
 * @param imageBuffer - Original image buffer
 * @param width - Target width
 * @param height - Target height
 * @param tempBase - Base path for temporary files
 * @param formatOptions - Array of format options (jpeg, png, webp)
 * @param uploadBases - Array of upload destination paths
 * @param metadata - Metadata to attach to uploaded files
 * @returns True if all uploads succeed, false otherwise
 */
async function modifyAndUploadImage(
  bucket: Bucket,
  imageBuffer: Buffer,
  width: number,
  height: number,
  tempBase: string,
  formatOptions: FormatOption[],
  uploadBases: string[],
  metadata: Record<string, string>
): Promise<boolean> {
  const tasks = formatOptions.map((option) =>
    (async () => {
      const formatInfo = FORMAT_MAP[option.format];
      const tempPath = `${tempBase}.${formatInfo.extension}`;

      try {
        const transformer = new Transformer(imageBuffer).resize(width, height);
        const output = await encodeImage(transformer, option.format, option.quality);

        await writeFile(tempPath, output);

        await Promise.all(
          uploadBases.map((uploadBase) =>
            bucket.upload(tempPath, {
              destination: `${uploadBase}.${formatInfo.extension}`,
              metadata: {
                contentType: formatInfo.mimeType,
                metadata: metadata,
              },
            })
          )
        );

        return true;
      } catch (err) {
        logger.error(`Failed to process ${option.format} format for ${tempBase}:`, err);
        return false;
      } finally {
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      }
    })()
  );

  const results = await Promise.all(tasks);
  return results.every((result) => result);
}

/**
 * Calculates the scale factors for generating image variations
 * @param size - Original image size (max of width/height)
 * @param minSize - Minimum size for variations
 * @param maxSize - Maximum size for variations
 * @returns Array of scale factors
 */
function getOutputScales(size: number, minSize: number, maxSize: number): number[] {
  const outputs: number[] = [];

  let scale = 1;
  while (size / scale > maxSize) {
    scale *= 2;
  }

  let nextSize = maxSize;
  for (; nextSize >= minSize; nextSize /= 2) {
    if (size / scale <= nextSize) {
      outputs.push(scale);
    } else {
      break;
    }
  }

  for (; nextSize >= minSize; nextSize /= 2) {
    scale *= 2;
    outputs.push(scale);
  }

  return outputs;
}

/**
 * Processes an uploaded image and generates multiple size variations
 * @param object - Storage object data from the trigger
 * @param bucket - Cloud Storage bucket
 * @param file - Cloud Storage file reference
 * @param imageStorageData - Image storage data to populate
 * @returns Image metadata or null if processing fails
 */
async function uploadImage(
  object: StorageObjectData,
  bucket: Bucket,
  file: File,
  imageStorageData: ImageStorageData
): Promise<ImageStorageMetadata | null> {
  const objectName = object.name;
  const objectDir = dirname(objectName);
  const name = basename(objectName); // Keep the extension in the name

  const tempDirectory = join(tmpdir(), objectDir);
  try {
    mkdirSync(tempDirectory, { recursive: true });
  } catch (err) {
    logger.error(`Failed to create temporary directory ${tempDirectory}:`, err);
    return null;
  }

  try {
    await file.setMetadata({ metadata: METADATA_INACTIVE });

    const [imageBuffer] = await file.download();
    const transformer = new Transformer(imageBuffer);
    const metadata = await transformer.metadata();
    if (!metadata) {
      logger.warn(`Unable to read metadata for ${objectName}`);
      return null;
    }

    const { width, height, format } = metadata;
    if (!width || !height || width <= 0 || height <= 0) {
      logger.warn(`Invalid image dimensions for ${objectName}: ${width}x${height}`);
      return createMetadataResult(width ?? 0, height ?? 0, format ?? '');
    }

    imageStorageData.width = width;
    imageStorageData.height = height;
    imageStorageData.path = join(objectDir, `${name}@`);
    imageStorageData.variations = {};

    const uploadTasksMap = new Map<number, UploadTask>();

    let imageSize = IMAGE_CONFIG.MAX_SIZE;
    const outputScales = getOutputScales(Math.max(width, height), IMAGE_CONFIG.MIN_SIZE, imageSize);

    if (outputScales.length === 0) {
      logger.warn(`No output scales generated for image ${objectName} (${width}x${height})`);
      return createMetadataResult(width, height, format ?? '');
    }

    for (const scale of outputScales) {
      const outputPath = join(objectDir, `${name}@${imageSize}`);
      const outputWidth = Math.round(width / scale);
      const outputHeight = Math.round(height / scale);
      imageStorageData.variations[imageSize] = {
        path: outputPath,
        width: outputWidth,
        height: outputHeight,
      };

      const existingTask = uploadTasksMap.get(scale);
      if (existingTask) {
        existingTask.uploadBases.push(outputPath);
      } else {
        uploadTasksMap.set(scale, {
          scale,
          width: outputWidth,
          height: outputHeight,
          uploadBases: [outputPath],
        });
      }

      imageSize /= 2;
    }

    const formats = createFormatOptions();

    const metadataRecord = generateMetadata(imageStorageData);
    const tasks = Array.from(uploadTasksMap.values()).map((task) => {
      const tempPath = join(tempDirectory, `${name}@${task.scale}`);
      return modifyAndUploadImage(
        bucket,
        imageBuffer,
        task.width,
        task.height,
        tempPath,
        formats,
        task.uploadBases,
        metadataRecord
      );
    });

    if (tasks.length === 0) {
      logger.warn(`No processing tasks generated for image ${objectName}`);
      return createMetadataResult(width, height, format ?? '');
    }

    const results = await Promise.all(tasks);

    const failedCount = results.filter((result) => !result).length;
    if (failedCount > 0) {
      logger.warn(`${failedCount} out of ${results.length} image variations failed to upload`);
      return null;
    }

    return createMetadataResult(width, height, format ?? '');
  } catch (err) {
    logger.error(`Failed to process image upload for ${objectName}:`, err);
    return null;
  }
}

function isImageStorageVariation(value: unknown): value is ImageStorageVariation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const variation = value as Partial<ImageStorageVariation>;
  return (
    typeof variation.path === 'string' && typeof variation.width === 'number' && typeof variation.height === 'number'
  );
}

function hasMetadataEntries(metadata?: StorageMetadata | null): metadata is StorageMetadata {
  return Boolean(metadata && Object.keys(metadata).length > 0);
}

function shallowEqualMetadata(a?: StorageMetadata | null, b?: StorageMetadata | null): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => Object.is(a[key], b[key]));
}

/**
 * Cloud Function triggered when an image is uploaded to Cloud Storage
 * Generates multiple size variations and stores metadata in Firestore
 * Memory: 1GiB for large image processing (resize + encode operations)
 * Concurrency: 10 parallel executions
 */
export async function handleUpload(object: StorageUploadEvent): Promise<void> {
  const data = object.data;
  const bucketName = object.bucket ?? data.bucket;

  if (!bucketName || !data.contentType || !data.name || data.name?.includes('@') || data.contentEncoding === 'gzip') {
    return;
  }

  const isImage = isSupportedImageType(data.contentType);
  const objectName = data.name;
  const name = basename(objectName, extname(objectName));

  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(objectName);

  const pathMatch = objectName.match(/^([^/]+)\//);
  if (!pathMatch) {
    return;
  }
  const directoryId = pathMatch[1];

  const directoryDocument = new DirectoryDocument({ directoryId });
  await directoryDocument.get();
  if (!directoryDocument.exists) {
    directoryDocument.data.name = directoryId;
    directoryDocument.data.path = `/${directoryId}`;
    await directoryDocument.save();
  }

  let storageDocument = await StorageCollection.findOneByObjectName(bucketName, data.name);
  if (!storageDocument) {
    storageDocument = new StorageDocument();
    storageDocument.data.name = name;
    storageDocument.data.bucket = bucketName;
    storageDocument.data.objectName = data.name;
    storageDocument.data.originalName = name;
    storageDocument.data.contentType = data.contentType;
    storageDocument.data.path = data.name;
    storageDocument.data.directoryId = directoryId;
    storageDocument.data.accessLevel = 0;
    storageDocument.data.active = true;
  }

  const currentMetadata = (storageDocument.data.metadata ?? undefined) as StorageMetadata | undefined;
  const objectMetadata = (data.metadata ?? undefined) as StorageMetadata | undefined;

  let imageMetadata: ImageStorageMetadata | null = null;
  if (isImage) {
    imageMetadata = await uploadImage(data, bucket, file, storageDocument.data as ImageStorageData);
  }

  const mergedMetadata = {
    ...(hasMetadataEntries(currentMetadata) ? currentMetadata : {}),
    ...(hasMetadataEntries(objectMetadata) ? objectMetadata : {}),
    ...(imageMetadata ?? {}),
  } as StorageMetadata;

  if (Object.keys(mergedMetadata).length === 0) {
    delete storageDocument.data.metadata;
  } else if (!shallowEqualMetadata(currentMetadata, mergedMetadata)) {
    storageDocument.data.metadata = mergedMetadata;
  }

  await storageDocument.save();
}

export const upload = onObjectFinalized({ region: 'asia-northeast1', memory: '1GiB', concurrency: 10 }, handleUpload);

/**
 * Cloud Function triggered when a storage document is updated in Firestore
 * Updates metadata for all image variations in Cloud Storage
 */
export async function handleChange(event: StorageChangeEvent): Promise<void> {
  const change = event.data;

  if (!change?.after?.exists) {
    return;
  }

  const data = change.after.data() as StorageData | undefined;
  if (!data?.bucket) {
    logger.warn('Invalid storage document: missing bucket');
    return;
  }

  if (!isSupportedImageType(data.contentType)) {
    logger.debug('Skipping metadata sync for non-image content type', {
      bucket: data.bucket,
      objectName: data.objectName,
      contentType: data.contentType,
    });
    return;
  }

  const imageData = data as ImageStorageData;
  const { variations } = imageData;

  if (!variations) {
    logger.warn(`No variations found to update for bucket ${data.bucket}`);
    return;
  }

  const bucket = getStorage().bucket(data.bucket);

  const formats = createFormatOptions();
  const extensions = formats.map((opt) => FORMAT_MAP[opt.format].extension);

  const tasks = Object.values(variations)
    .filter((variation): variation is ImageStorageVariation => isImageStorageVariation(variation))
    .flatMap((variation) => {
      return extensions.map((ext) => {
        const file = bucket.file(`${variation.path}.${ext}`);
        return file.setMetadata({ metadata: generateMetadata(imageData) });
      });
    });

  if (tasks.length === 0) {
    logger.warn(`No variations found to update for bucket ${data.bucket}`);
    return;
  }

  try {
    await Promise.all(tasks);
  } catch (err) {
    logger.error(`Failed to update storage metadata for bucket ${data.bucket}:`, err);
  }
}

export const change = onDocumentWritten({ region: 'asia-northeast1', document: '/storage/{storage}' }, handleChange);
