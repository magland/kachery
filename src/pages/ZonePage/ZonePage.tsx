/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hyperlink, SmallIconButton } from "@fi-sci/misc";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useZone } from "../../hooks";
import useRoute from "../../useRoute";
import { KacheryZone, KacheryZoneUser } from "../../types";
import { Add, Delete } from "@mui/icons-material";
import { reportRecentZone } from "../HomePage/HomePage";
import UserIdComponent from "../../components/UserIdComponent";
import ZoneNameComponent from "../../components/ZoneNameComponent";

type ZonePageProps = {
  width: number;
  height: number;
};

const ZonePage: FunctionComponent<ZonePageProps> = ({ width, height }) => {
  const { route, setRoute } = useRoute();
  const [errorMessage] = useState<string | null>(null);
  if (route.page !== "zone") {
    throw new Error("Invalid route");
  }
  const zoneName = route.zoneName;
  const { zone, deleteZone, setZoneInfo } = useZone(zoneName);
  const [editingUsers, setEditingUsers] = useState(false);

  const setUsers = useCallback(
    async (users: KacheryZoneUser[]) => {
      await setZoneInfo({ users });
    },
    [setZoneInfo],
  );

  useEffect(() => {
    reportRecentZone(zoneName);
  }, [zoneName]);

  // const handleLoadFromSource = useCallback(async () => {
  //     if (!zone) return
  //     if (!app.sourceUri) return
  //     setErrorMessage(null)
  //     try {
  //         const x = await loadJsonFromUri(app.sourceUri)
  //         if (x.name !== app.appName) {
  //             throw new Error('App name does not match')
  //         }
  //         const processors = x.processors
  //         if (!isArrayOf(isKacheryAppProcessor)(processors)) {
  //             throw new Error('Invalid processors')
  //         }
  //         const description = x.description
  //         if (description === undefined) {
  //             throw new Error('Missing description')
  //         }
  //         setAppInfo({
  //             processors,
  //             description
  //         })
  //     }
  //     catch(err: any) {
  //         console.error(err)
  //         setErrorMessage('Error loading from source: ' + err.message)
  //     }
  // }, [app, setAppInfo])
  if (!zone) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Loading...</h3>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
      <div style={{ padding: 20 }}>
        <div>
          <Hyperlink
            onClick={() => {
              setRoute({ page: "zones" });
            }}
          >
            Back to zones
          </Hyperlink>
        </div>
        <hr />
        <table className="table" style={{ maxWidth: 500 }}>
          <tbody>
            <tr>
              <td>Zone</td>
              <td>
                <ZoneNameComponent zoneName={zoneName} />
              </td>
              <td />
            </tr>
            <tr>
              <td>Owner</td>
              <td>
                <UserIdComponent userId={zone.userId} />
              </td>
              <td />
            </tr>
            <tr>
              <td>Users</td>
              <td>
                {zone.users.map((user, index) => (
                  <div key={index}>
                    <UserIdComponent userId={user.userId} />
                    {user.admin && " (admin)"}
                    {user.uploadFiles && " (upload files)"}
                    {user.downloadFiles && " (download files)"}
                  </div>
                ))}
              </td>
              <td>
                <Hyperlink onClick={() => setEditingUsers(true)}>
                  Edit users
                </Hyperlink>
              </td>
            </tr>
            <tr>
              <td>Bucket URI</td>
              <td>{zone.bucketUri}</td>
              <td>
                <Hyperlink
                  onClick={() => {
                    const newUri = prompt(
                      "Enter new bucket URI",
                      zone.bucketUri,
                    );
                    if (!newUri) return;
                    setZoneInfo({ bucketUri: newUri });
                  }}
                >
                  Edit bucket URI
                </Hyperlink>
              </td>
            </tr>
            <tr>
              <td>Directory</td>
              <td>{zone.directory}</td>
              <td>
                <Hyperlink
                  onClick={() => {
                    const newDir = prompt(
                      "Enter new directory",
                      zone.directory,
                    );
                    if (!newDir) return;
                    setZoneInfo({ directory: newDir });
                  }}
                >
                  Edit directory
                </Hyperlink>
              </td>
            </tr>
            <tr>
              <td>Bucket credentials</td>
              <td>{zone.credentials}</td>
              <td>
                <Hyperlink
                  onClick={() => {
                    const newCredentials = prompt(
                      "Enter new credentials",
                      zone.credentials,
                    );
                    if (!newCredentials) return;
                    setZoneInfo({ credentials: newCredentials });
                  }}
                >
                  Edit credentials
                </Hyperlink>
              </td>
            </tr>
          </tbody>
        </table>
        <div>&nbsp;</div>
        <div>
          {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
        </div>
        {editingUsers && (
          <EditUsersControl
            zone={zone}
            onSetUsers={(users) => setUsers(users)}
          />
        )}
        <hr />
        <div>
          {/* Delete zone */}
          <button
            onClick={async () => {
              if (!window.confirm(`Delete zone ${zoneName}?`)) return;
              await deleteZone();
              setRoute({ page: "zones" });
            }}
          >
            Delete zone
          </button>
        </div>
      </div>
    </div>
  );
};

