import {
  Bucket,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  objectExists,
} from "./s3Helpers"; // remove .js for local dev
import { KacheryZone } from "./types"; // remove .js for local dev

export const createSignedDownloadUrl = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
}): Promise<{
  found: boolean;
  signedDownloadUrl: string;
  size: number;
  objectKey: string;
}> => {
  if (a.hashAlg !== "sha1") {
    throw Error(`Unsupported hash algorithm: ${a.hashAlg}`);
  }
  const h = a.hash;
  const objectKey = joinKeys(
    a.zone.directory || "",
    `${a.hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${a.hash}`,
  );

  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  if (!a.zone.credentials) {
    throw Error(`Credentials not set for zone: ${a.zone.zoneName}`);
  }
  const bucket: Bucket = {
    uri: a.zone.bucketUri,
    credentials: a.zone.credentials,
  };
  const { exists, size } = await objectExists(bucket, objectKey);
  if (!exists) {
    return {
      found: false,
      signedDownloadUrl: "",
      size: 0,
      objectKey,
    };
  }

  const url = await getSignedDownloadUrl(bucket, objectKey, 60 * 60);

  return {
    found: true,
    signedDownloadUrl: url,
    size: size || 0,
    objectKey,
  };
};

export const checkFileExists = async (a: {
  zone: KacheryZone;
  hash: string;
  hashAlg: string;
}): Promise<boolean> => {
  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  const h = a.hash;
  const objectKey = joinKeys(
    a.zone.directory || "",
    `${a.hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${a.hash}`,
  );

  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  if (!a.zone.credentials) {
    throw Error(`Credentials not set for zone: ${a.zone.zoneName}`);
  }
  const bucket: Bucket = {
    uri: a.zone.bucketUri,
    credentials: a.zone.credentials,
  };
  const { exists } = await objectExists(bucket, objectKey);
  return exists;
};

export const createSignedUploadUrl = async (a: {
  zone: KacheryZone;
  size: number;
  hash: string;
  hashAlg: string;
}): Promise<{
  signedUploadUrl: string;
  objectKey: string;
}> => {
  if (a.hashAlg !== "sha1") {
    throw Error(`Unsupported hash algorithm: ${a.hashAlg}`);
  }
  const h = a.hash;
  const objectKey = joinKeys(
    a.zone.directory || "",
    `${a.hashAlg}/${h[0]}${h[1]}/${h[2]}${h[3]}/${h[4]}${h[5]}/${a.hash}`,
  );
  if (!a.zone.bucketUri) {
    throw Error(`Bucket URI not set for zone: ${a.zone.zoneName}`);
  }
  if (!a.zone.credentials) {
    throw Error(`Credentials not set for zone: ${a.zone.zoneName}`);
  }
  const bucket: Bucket = {
    uri: a.zone.bucketUri,
    credentials: a.zone.credentials,
  };
  const url = await getSignedUploadUrl(bucket, objectKey);

  return {
    signedUploadUrl: url,
    objectKey,
  };
};

export const joinKeys = (a: string, b: string) => {
  if (!a) return b;
  if (!b) return a;
  if (a.endsWith("/")) return a + b;
  else return a + "/" + b;
};
