/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isArrayOf,
  isBoolean,
  isEqualTo,
  isNumber,
  isNull,
  isOneOf,
  isString,
  optional,
  validateObject,
} from "@fi-sci/misc";

// KacheryZone
export type KacheryZone = {
  zoneName: string;
  userId: string;
  users: KacheryZoneUser[];
  publicDownload: boolean;
  publicUpload?: boolean;
  bucketUri?: string;
  directory?: string;
  credentials?: string;
};

export const isKacheryZone = (x: any): x is KacheryZone => {
  return validateObject(x, {
    zoneName: isString,
    userId: isString,
    users: isArrayOf(isKacheryZoneUser),
    publicDownload: isBoolean,
    publicUpload: optional(isBoolean),
    bucketUri: optional(isString),
    directory: optional(isString),
    credentials: optional(isString),
  });
};

// KacheryZoneUser
export type KacheryZoneUser = {
  userId: string;
  admin: boolean;
  uploadFiles: boolean;
  downloadFiles: boolean;
};

export const isKacheryZoneUser = (x: any): x is KacheryZoneUser => {
  return validateObject(x, {
    userId: isString,
    admin: isBoolean,
    uploadFiles: isBoolean,
    downloadFiles: isBoolean,
  });
};

// KacheryUser
export type KacheryUser = {
  userId: string;
  name: string;
  email: string;
  researchDescription?: string;
  apiKey: string | null;
};

export const isKacheryUser = (x: any): x is KacheryUser => {
  return validateObject(x, {
    userId: isString,
    name: isString,
    email: isString,
    researchDescription: optional(isString),
    apiKey: isOneOf([isString, isNull]),
  });
};

// addUser
export type AddUserRequest = {
  type: "addUserRequest";
  userId: string;
};

export const isAddUserRequest = (x: any): x is AddUserRequest => {
  return validateObject(x, {
    type: isEqualTo("addUserRequest"),
    userId: isString,
  });
};

export type AddUserResponse = {
  type: "addUserResponse";
};

export const isAddUserResponse = (x: any): x is AddUserResponse => {
  return validateObject(x, {
    type: isEqualTo("addUserResponse"),
  });
};

// resetUserApiKey
export type ResetUserApiKeyRequest = {
  type: "resetUserApiKeyRequest";
  userId: string;
};

export const isResetUserApiKeyRequest = (
  x: any,
): x is ResetUserApiKeyRequest => {
  return validateObject(x, {
    type: isEqualTo("resetUserApiKeyRequest"),
    userId: isString,
  });
};

export type ResetUserApiKeyResponse = {
  type: "resetUserApiKeyResponse";
  apiKey: string;
};

export const isResetUserApiKeyResponse = (
  x: any,
): x is ResetUserApiKeyResponse => {
  return validateObject(x, {
    type: isEqualTo("resetUserApiKeyResponse"),
    apiKey: isString,
  });
};

// setUserInfo
export type SetUserInfoRequest = {
  type: "setUserInfoRequest";
  userId: string;
  name?: string;
  email?: string;
  researchDescription?: string;
};

export const isSetUserInfoRequest = (x: any): x is SetUserInfoRequest => {
  return validateObject(x, {
    type: isEqualTo("setUserInfoRequest"),
    userId: isString,
    name: optional(isString),
    email: optional(isString),
    researchDescription: optional(isString),
  });
};

export type SetUserInfoResponse = {
  type: "setUserInfoResponse";
};

export const isSetUserInfoResponse = (x: any): x is SetUserInfoResponse => {
  return validateObject(x, {
    type: isEqualTo("setUserInfoResponse"),
  });
};

// getUser

export type GetUserRequest = {
  type: "getUserRequest";
  userId: string;
};

export const isGetUserRequest = (x: any): x is GetUserRequest => {
  return validateObject(x, {
    type: isEqualTo("getUserRequest"),
    userId: isString,
  });
};

export type GetUserResponse = {
  type: "getUserResponse";
  user: KacheryUser;
};

export const isGetUserResponse = (x: any): x is GetUserResponse => {
  return validateObject(x, {
    type: isEqualTo("getUserResponse"),
    user: isKacheryUser,
  });
};

// getUsers

export type GetUsersRequest = {
  type: "getUsersRequest";
};

export const isGetUsersRequest = (x: any): x is GetUsersRequest => {
  return validateObject(x, {
    type: isEqualTo("getUsersRequest"),
  });
};

