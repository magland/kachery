/* eslint-disable @typescript-eslint/no-explicit-any */
import { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
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
  isGetUserRequest,
  GetUserResponse,
  isUsageRequest,
  UserZoneDayUsage,
  UsageResponse,
} from "./types"; // remove .js for local dev
import {
  initiateUpload,
  finalizeUpload,
  findFile,
  fetchDownloadRecords,
  fetchUploadRecords,
  DownloadRecord,
  UploadRecord,
} from "./core"; // remove .js for local dev

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
      if (!isValidZoneName(zoneName)) {
        res.status(400).json({ error: "Invalid zone name" });
        return;
      }
      if (!isValidUserId(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const gitHubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (
        !(await authenticateUserUsingGitHubToken(userId, gitHubAccessToken))
      ) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!isAdminUser(userId)) {
        // only admin can add zones for now
        res.status(401).json({ error: "Only admin can add zones" });
        return;
      }
      const zone = await fetchZone(zoneName, {
        includeCredentials: false,
        checkCache: false,
      });
      if (zone) {
        res.status(500).json({ error: "Zone with this name already exists." });
        return;
      }
      const newZone: KacheryZone = {
        zoneName,
        userId,
        users: [],
        publicDownload: true,
        publicUpload: false,
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
      if (!isValidZoneName(rr.zoneName)) {
        res.status(400).json({ error: "Invalid zone name" });
        return;
      }
      const zone = await fetchZone(rr.zoneName, {
        includeCredentials: false,
        checkCache: false,
      });
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
      if (!isValidUserId(userId || "")) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
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
      if (!isValidZoneName(rr.zoneName)) {
        res.status(400).json({ error: "Invalid zone name" });
        return;
      }
      const zone = await fetchZone(rr.zoneName, {
        includeCredentials: false,
        checkCache: false,
      });
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
      if (!isValidZoneName(rr.zoneName)) {
        res.status(400).json({ error: "Invalid zone name" });
        return;
      }
      const zone = await fetchZone(rr.zoneName, {
        includeCredentials: true,
        checkCache: false,
      });
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
      if (rr.publicUpload !== undefined)
        update["publicUpload"] = rr.publicUpload;
      if (rr.bucketUri !== undefined) {
        if (!isValidBucketUri(rr.bucketUri)) {
          res.status(400).json({ error: "Invalid bucket URI" });
          return;
        }
        update["bucketUri"] = rr.bucketUri;
      }
      if (rr.credentials !== undefined) {
        if (!isValidCredentials(rr.credentials)) {
          res.status(400).json({ error: "Invalid credentials" });
          return;
        }
        update["credentials"] = rr.credentials;
      }
      if (rr.directory !== undefined) {
        if (!isValidDirectory(rr.directory)) {
          res.status(400).json({ error: "Invalid directory" });
          return;
        }
        update["directory"] = rr.directory;
      }
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
    if (!isValidUserId(rr.userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const user = await fetchUser(rr.userId, { checkCache: false });
    if (user !== null) {
      res.status(400).json({ error: "User already exists" });
      return;
    }
    try {
      const user: KacheryUser = {
        userId: rr.userId,
        name: "",
        email: "",
        researchDescription: "",
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
    let user: KacheryUser | null = await fetchUser(rr.userId, {
      checkCache: false,
    });
    if (user === null) {
      user = {
        userId: rr.userId,
        name: "",
        email: "",
        researchDescription: "",
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
      if (rr.name !== undefined) {
        if (!isValidName(rr.name)) {
          res.status(400).json({ error: "Invalid name" });
          return;
        }
        update["name"] = rr.name;
      }
      if (rr.email !== undefined) {
        if (isValidEmail(rr.email)) {
          update["email"] = rr.email;
        }
      }
      if (rr.researchDescription !== undefined) {
        if (!isValidResearchDescription(rr.researchDescription)) {
          res.status(400).json({ error: "Invalid research description" });
          return;
        }
        update["researchDescription"] = rr.researchDescription;
      }
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

// getUser handler
export const getUserHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const rr = req.body;
    if (!isGetUserRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const githubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!githubAccessToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const authUserId = await getUserIdForGitHubAccessToken(githubAccessToken);
      if (!authUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (authUserId !== rr.userId && !isAdminUser(authUserId)) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const user = await fetchUser(rr.userId, { checkCache: false });
      if (!user) {
        res.status(404).json({ error: `User not found: ${rr.userId}` });
        return;
      }
      user.apiKey = user.apiKey ? "********" : "";
      const resp: GetUserResponse = {
        type: "getUserResponse",
        user,
      };
      res.status(200).json(resp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// getUsers handler
export const getUsersHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const githubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!githubAccessToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const authUserId = await getUserIdForGitHubAccessToken(githubAccessToken);
      if (!authUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!isAdminUser(authUserId)) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const client = await getMongoClient();
      const collection = client.db(dbName).collection(collectionNames.users);
      const users = await collection.find({}).toArray();
      for (const user of users) {
        removeMongoId(user);
        if (!isKacheryUser(user)) {
          throw Error("Invalid user in database");
        }
        user.apiKey = user.apiKey ? "********" : "";
      }
      res.status(200).json({ users });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  },
);

// initiateFileUpload handler
export const initiateFileUploadHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isInitiateFileUploadRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { size, hashAlg, hash, zoneName, workToken } = rr;
      if (!isValidHash(hash, hashAlg)) {
        res.status(400).json({ error: "Invalid hash" });
        return;
      }
      const apiToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!apiToken) {
        if (zoneName !== "scratch") {
          res.status(400).json({
            error: `User API token must be provided for zone ${zoneName}`,
          });
          return;
        }
      }
      checkWorkToken(workToken, hash);
      let userId: string = "";
      if (apiToken) {
        userId = await getUserIdFromApiToken(apiToken);
        if (!userId) {
          res.status(401).json({ error: "Unauthorized - no user for token" });
          return;
        }
        const user = await fetchUser(userId, { checkCache: true });
        if (!user) {
          res.status(400).json({ error: `User not found: ${userId}` });
          return;
        }
        if (!user.email) {
          res
            .status(400)
            .json({ error: `User email not set for user: ${userId}` });
          return;
        }
        if (!user.researchDescription) {
          res.status(400).json({
            error: `User research description not set for user: ${userId}`,
          });
          return;
        }
        if (!user.name) {
          res.status(400).json({ error: `Name not set for user: ${userId}` });
          return;
        }
      }
      const zone = await fetchZone(zoneName, {
        includeCredentials: true,
        checkCache: true,
      });
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

// finalizeFileUpload handler
export const finalizeFileUploadHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isFinalizeFileUploadRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { size, hashAlg, hash, zoneName, objectKey } = rr;
      if (!isValidHash(hash, hashAlg)) {
        res.status(400).json({ error: "Invalid hash" });
        return;
      }
      const authorizationToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!authorizationToken) {
        if (zoneName !== "scratch") {
          res.status(400).json({
            error: `User API token must be provided for zone ${zoneName}`,
          });
          return;
        }
      }
      let userId: string = "";
      if (authorizationToken) {
        userId = await getUserIdFromApiToken(authorizationToken);
        if (!userId) {
          res.status(401).json({ error: "Unauthorized - no user for token" });
          return;
        }
      }
      const zone = await fetchZone(zoneName, {
        includeCredentials: true,
        checkCache: true,
      });
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

// findFile handler
export const findFileHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isFindFileRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const { hashAlg, hash, zoneName } = rr;
      if (!isValidHash(hash, hashAlg)) {
        res.status(400).json({ error: "Invalid hash" });
        return;
      }
      const zone = await fetchZone(zoneName, {
        includeCredentials: true,
        checkCache: true,
      });
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
          res.status(401).json({
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

const isValidHash = (hash: string, hashAlg: string) => {
  if (hashAlg !== "sha1") return false;
  if (!/^[0-9a-f]{40}$/.test(hash)) return false;
  return true;
};

const isValidZoneName = (zoneName: string) => {
  if (zoneName.length > 100) return false;
  return true;
};

const isValidUserId = (userId: string) => {
  if (userId.length > 100) return false;
  return true;
};

const isValidName = (name: string) => {
  if (name.length > 200) return false;
  return true;
};

const isValidEmail = (email: string) => {
  if (email.length > 200) return false;
  return true;
};

const isValidResearchDescription = (researchDescription: string) => {
  if (researchDescription.length > 2000) return false;
  return true;
};

const isValidBucketUri = (bucketUri: string) => {
  if (bucketUri.length > 200) return false;
  return true;
};

const isValidCredentials = (credentials: string) => {
  if (credentials.length > 2000) return false;
  return true;
};

const isValidDirectory = (directory: string) => {
  if (directory.length > 200) return false;
  return true;
};

const getUserIdFromApiToken = async (
  authorizationToken: string,
): Promise<string> => {
  const user = await fetchUserForApiToken(authorizationToken, {
    checkCache: true,
  });
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

const zoneMemoryCache: {
  [zoneName: string]: {
    zone: KacheryZone;
    timestamp: number;
  };
} = {};

const fetchZone = async (
  zoneName: string,
  o: { includeCredentials: boolean; checkCache: boolean },
): Promise<KacheryZone | null> => {
  let zone: KacheryZone | null = null;
  if (o.checkCache) {
    const c = zoneMemoryCache[zoneName];
    if (c && Date.now() - c.timestamp < 1000 * 60) {
      zone = c.zone;
    }
  }
  if (!zone) {
    const client = await getMongoClient();
    const collection = client.db(dbName).collection(collectionNames.zones);
    const doc = await collection.findOne({ zoneName });
    if (!doc) return null;
    removeMongoId(doc);
    if (!isKacheryZone(doc)) {
      throw Error("Invalid zone in database");
    }
    zone = doc as KacheryZone;
    zoneMemoryCache[zoneName] = { zone, timestamp: Date.now() };
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
  // invalidate cache
  if (zoneMemoryCache[zoneName]) {
    delete zoneMemoryCache[zoneName];
  }
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
  // invalidate cache
  if (zoneMemoryCache[zoneName]) {
    delete zoneMemoryCache[zoneName];
  }
};

const userMemoryCache: {
  [userId: string]: {
    user: KacheryUser;
    timestamp: number;
  };
} = {};

const fetchUser = async (
  userId: string,
  o: { checkCache: boolean },
): Promise<KacheryUser | null> => {
  let user: KacheryUser | null = null;
  if (o.checkCache) {
    const c = userMemoryCache[userId];
    if (c && Date.now() - c.timestamp < 1000 * 60) {
      user = c.user;
    }
  }
  if (!user) {
    const client = await getMongoClient();
    const collection = client.db(dbName).collection(collectionNames.users);
    const doc = await collection.findOne({ userId });
    if (!doc) return null;
    removeMongoId(doc);
    if (!isKacheryUser(doc)) {
      console.warn("Invalid user in database", JSON.stringify(user));
      throw Error("Invalid user in database");
    }
    user = doc;
    userMemoryCache[userId] = { user, timestamp: Date.now() };
  }
  return user;
};

const userMemoryCacheForApiToken: {
  [apiKey: string]: {
    user: KacheryUser;
    timestamp: number;
  };
} = {};

const fetchUserForApiToken = async (
  apiKey: string,
  o: { checkCache: boolean },
): Promise<KacheryUser | null> => {
  if (!apiKey) return null;
  let user: KacheryUser | null = null;
  if (o.checkCache) {
    const c = userMemoryCacheForApiToken[apiKey];
    if (c && Date.now() - c.timestamp < 1000) {
      user = c.user;
    }
  }
  if (!user) {
    const client = await getMongoClient();
    const collection = client.db(dbName).collection(collectionNames.users);
    const doc = await collection.findOne({ apiKey });
    if (!doc) return null;
    removeMongoId(doc);
    if (!isKacheryUser(doc)) {
      console.warn("Invalid user in database", JSON.stringify(user));
      throw Error("Invalid user in database");
    }
    user = doc;
    userMemoryCacheForApiToken[apiKey] = { user, timestamp: Date.now() };
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
  // invalidate caches
  if (user.userId in userMemoryCache) {
    delete userMemoryCache[user.userId];
  }
  for (const k in userMemoryCacheForApiToken) {
    if (userMemoryCacheForApiToken[k].user.userId === user.userId) {
      delete userMemoryCacheForApiToken[k];
    }
  }
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
  // invalidate caches
  if (userId in userMemoryCache) {
    delete userMemoryCache[userId];
  }
  for (const k in userMemoryCacheForApiToken) {
    if (userMemoryCacheForApiToken[k].user.userId === userId) {
      delete userMemoryCacheForApiToken[k];
    }
  }
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
  if (zone.zoneName === "scratch") return true;
  if (!userId) {
    return false;
  }
  if (zone.publicUpload) return true;
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

// usageHandler
export const usageHandler = allowCors(
  async (req: VercelRequest, res: VercelResponse) => {
    const rr = req.body;
    if (!isUsageRequest(rr)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    try {
      const gitHubAccessToken = req.headers.authorization?.split(" ")[1]; // Extract the token
      if (!gitHubAccessToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const userIdFromToken =
        await getUserIdForGitHubAccessToken(gitHubAccessToken);
      if (!userIdFromToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { userId, zoneName } = rr;
      if (userId) {
        if (userId !== userIdFromToken && !isAdminUser(userIdFromToken)) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      } else {
        if (!isAdminUser(userIdFromToken)) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      }
      const downloadDocs: DownloadRecord[] = await fetchDownloadRecords({
        userId,
        zoneName,
      });
      const uploadDocs: UploadRecord[] = await fetchUploadRecords({
        userId,
        zoneName,
        stage: "initiate",
      });
      const userZoneDayUsages: UserZoneDayUsage[] = [];
      const lookup: { [key: string]: UserZoneDayUsage } = {};
      const dayFromTimestamp = (timestamp: number) => {
        const d = new Date(timestamp);
        // yyyy-mm-dd
        return `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      };
      for (const doc of downloadDocs) {
        const day = dayFromTimestamp(doc.timestamp);
        const key = `${doc.userId}:${doc.zoneName}:${day}`;
        if (lookup[key]) {
          lookup[key].numDownloads++;
          lookup[key].numBytesDownloaded += doc.size;
        } else {
          lookup[key] = {
            userId: doc.userId,
            zoneName: doc.zoneName,
            day,
            numDownloads: 1,
            numBytesDownloaded: doc.size,
            numUploads: 0,
            numBytesUploaded: 0,
          };
          userZoneDayUsages.push(lookup[key]);
        }
      }
      console.log("--- upload docs length", uploadDocs.length);
      for (const doc of uploadDocs) {
        const day = dayFromTimestamp(doc.timestamp);
        const key = `${doc.userId}:${doc.zoneName}:${day}`;
        console.log("--- doc", doc);
        if (lookup[key]) {
          lookup[key].numUploads++;
          lookup[key].numBytesUploaded += doc.size;
        } else {
          lookup[key] = {
            userId: doc.userId,
            zoneName: doc.zoneName,
            day,
            numDownloads: 0,
            numBytesDownloaded: 0,
            numUploads: 1,
            numBytesUploaded: doc.size,
          };
          userZoneDayUsages.push(lookup[key]);
        }
      }
      const resp: UsageResponse = {
        type: "usageResponse",
        userZoneDayUsages,
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

const checkWorkToken = (workToken: string, hash: string) => {
  const bits = sha1Bits(hash + workToken);
  // difficulty is hard-coded at 13 for now. It's around 15 milliseconds of work.
  const difficulty = 13;
  const prefix = "0".repeat(difficulty);
  if (!bits.startsWith(prefix)) {
    throw Error("Invalid work token");
  }
};

const sha1 = (input: string) => {
  const sha1 = crypto.createHash("sha1");
  sha1.update(input);
  return sha1.digest("hex");
};

const sha1Bits = (input: string) => {
  const hash = sha1(input);
  const bits = BigInt("0x" + hash).toString(2);
  const expectedLength = hash.length * 4;
  return bits.padStart(expectedLength, "0");
};

const isAdminUser = (userId: string) => {
  // hard-coded for now
  return ["github|magland"].includes(userId);
};
