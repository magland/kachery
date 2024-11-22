/* eslint-disable @typescript-eslint/no-explicit-any */
import { VercelRequest, VercelResponse } from "@vercel/node";
import allowCors from "./allowCors"; // remove .js for local dev
import { getMongoClient } from "./getMongoClient"; // remove .js for local dev
import {
  AddZoneResponse,
  AddUserResponse,
  ComputeUserStatsResponse,
  DeleteZoneResponse,
  KacheryZone,
  KacheryUser,
  GetZoneResponse,
  GetZonesResponse,
  ResetUserApiKeyResponse,
  SetZoneInfoResponse,
  SetUserInfoResponse,
  UserStats,
  isAddZoneRequest,
  isAddUserRequest,
  isComputeUserStatsRequest,
  isDeleteZoneRequest,
  isKacheryZone,
  isKacheryUser,
  isGetZoneRequest,
  isGetZonesRequest,
  isResetUserApiKeyRequest,
  isSetZoneInfoRequest,
  isSetUserInfoRequest,
  isInitiateFileUploadRequest,
  InitiateFileUploadResponse,
  isFinalizeFileUploadRequest,
  FinalizeFileUploadResponse,
  isFindFileRequest,
  FindFileResponse,
} from "./types"; // remove .js for local dev
import { initiateUpload, finalizeUpload, findFile } from "./core"; // remove .js for local dev

const dbName = "kachery";

const collectionNames = {
  users: "users",
  zones: "zones",
};

