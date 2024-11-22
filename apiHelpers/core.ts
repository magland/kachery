import { getMongoClient } from "./getMongoClient"; // remove .js for local dev
import { createSignedUploadUrl, createSignedDownloadUrl } from "./signedUrls"; // remove .js for local dev
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
  const { found } = await findFile({
    zone: a.zone,
    userId: a.userId,
    hash: a.hash,
    hashAlg: a.hashAlg,
  });
  if (found) {
    return {
      alreadyExists: true,
      alreadyPending: false,
    };
  }
  const pendingUpload = await getPendingUpload({
    zone: a.zone,
    hash: a.hash,
    hashAlg: a.hashAlg,
  });
  if (pendingUpload) {
    return {
      alreadyExists: false,
      alreadyPending: true,
    };
  }
  let signedUploadUrl: string;
  let objectKey: string;
  try {
    await setPendingUpload({
      zone: a.zone,
      hash: a.hash,
      hashAlg: a.hashAlg,
    });
    const x = await createSignedUploadUrl({
      zone: a.zone,
      size: a.size,
      hash: a.hash,
      hashAlg: a.hashAlg,
    });
    signedUploadUrl = x.signedUploadUrl;
    objectKey = x.objectKey;
  } finally {
    await clearPendingUpload({
      zone: a.zone,
      hash: a.hash,
      hashAlg: a.hashAlg,
    });
  }
  await recordUpload({
    stage: "initiate",
    timestamp: Date.now(),
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey,
    bucketUri: a.zone.bucketUri,
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
  await recordDownload({
    stage: "finalize",
    timestamp: Date.now(),
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
    bucketUri: a.zone.bucketUri,
  });
  return {
    success: true,
  };
};

const signedDownloadUrlCache = new Map<
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
  const k = `${a.zone.zoneName}:${a.hashAlg}:${a.hash}`;
  const cached = signedDownloadUrlCache.get(k);
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
      signedDownloadUrlCache.delete(k);
    }
  }

  const { signedDownloadUrl, size, objectKey } = await createSignedDownloadUrl({
    zone: a.zone,
    hash: a.hash,
    hashAlg: a.hashAlg,
  });

  signedDownloadUrlCache.set(k, {
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
  bucketUri: string;
}) => {
  const client = await getMongoClient();
  const collection = client
    .db(dbName)
    .collection(collectionNames.uploadRecords);
  await collection.insertOne({
    stage: a.stage,
    timestamp: a.timestamp,
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
    bucketUri: a.bucketUri,
  });
};

const recordDownload = async (a: {
  stage: "initiate" | "finalize";
  timestamp: number;
  zone: KacheryZone;
  userId: string;
  size: number;
  hash: string;
  hashAlg: string;
  objectKey: string;
  bucketUri: string;
}) => {
  const client = await getMongoClient();
  const collection = client
    .db(dbName)
    .collection(collectionNames.downloadRecords);
  await collection.insertOne({
    stage: a.stage,
    timestamp: a.timestamp,
    zone: a.zone,
    userId: a.userId,
    size: a.size,
    hash: a.hash,
    hashAlg: a.hashAlg,
    objectKey: a.objectKey,
    bucketUri: a.bucketUri,
  });
};

// NOTE: the following in-memory check only works when the requests are coming into the same 'serverless' server
// To be more rigorous, we should use a database. But not going to do that for now.
const pendingUploadCache = new Map<
  string,
  {
    expires: number;
  }
>();

const getPendingUpload = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
}): Promise<boolean> => {
  const k = `${a.zone.zoneName}:${a.hashAlg}:${a.hash}`;
  const cached = pendingUploadCache.get(k);
  if (cached) {
    if (cached.expires > Date.now()) {
      return true;
    } else {
      pendingUploadCache.delete(k);
    }
  }
  return false;
};

const setPendingUpload = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
}) => {
  const k = `${a.zone.zoneName}:${a.hashAlg}:${a.hash}`;
  pendingUploadCache.set(k, {
    expires: Date.now() + 1000 * 60 * 30,
  });
};

const clearPendingUpload = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
}) => {
  const k = `${a.zone.zoneName}:${a.hashAlg}:${a.hash}`;
  pendingUploadCache.delete(k);
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