// const loadJsonFromUri = async (uri: string) => {
//     const url = getUrlFromUri(uri)
//     const response = await fetch(url)
//     if (!response.ok) {
//         throw new Error(`Error loading from source: ${response.statusText}`)
//     }
//     const json = await response.json()
//     return json
// }

// const getUrlFromUri = (uri: string) => {
//     if (uri.startsWith('https://github.com/')) {
//         const raw_url = uri.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
//         return raw_url
//     }
//     else {
//         return uri
//     }
// }

type EditUsersControlProps = {
  zone: KacheryZone;
  onSetUsers: (users: KacheryZoneUser[]) => Promise<void>;
};

const EditUsersControl: FunctionComponent<EditUsersControlProps> = ({
  zone,
  onSetUsers,
}) => {
  const [localEditUsers, setLocalEditUsers] = useState<KacheryZoneUser[]>(
    zone.users,
  );
  useEffect(() => {
    setLocalEditUsers(zone.users);
  }, [zone]);
  const somethingChanged = useMemo(() => {
    return deterministicHash(localEditUsers) !== deterministicHash(zone.users);
  }, [localEditUsers, zone]);
  return (
    <div>
      <div>
        <SmallIconButton
          icon={<Add />}
          label="Add user"
          onClick={() => {
            let ghUserName = prompt("Enter the GitHub user name");
            if (!ghUserName) return;
            if (ghUserName.startsWith("github|")) {
              ghUserName = ghUserName.slice("github|".length);
            }
            const userId = "github|" + ghUserName;
            const newUsers = [
              ...localEditUsers,
              { userId, admin: false, downloadFiles: true, uploadFiles: true },
            ];
            setLocalEditUsers(newUsers);
          }}
        />
        &nbsp;
        {somethingChanged && (
          <button
            onClick={async () => {
              await onSetUsers(localEditUsers);
            }}
          >
            Save changes
          </button>
        )}
      </div>
      <table className="scientific-table">
        <thead>
          <tr>
            <th></th>
            <th>User</th>
            <th>Admin</th>
            <th>Download files</th>
            <th>Upload files</th>
          </tr>
        </thead>
        {localEditUsers.map((user, index) => (
          <tr key={index}>
            <td>
              <SmallIconButton
                icon={<Delete />}
                onClick={() => {
                  const newUsers = [...localEditUsers];
                  newUsers.splice(index, 1);
                  setLocalEditUsers(newUsers);
                }}
              />
            </td>
            <td>
              <UserIdComponent userId={user.userId} />
            </td>
            <td>
              <input
                type="checkbox"
                checked={user.admin}
                onChange={(e) => {
                  const newUsers = [...localEditUsers];
                  newUsers[index] = { ...user, admin: e.target.checked };
                  setLocalEditUsers(newUsers);
                }}
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={user.downloadFiles}
                onChange={(e) => {
                  const newUsers = [...localEditUsers];
                  newUsers[index] = {
                    ...user,
                    downloadFiles: e.target.checked,
                  };
                  setLocalEditUsers(newUsers);
                }}
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={user.uploadFiles}
                onChange={(e) => {
                  const newUsers = [...localEditUsers];
                  newUsers[index] = { ...user, uploadFiles: e.target.checked };
                  setLocalEditUsers(newUsers);
                }}
              />
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
};

const deterministicHash = (x: any) => {
  return JSON.stringify(x);
};

export default ZonePage;