// addZone handler
export const addZoneHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isAddZoneRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const { zoneName, userId } = rr;
    try {
      const gitHubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (
        !(await authenticateUserUsingGitHubToken(userId, gitHubAccessToken))
      ) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const zone = await fetchZone(zoneName, { includeCredentials: false });
      if (zone) {
        res.status(500).json({ error: "Zone with this name already exists." });
        return;
      }
      const newZone: KacheryZone = {
        zoneName,
        userId,
        users: [],
        publicDownload: true,
      };
      await insertZone(newZone);
      const resp: AddZoneResponse = {
        type: "addZoneResponse",
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// getZone handler
export const getZoneHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isGetZoneRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const zone = await fetchZone(rr.zoneName, { includeCredentials: false });
      if (!zone) {
        res.status(404).json({ error: `Zone not found: ${rr.zoneName}` });
        return;
      }
      const resp: GetZoneResponse = {
        type: "getZoneResponse",
        zone,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// getZones handler
export const getZonesHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const rr = req.body;
      if (!isGetZonesRequest(rr)) {
        res.status(400).json({ error: "Invalid request" });
        return;
      }
      const { userId } = rr;
      const zones = userId
        ? await fetchZonesForUser(userId, { includeCredentials: false })
        : await fetchAllZones();
      const resp: GetZonesResponse = {
        type: "getZonesResponse",
        zones,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// deleteZone handler
export const deleteZoneHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isDeleteZoneRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const zone = await fetchZone(rr.zoneName, { includeCredentials: false });
      if (!zone) {
        res.status(404).json({ error: `Zone not found: ${rr.zoneName}` });
        return;
      }
      const gitHubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (
        !(await authenticateUserUsingGitHubToken(
          zone.userId,
          gitHubAccessToken,
        ))
      ) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      await deleteZone(rr.zoneName);
      const resp: DeleteZoneResponse = {
        type: "deleteZoneResponse",
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// setZoneInfo handler
export const setZoneInfoHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isSetZoneInfoRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const zone = await fetchZone(rr.zoneName, { includeCredentials: true });
      if (!zone) {
        res.status(404).json({ error: `Zone not found: ${rr.zoneName}` });
        return;
      }
      const gitHubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!gitHubAccessToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const userId = await getUserIdForGitHubAccessToken(gitHubAccessToken);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!userIsAdminForZone(zone, userId)) {
        res.status(401).json({
          error: `User ${userId} is not authorized to modify this zone.`,
        });
        return;
      }
      const update: { [key: string]: any } = {};
      if (rr.users !== undefined) update["users"] = rr.users;
      if (rr.publicDownload !== undefined)
        update["publicDownload"] = rr.publicDownload;
      if (rr.bucketUri !== undefined) update["bucketUri"] = rr.bucketUri;
      if (rr.credentials !== undefined) update["credentials"] = rr.credentials;
      if (rr.directory !== undefined) update["directory"] = rr.directory;
      await updateZone(rr.zoneName, update);
      const resp: SetZoneInfoResponse = {
        type: "setZoneInfoResponse",
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// addUser handler
export const addUserHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isAddUserRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const githubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
    if (
      !(await authenticateUserUsingGitHubToken(rr.userId, githubAccessToken))
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await fetchUser(rr.userId);
    if (user !== null) {
      res.status(400).json({ error: "User already exists" });
      return;
    }
    try {
      const user: KacheryUser = {
        userId: rr.userId,
        name: "",
        email: "",
        apiKey: null,
      };
      await insertUser(user);
      const resp: AddUserResponse = {
        type: "addUserResponse",
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// resetUserApiKey handler
export const resetUserApiKeyHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isResetUserApiKeyRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const githubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
    if (
      !(await authenticateUserUsingGitHubToken(rr.userId, githubAccessToken))
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    let user: KacheryUser | null = await fetchUser(rr.userId);
    if (user === null) {
      user = {
        userId: rr.userId,
        name: "",
        email: "",
        apiKey: null,
      };
      await insertUser(user);
    }
    try {
      const apiKey = generateUserApiKey();
      user.apiKey = apiKey;
      await updateUser(rr.userId, { apiKey });
      const resp: ResetUserApiKeyResponse = {
        type: "resetUserApiKeyResponse",
        apiKey,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// setUserInfo handler
export const setUserInfoHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isSetUserInfoRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const githubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
    if (
      !(await authenticateUserUsingGitHubToken(rr.userId, githubAccessToken))
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const update: { [key: string]: any } = {};
      if (rr.name !== undefined) update["name"] = rr.name;
      if (rr.email !== undefined) update["email"] = rr.email;
      await updateUser(rr.userId, update);
      const resp: SetUserInfoResponse = {
        type: "setUserInfoResponse",
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

export const initiateFileUploadHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isInitiateFileUploadRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { size, hashAlg, hash, zoneName } = rr;
      const authorizationToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!authorizationToken) {
        res.status(400).json({ error: "User API token must be provided" });
        return;
      }
      const userId = await getUserIdFromApiToken(authorizationToken);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized - no user for token" });
        return;
      }
      const zone = await fetchZone(zoneName, { includeCredentials: true });
      if (!zone) {
        res.status(400).json({ error: `Zone not found: ${zoneName}` });
        return;
      }
      if (!userIsAllowedToUploadFilesForZone(zone, userId)) {
        res.status(401).json({
          error: "This user is not allowed to upload files to this zone",
        });
        return;
      }
      const { alreadyExists, alreadyPending, signedUploadUrl, objectKey } =
        await initiateUpload({
          zone,
          userId,
          size,
          hash,
          hashAlg,
        });
      const resp: InitiateFileUploadResponse = {
        type: "initiateFileUploadResponse",
        alreadyExists,
        alreadyPending,
        signedUploadUrl,
        objectKey,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

export const finalizeFileUploadHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isFinalizeFileUploadRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { size, hashAlg, hash, zoneName, objectKey } = rr;
      const authorizationToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!authorizationToken) {
        res.status(400).json({ error: "User API token must be provided" });
        return;
      }
      const userId = await getUserIdFromApiToken(authorizationToken);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized - no user for token" });
        return;
      }
      const zone = await fetchZone(zoneName, { includeCredentials: true });
      if (!zone) {
        res.status(400).json({ error: `Zone not found: ${zoneName}` });
        return;
      }
      if (!userIsAllowedToUploadFilesForZone(zone, userId)) {
        res.status(401).json({
          error: "This user is not allowed to upload files to this zone",
        });
        return;
      }
      const { success } = await finalizeUpload({
        zone,
        userId,
        size,
        hash,
        hashAlg,
        objectKey,
      });
      const resp: FinalizeFileUploadResponse = {
        type: "finalizeFileUploadResponse",
        success,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

export const findFileHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isFindFileRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { hashAlg, hash, zoneName } = rr;
      const zone = await fetchZone(zoneName, { includeCredentials: true });
      if (!zone) {
        res.status(400).json({ error: `Zone not found: ${zoneName}` });
        return;
      }
      const authorizationToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      let userId: string | undefined = undefined;
      if (authorizationToken) {
        userId = await getUserIdFromApiToken(authorizationToken);
        if (!userId) {
          res.status(401).json({ error: "Unauthorized - no user for token" });
          return;
        }
      }
      if (!zone.publicDownload) {
        if (!userId) {
          res
            .status(401)
            .json({
              error:
                "User API token must be provided when zone does not allow public download",
            });
          return;
        }
        if (!userIsAllowedToDownloadFilesForZone(zone, userId)) {
          res.status(401).json({
            error: "This user is not allowed to download files from this zone",
          });
          return;
        }
      }
      const { found, url, size, bucketUri, objectKey, cacheHit } =
        await findFile({
          zone,
          userId,
          hash,
          hashAlg,
        });
      const resp: FindFileResponse = {
        type: "findFileResponse",
        found,
        url,
        size,
        bucketUri,
        objectKey,
        cacheHit,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

////////////////////////////////////////

// const authenticateUserUsingApiToken = async (
//   userId: string,
//   authorizationToken: string | undefined,
// ): Promise<boolean> => {
//   const user = await fetchUser(userId);
//   if (!user) return false;
//   if (user.apiKey !== authorizationToken) return false;
//   return true;
// };

const getUserIdFromApiToken = async (
  authorizationToken: string,
): Promise<string> => {
  const user = await fetchUserForApiToken(authorizationToken);
  if (!user) return "";
  return user.userId;
};

const authenticateUserUsingGitHubToken = async (
  userId: string,
  gitHubAccessToken: string | undefined,
): Promise<boolean> => {
  if (!gitHubAccessToken) return false;
  const githubUserId = await getUserIdForGitHubAccessToken(gitHubAccessToken);
  return userId === githubUserId;
};

const fetchZone = async (
  zoneName: string,
  o: { includeCredentials: boolean },
): Promise<KacheryZone | null> => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  const zone = await collection.findOne({ zoneName });
  if (!zone) return null;
  removeMongoId(zone);
  if (!isKacheryZone(zone)) {
    throw Error("Invalid zone in database");
  }
  if (!o.includeCredentials) {
    zone.credentials = zone.credentials ? "********" : undefined;
  }
  return zone;
};

const fetchZonesForUser = async (
  userId: string,
  o: { includeCredentials: boolean },
): Promise<KacheryZone[]> => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  const zones = await collection.find({ userId }).toArray();
  for (const zone of zones) {
    removeMongoId(zone);
    if (!isKacheryZone(zone)) {
      throw Error("Invalid zone in database");
    }
    if (!o.includeCredentials) {
      zone.credentials = zone.credentials ? "********" : undefined;
    }
  }
  return zones.map((zone: any) => zone as KacheryZone);
};

const fetchAllZones = async (): Promise<KacheryZone[]> => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  const zones = await collection.find({}).toArray();
  for (const zone of zones) {
    removeMongoId(zone);
    if (!isKacheryZone(zone)) {
      throw Error("Invalid zone in database");
    }
  }
  return zones.map((zone: any) => zone as KacheryZone);
};

const insertZone = async (zone: KacheryZone) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  await collection.updateOne(
    { zoneName: zone.zoneName },
    { $setOnInsert: zone },
    { upsert: true },
  );
};

const deleteZone = async (zoneName: string) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  await collection.deleteOne({ zoneName });
};

const updateZone = async (zoneName: string, update: any) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.zones);
  // we want undefined values to be unset
  const updateSet: { [key: string]: any } = {};
  const updateUnset: { [key: string]: any } = {};
  for (const key in update) {
    if (update[key] === undefined) {
      updateUnset[key] = ""; // just need to set it to something
    } else {
      updateSet[key] = update[key];
    }
  }
  await collection.updateOne(
    { zoneName },
    { $set: updateSet, $unset: updateUnset },
  );
};

const fetchUser = async (userId: string) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.users);
  const user = await collection.findOne({ userId });
  if (!user) return null;
  removeMongoId(user);
  if (!isKacheryUser(user)) {
    throw Error("Invalid user in database");
  }
  return user;
};

const fetchUserForApiToken = async (apiKey: string) => {
  if (!apiKey) return null;
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.users);
  const user = await collection.findOne({ apiKey });
  if (!user) return null;
  removeMongoId(user);
  if (!isKacheryUser(user)) {
    throw Error("Invalid user in database");
  }
  return user;
};

const insertUser = async (user: KacheryUser) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.users);
  await collection.updateOne(
    { userId: user.userId },
    { $setOnInsert: user },
    { upsert: true },
  );
};

