import { getMongoClient } from "./getMongoClient"; // remove .js for local dev
import {
  createSignedUploadUrl,
  createSignedDownloadUrl,
  checkFileExists,
} from "./signedUrls"; // remove .js for local dev
import { KacheryZone } from "./types"; // remove .js for local dev

export const initiateUpload = async (a: {
  zone: KacheryZone;
  userId: string;
  size: number;
  hash: string;
  hashAlg: string;
}): Promise<{
  alreadyExists: boolean;
  alreadyPending: boolean;
  signedUploadUrl?: string;
  objectKey?: string;
}> => {
  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  if (a.size > maxSizeForZone(a.zone)) {
    throw Error(
      `File size exceeds maximum for zone: ${a.size} > ${maxSizeForZone(a.zone)}`,
    );
  }
  if (a.hashAlg !== "sha1") {
    throw Error(`Unsupported hash algorithm: ${a.hashAlg}`);
  }
  if (!isValidSha1(a.hash)) {
    throw Error(`Invalid hash: ${a.hash}`);
  }
  const exists = await checkFileExists({
    zone: a.zone,
    hash: a.hash,
    hashAlg: a.hashAlg,
  });
  if (exists) {
    return {
      alreadyExists: true,
      alreadyPending: false,
    };
  }
  // note: already pending is always going to be false, because it's tricky to
  // know how to do this right since we can't track whether an upload got
  // interrupted
  const { signedUploadUrl, objectKey } = await createSignedUploadUrl({
    zone: a.zone,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
  });
  await recordUpload({
    stage: "initiate",
    timestamp: Date.now(),
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey,
  });
  return {
    alreadyExists: false,
    alreadyPending: false,
    signedUploadUrl,
    objectKey,
  };
};

export const finalizeUpload = async (a: {
  zone: KacheryZone;
  userId: string;
  size: number;
  hash: string;
  hashAlg: string;
  objectKey: string;
}): Promise<{
  success: boolean;
}> => {
  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  await recordUpload({
    stage: "finalize",
    timestamp: Date.now(),
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
  });
  return {
    success: true,
  };
};

const signedDownloadUrlMemoryCache = new Map<
  string,
  {
    url: string;
    expires: number;
    size: number;
    bucketUri: string;
    objectKey: string;
  }
>();

export const findFile = async (a: {
  zone: KacheryZone;
  userId: string | undefined;
  hash: string;
  hashAlg: string;
}): Promise<{
  found: boolean;
  url?: string;
  size?: number;
  bucketUri?: string;
  objectKey?: string;
  cacheHit?: boolean;
}> => {
  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }

  // first check the memory cache
  const k = `${a.zone.zoneName}:${a.hashAlg}:${a.hash}`;
  const cached = signedDownloadUrlMemoryCache.get(k);
  if (cached) {
    if (cached.expires > Date.now()) {
      return {
        found: true,
        url: cached.url,
        size: cached.size,
        bucketUri: cached.bucketUri,
        objectKey: cached.objectKey,
        cacheHit: true,
      };
    } else {
      signedDownloadUrlMemoryCache.delete(k);
    }
  }

  const d = await findRecordedDownload({
    zone: a.zone,
    hash: a.hash,
    hashAlg: a.hashAlg,
    minimumTimestamp: Date.now() - 1000 * 60 * 10, // last 10 minutes
  });
  if (d) {
    return {
      found: true,
      url: d.downloadUrl,
      size: d.size,
      bucketUri: a.zone.bucketUri,
      objectKey: d.objectKey,
      cacheHit: true,
    };
  }

  const { found, signedDownloadUrl, size, objectKey } =
    await createSignedDownloadUrl({
      zone: a.zone,
      hash: a.hash,
      hashAlg: a.hashAlg,
    });

  if (!found) {
    return {
      found: false,
    };
  }

  await recordDownload({
    timestamp: Date.now(),
    zone: a.zone,
    userId: a.userId || "",
    size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey,
    downloadUrl: signedDownloadUrl,
  });

  signedDownloadUrlMemoryCache.set(k, {
    url: signedDownloadUrl,
    expires: Date.now() + 1000 * 60 * 10,
    size,
    bucketUri: a.zone.bucketUri,
    objectKey,
  });

  return {
    found: true,
    url: signedDownloadUrl,
    size,
    bucketUri: a.zone.bucketUri,
    objectKey,
  };
};

const dbName = "kachery";
const collectionNames = {
  uploadRecords: "uploadRecords",
  downloadRecords: "downloadRecords",
};

const recordUpload = async (a: {
  stage: "initiate" | "finalize";
  timestamp: number;
  zone: KacheryZone;
  userId: string;
  size: number;
  hash: string;
  hashAlg: string;
  objectKey: string;
}) => {
  const client = await getMongoClient();
  const collection = client
    .db(dbName)
    .collection(collectionNames.uploadRecords);
  await collection.insertOne({
    stage: a.stage,
    timestamp: a.timestamp,
    zoneName: a.zone.zoneName,
    bucketUri: a.zone.bucketUri,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
  });
};

const recordDownload = async (a: {
  timestamp: number;
  zone: KacheryZone;
  userId: string;
  size: number;
  hash: string;
  hashAlg: string;
  objectKey: string;
  downloadUrl: string;
}) => {
  const client = await getMongoClient();
  const collection = client
    .db(dbName)
    .collection(collectionNames.downloadRecords);
  await collection.insertOne({
    timestamp: a.timestamp,
    zoneName: a.zone.zoneName,
    bucketUri: a.zone.bucketUri,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
    downloadUrl: a.downloadUrl,
  });
};

const findRecordedDownload = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
  minimumTimestamp: number;
}): Promise<{
  downloadUrl: string;
  size: number;
  objectKey: string;
} | null> => {
  const client = await getMongoClient();
  const collection = client
    .db(dbName)
    .collection(collectionNames.downloadRecords);
  const doc = await collection.findOne({
    zoneName: a.zone.zoneName,
    hash: a.hash,
    hashAlg: a.hashAlg,
    timestamp: { $gte: a.minimumTimestamp },
  });
  if (!doc) return null;
  return {
    downloadUrl: doc.downloadUrl,
    size: doc.size,
    objectKey: doc.objectKey,
  };
};

const maxSizeForZone = (zone: KacheryZone) => {
  if (zone.zoneName === "default") {
    return 1000 * 1000 * 200;
  }
  return 1000 * 1000 * 1000;
};

const isValidSha1 = (hash: string) => {
  return /^[0-9a-f]{40}$/.test(hash);
};
