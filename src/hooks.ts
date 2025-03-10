/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLogin } from "./LoginContext/LoginContext";
import {
  AddZoneRequest,
  ComputeUserStatsRequest,
  DeleteZoneRequest,
  GetUserRequest,
  GetUsersRequest,
  GetZoneRequest,
  GetZonesRequest,
  KacheryUser,
  KacheryZone,
  KacheryZoneUser,
  SetUserInfoRequest,
  SetZoneInfoRequest,
  UsageRequest,
  UserStats,
  UserZoneDayUsage,
  isAddZoneResponse,
  isComputeUserStatsResponse,
  isGetUserResponse,
  isGetUsersResponse,
  isGetZoneResponse,
  isGetZonesResponse,
  isSetUserInfoResponse,
  isSetZoneInfoResponse,
  isUsageResponse,
} from "./types";

const isLocalHost = window.location.hostname === "localhost";
const apiUrl = isLocalHost
  ? `http://${window.location.hostname}:${window.location.port}`
  : "https://kachery.vercel.app";

export const useUsers = () => {
  const [users, setUsers] = useState<KacheryUser[] | undefined>(undefined);
  const { githubAccessToken } = useLogin();

  useEffect(() => {
    let canceled = false;
    setUsers(undefined);
    if (!githubAccessToken) return;
    (async () => {
      const req: GetUsersRequest = {
        type: "getUsersRequest"
      };
      const resp = await apiPostRequest("getUsers", req, githubAccessToken);
      if (canceled) return;
      if (!isGetUsersResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setUsers(resp.users);
    })();
    return () => {
      canceled = true;
    };
  }, [githubAccessToken]);

  return { users };
};

export const useZones = () => {
  const { userId, githubAccessToken } = useLogin();
  const [zones, setZones] = useState<KacheryZone[] | undefined>(undefined);
  const [refreshCode, setRefreshCode] = useState(0);
  const refreshZones = useCallback(() => {
    setRefreshCode((c) => c + 1);
  }, []);
  useEffect(() => {
    let canceled = false;
    setZones(undefined);
    (async () => {
      const req: GetZonesRequest = {
        type: "getZonesRequest",
        userId: userId || undefined,
      };
      const resp = await apiPostRequest("getZones", req, undefined);
      if (canceled) return;
      if (!isGetZonesResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setZones(resp.zones);
    })();
    return () => {
      canceled = true;
    };
  }, [userId, refreshCode]);

  const addZone = useCallback(
    async (zoneName: string) => {
      if (!githubAccessToken) return;
      if (!userId) return;
      const req: AddZoneRequest = {
        type: "addZoneRequest",
        userId,
        zoneName,
      };
      const resp = await apiPostRequest("addZone", req, githubAccessToken);
      if (!isAddZoneResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      refreshZones();
    },
    [refreshZones, githubAccessToken, userId],
  );

  return {
    zones,
    refreshZones,
    addZone,
  };
};

export const useZone = (zoneName: string) => {
  const { githubAccessToken } = useLogin();
  const [zone, setZone] = useState<KacheryZone | undefined>(undefined);
  const [refreshCode, setRefreshCode] = useState(0);
  const refreshZone = useCallback(() => {
    setRefreshCode((c) => c + 1);
  }, []);

  useEffect(() => {
    let canceled = false;
    setZone(undefined);
    if (!githubAccessToken) return;
    (async () => {
      const req: GetZoneRequest = {
        type: "getZoneRequest",
        zoneName,
      };
      const resp = await apiPostRequest("getZone", req, githubAccessToken);
      if (canceled) return;
      if (!isGetZoneResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setZone(resp.zone);
    })();
    return () => {
      canceled = true;
    };
  }, [zoneName, githubAccessToken, refreshCode]);

  const deleteZone = useCallback(async () => {
    if (!githubAccessToken) return;
    const req: DeleteZoneRequest = {
      type: "deleteZoneRequest",
      zoneName,
    };
    const resp = await apiPostRequest("deleteZone", req, githubAccessToken);
    if (!isGetZoneResponse(resp)) {
      console.error("Invalid response", resp);
      return;
    }
    setZone(undefined);
  }, [zoneName, githubAccessToken]);

  const setZoneInfo = useMemo(
    () =>
      async (o: {
        users?: KacheryZoneUser[];
        publicDownload?: boolean;
        publicUpload?: boolean;
        bucketUri?: string;
        directory?: string;
        credentials?: string;
      }) => {
        const { users, publicDownload, publicUpload, bucketUri, directory, credentials } = o;
        if (!githubAccessToken) return;
        const req: SetZoneInfoRequest = {
          type: "setZoneInfoRequest",
          zoneName,
          users,
          publicDownload,
          publicUpload,
          bucketUri,
          directory,
          credentials,
        };
        const resp = await apiPostRequest(
          "setZoneInfo",
          req,
          githubAccessToken,
        );
        if (!isSetZoneInfoResponse(resp)) {
          console.error("Invalid response", resp);
          return;
        }
        refreshZone();
      },
    [zoneName, githubAccessToken, refreshZone],
  );

  return {
    zone,
    deleteZone,
    setZoneInfo,
    refreshZone,
  };
};

export const useUser = (userId: string) => {
  const [user, setUser] = useState<KacheryUser | undefined>(undefined);
  const [refreshCode, setRefreshCode] = useState(0);
  const { githubAccessToken } = useLogin();
  useEffect(() => {
    let canceled = false;
    setUser(undefined);
    if (!userId) return;
    if (!githubAccessToken) return;
    (async () => {
      const req: GetUserRequest = {
        type: "getUserRequest",
        userId,
      };
      const resp = await apiPostRequest("getUser", req, githubAccessToken);
      if (!resp) return;
      if (canceled) return;
      if (!isGetUserResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setUser(resp.user);
    })();
    return () => {
      canceled = true;
    };
  }, [userId, refreshCode, githubAccessToken]);
  const setUserInfo = useCallback(
    async (o: {
      email?: string;
      researchDescription?: string;
      name?: string;
    }) => {
      if (!githubAccessToken) throw Error("Missing githubAccessToken");
      const { email, researchDescription, name } = o;
      if (!userId) return;
      const req: SetUserInfoRequest = {
        type: "setUserInfoRequest",
        userId,
        email,
        researchDescription,
        name,
      };
      const resp = await apiPostRequest("setUserInfo", req, githubAccessToken);
      if (!isSetUserInfoResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setRefreshCode((c) => c + 1);
    },
    [userId, githubAccessToken],
  );
  return { user, setUserInfo };
};

export const useUserStats = (userId: string) => {
  const [userStats, setUserStats] = useState<UserStats | undefined>(undefined);
  useEffect(() => {
    let canceled = false;
    setUserStats(undefined);
    (async () => {
      const req: ComputeUserStatsRequest = {
        type: "computeUserStatsRequest",
        userId,
      };
      const resp = await apiPostRequest("computeUserStats", req);
      if (!resp) return;
      if (canceled) return;
      if (!isComputeUserStatsResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      setUserStats(resp.userStats);
    })();
    return () => {
      canceled = true;
    };
  }, [userId]);
  return { userStats };
};

export const useUsage = (a: { userId?: string; zoneName?: string }) => {
  const { userId, zoneName } = a;
  const [userZoneDayUsages, setUserZoneDayUsages] = useState<
    UserZoneDayUsage[] | undefined
  >(undefined);
  const { githubAccessToken } = useLogin();
  useEffect(() => {
    let canceled = false;
    setUserZoneDayUsages(undefined);
    if (!githubAccessToken) return;
    (async () => {
      const req: UsageRequest = {
        type: "usageRequest",
        userId,
        zoneName,
      };
      const resp = await apiPostRequest("usage", req, githubAccessToken);
      if (!resp) return;
      if (!isUsageResponse(resp)) {
        console.error("Invalid response", resp);
        return;
      }
      if (canceled) return;
      setUserZoneDayUsages(resp.userZoneDayUsages);
    })();
    return () => {
      canceled = true;
    };
  }, [userId, zoneName, githubAccessToken]);
  return { userZoneDayUsages };
};

export const apiPostRequest = async (
  path: string,
  req: any,
  accessToken?: string,
) => {
  const url = `${apiUrl}/api/${path}`;
  const headers: { [key: string]: string } = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  headers["Content-Type"] = "application/json";
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const responseText = await response.text();
    throw Error(`Error fetching ${path}: ${response.status} ${responseText}`);
  }
  const resp = await response.json();
  return resp;
};