const updateUser = async (userId: string, update: any) => {
  const client = await getMongoClient();
  const collection = client.db(dbName).collection(collectionNames.users);
  // we want undefined values to be unset
  const updateSet: { [key: string]: any } = {};
  const updateUnset: { [key: string]: any } = {};
  for (const key in update) {
    if (update[key] === undefined) {
      updateUnset[key] = ""; // just need to set it to something
    } else {
      updateSet[key] = update[key];
    }
  }
  await collection.updateOne(
    { userId },
    { $set: updateSet, $unset: updateUnset },
  );
};

const removeMongoId = (x: any) => {
  if (x === null) return;
  if (typeof x !== "object") return;
  if ("_id" in x) delete x["_id"];
};

const gitHubUserIdCache: { [accessToken: string]: string } = {};
const getUserIdForGitHubAccessToken = async (gitHubAccessToken: string) => {
  if (gitHubUserIdCache[gitHubAccessToken]) {
    return gitHubUserIdCache[gitHubAccessToken];
  }

  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${gitHubAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user id");
  }

  const data = await response.json();
  const userId = "github|" + data.login;
  gitHubUserIdCache[gitHubAccessToken] = userId;
  return userId;
};

const generateUserApiKey = () => {
  return generateRandomId(32);
};

const generateRandomId = (len: number) => {
  const choices =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const numChoices = choices.length;
  let ret = "";
  for (let i = 0; i < len; i++) {
    ret += choices[Math.floor(Math.random() * numChoices)];
  }
  return ret;
};