export type GetUsersResponse = {
  type: "getUsersResponse";
  users: KacheryUser[];
};

export const isGetUsersResponse = (x: any): x is GetUsersResponse => {
  return validateObject(x, {
    type: isEqualTo("getUsersResponse"),
    users: isArrayOf(isKacheryUser),
  });
};

// addZone
export type AddZoneRequest = {
  type: "addZoneRequest";
  zoneName: string;
  userId: string;
};

export const isAddZoneRequest = (x: any): x is AddZoneRequest => {
  return validateObject(x, {
    type: isEqualTo("addZoneRequest"),
    zoneName: isString,
    userId: isString,
  });
};

export type AddZoneResponse = {
  type: "addZoneResponse";
};

export const isAddZoneResponse = (x: any): x is AddZoneResponse => {
  return validateObject(x, {
    type: isEqualTo("addZoneResponse"),
  });
};

// getZone
export type GetZoneRequest = {
  type: "getZoneRequest";
  zoneName: string;
};

export const isGetZoneRequest = (x: any): x is GetZoneRequest => {
  return validateObject(x, {
    type: isEqualTo("getZoneRequest"),
    zoneName: isString,
  });
};

export type GetZoneResponse = {
  type: "getZoneResponse";
  zone: KacheryZone;
};

export const isGetZoneResponse = (x: any): x is GetZoneResponse => {
  return validateObject(x, {
    type: isEqualTo("getZoneResponse"),
    zone: isKacheryZone,
  });
};

// getZones
export type GetZonesRequest = {
  type: "getZonesRequest";
  userId?: string;
};

export const isGetZonesRequest = (x: any): x is GetZonesRequest => {
  return validateObject(x, {
    type: isEqualTo("getZonesRequest"),
    userId: optional(isString),
  });
};

export type GetZonesResponse = {
  type: "getZonesResponse";
  zones: KacheryZone[];
};

export const isGetZonesResponse = (x: any): x is GetZonesResponse => {
  return validateObject(x, {
    type: isEqualTo("getZonesResponse"),
    zones: isArrayOf(isKacheryZone),
  });
};

// deleteZone
export type DeleteZoneRequest = {
  type: "deleteZoneRequest";
  zoneName: string;
};

export const isDeleteZoneRequest = (x: any): x is DeleteZoneRequest => {
  return validateObject(x, {
    type: isEqualTo("deleteZoneRequest"),
    zoneName: isString,
  });
};

export type DeleteZoneResponse = {
  type: "deleteZoneResponse";
};

export const isDeleteZoneResponse = (x: any): x is DeleteZoneResponse => {
  return validateObject(x, {
    type: isEqualTo("deleteZoneResponse"),
  });
};

// setZoneInfo
export type SetZoneInfoRequest = {
  type: "setZoneInfoRequest";
  zoneName: string;
  users?: KacheryZoneUser[];
  publicDownload?: boolean;
  publicUpload?: boolean;
  bucketUri?: string;
  credentials?: string;
  directory?: string;
};

export const isSetZoneInfoRequest = (x: any): x is SetZoneInfoRequest => {
  return validateObject(x, {
    type: isEqualTo("setZoneInfoRequest"),
    zoneName: isString,
    users: optional(isArrayOf(isKacheryZoneUser)),
    publicDownload: optional(isBoolean),
    publicUpload: optional(isBoolean),
    bucketUri: optional(isString),
    credentials: optional(isString),
    directory: optional(isString),
  });
};

export type SetZoneInfoResponse = {
  type: "setZoneInfoResponse";
};

export const isSetZoneInfoResponse = (x: any): x is SetZoneInfoResponse => {
  return validateObject(x, {
    type: isEqualTo("setZoneInfoResponse"),
  });
};

// computeUserStats
export type ComputeUserStatsRequest = {
  type: "computeUserStatsRequest";
  userId: string;
};

export const isComputeUserStatsRequest = (
  x: any,
): x is ComputeUserStatsRequest => {
  return validateObject(x, {
    type: isEqualTo("computeUserStatsRequest"),
    userId: isString,
  });
};

export type UserStats = {
  userId: string;
};

const isUserStats = (x: any): x is UserStats => {
  if (
    !validateObject(x, {
      userId: isString,
    })
  )
    return false;
  return true;
};

export type ComputeUserStatsResponse = {
  type: "computeUserStatsResponse";
  userStats: UserStats;
};