const userIsAllowedToUploadFilesForZone = (
  zone: KacheryZone,
  userId: string,
) => {
  if (zone.userId === userId) return true;
  const u = zone.users.find((u) => u.userId === userId);
  if (!u) return false;
  return u.uploadFiles;
};

const userIsAllowedToDownloadFilesForZone = (
  zone: KacheryZone,
  userId: string,
) => {
  if (zone.userId === userId) return true;
  if (zone.publicDownload) return true;
  const u = zone.users.find((u) => u.userId === userId);
  if (!u) return false;
  return u.downloadFiles;
};

const userIsAdminForZone = (zone: KacheryZone, userId: string) => {
  if (zone.userId === userId) return true;
  const u = zone.users.find((u) => u.userId === userId);
  if (!u) return false;
  return u.admin;
};

// computeUserStats handler
export const computeUserStatsHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isComputeUserStatsRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const userId = rr.userId;
      const userStats: UserStats = {
        userId,
      };
      const resp: ComputeUserStatsResponse = {
        type: "computeUserStatsResponse",
        userStats,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = (
  obj: any,
  space: string | number | undefined = undefined,
) => {
  const allKeys: string[] = [];
  JSON.stringify(obj, function (key, value) {
    allKeys.push(key);
    return value;
  });
  allKeys.sort();
  return JSON.stringify(obj, allKeys, space);
};