export const isComputeUserStatsResponse = (
  x: any,
): x is ComputeUserStatsResponse => {
  return validateObject(x, {
    type: isEqualTo("computeUserStatsResponse"),
    userStats: isUserStats,
  });
};

// usage

export type UsageRequest = {
  type: "usageRequest";
  zoneName?: string;
  userId?: string;
};

export const isUsageRequest = (x: any): x is UsageRequest => {
  return validateObject(x, {
    type: isEqualTo("usageRequest"),
    zoneName: optional(isString),
    userId: optional(isString),
  });
};

export type UserZoneDayUsage = {
  day: string; // yyyy-mm-dd
  zoneName: string;
  userId: string;
  numDownloads: number;
  numUploads: number;
  numBytesDownloaded: number;
  numBytesUploaded: number;
};

export const isUserZoneDayUsage = (x: any): x is UserZoneDayUsage => {
  return validateObject(x, {
    day: isString,
    zoneName: isString,
    userId: isString,
    numDownloads: isNumber,
    numUploads: isNumber,
    numBytesDownloaded: isNumber,
    numBytesUploaded: isNumber,
  });
};

export type UsageResponse = {
  type: "usageResponse";
  userZoneDayUsages: UserZoneDayUsage[];
};

export const isUsageResponse = (x: any): x is UsageResponse => {
  return validateObject(x, {
    type: isEqualTo("usageResponse"),
    userZoneDayUsages: isArrayOf(isUserZoneDayUsage),
  });
};

// initiateFileUpload

export type InitiateFileUploadRequest = {
  type: "initiateFileUploadRequest";
  size: number;
  hashAlg: string;
  hash: string;
  zoneName: string;
  workToken: string;
};

export const isInitiateFileUploadRequest = (
  x: any,
): x is InitiateFileUploadRequest => {
  return validateObject(x, {
    type: isEqualTo("initiateFileUploadRequest"),
    size: isNumber,
    hashAlg: isString,
    hash: isString,
    zoneName: isString,
    workToken: isString,
  });
};

export type InitiateFileUploadResponse = {
  type: "initiateFileUploadResponse";
  alreadyExists: boolean;
  alreadyPending: boolean;
  signedUploadUrl?: string;
  objectKey?: string;
};

export const isInitiateFileUploadResponse = (
  x: any,
): x is InitiateFileUploadResponse => {
  return validateObject(x, {
    type: isEqualTo("initiateFileUploadResponse"),
    alreadyExists: isBoolean,
    alreadyPending: isBoolean,
    signedUploadUrl: optional(isString),
    objectKey: optional(isString),
  });
};

// finalizeFileUpload

export type FinalizeFileUploadRequest = {
  type: "finalizeFileUploadRequest";
  objectKey: string;
  hashAlg: string;
  hash: string;
  zoneName: string;
  size: number;
};

export const isFinalizeFileUploadRequest = (
  x: any,
): x is FinalizeFileUploadRequest => {
  return validateObject(x, {
    type: isEqualTo("finalizeFileUploadRequest"),
    objectKey: isString,
    hashAlg: isString,
    hash: isString,
    zoneName: isString,
    size: isNumber,
  });
};

export type FinalizeFileUploadResponse = {
  type: "finalizeFileUploadResponse";
  success: boolean;
};

export const isFinalizeFileUploadResponse = (
  x: any,
): x is FinalizeFileUploadResponse => {
  return validateObject(x, {
    type: isEqualTo("finalizeFileUploadResponse"),
    success: isBoolean,
  });
};

// findFile

export type FindFileRequest = {
  type: "findFileRequest";
  hashAlg: string;
  hash: string;
  zoneName: string;
};

export const isFindFileRequest = (x: any): x is FindFileRequest => {
  return validateObject(x, {
    type: isEqualTo("findFileRequest"),
    hashAlg: isString,
    hash: isString,
    zoneName: isString,
  });
};

export type FindFileResponse = {
  type: "findFileResponse";
  found: boolean;
  url?: string;
  size?: number;
  bucketUri?: string;
  objectKey?: string;
  cacheHit?: boolean;
};

export const isFindFileResponse = (x: any): x is FindFileResponse => {
  return validateObject(x, {
    type: isEqualTo("findFileResponse"),
    found: isBoolean,
    url: optional(isString),
    size: optional(isNumber),
    bucketUri: optional(isString),
    objectKey: optional(isString),
    cacheHit: optional(isBoolean),
  });
};
