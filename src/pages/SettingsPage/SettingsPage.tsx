import { FunctionComponent, useCallback, useState } from "react";
import { ResetUserApiKeyRequest, isResetUserApiKeyResponse } from "../../types";
import { apiPostRequest, useUser } from "../../hooks";
import useRoute from "../../useRoute";
import { useLogin } from "../../LoginContext/LoginContext";
import LoginButton from "../../LoginButton";
import { Hyperlink } from "@fi-sci/misc";
import UserIdComponent from "../../components/UserIdComponent";

type SettingsPageProps = {
  // none
};

const SettingsPage: FunctionComponent<SettingsPageProps> = () => {
  const { setRoute } = useRoute();
  const { userId, githubAccessToken } = useLogin();
  const [resettingApiKey, setResettingApiKey] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const handleResetApiKey = useCallback(async () => {
    if (!userId) throw Error("Missing userId");
    if (!githubAccessToken) throw Error("Missing githubAccessToken");
    setResettingApiKey(true);
    setGeneratedApiKey(null);
    setApiKeyCopied(false);
    try {
      const req: ResetUserApiKeyRequest = {
        type: "resetUserApiKeyRequest",
        userId,
      };
      const resp = await apiPostRequest(
        "resetUserApiKey",
        req,
        githubAccessToken,
      );
      if (!isResetUserApiKeyResponse(resp)) {
        throw Error("Unexpected response");
      }
      setGeneratedApiKey(resp.apiKey);
    } finally {
      setResettingApiKey(false);
    }
  }, [userId, githubAccessToken]);
  const { user, setUserInfo } = useUser(userId || "");
  return (
    <div style={{ padding: 30 }}>
      <h3>Settings</h3>
      <Hyperlink
        onClick={() => {
          setRoute({ page: "home" });
        }}
      >
        Go to Kachery home
      </Hyperlink>
      <hr />
      {!userId && <p>You are not logged in. Log in to access settings.</p>}
      <LoginButton />
      <hr />
      {!userId && <p>You must be logged in to obtain an API key.</p>}
      {userId && (
        <div>
          {user && (
            <table className="table">
              <tr>
                <td>User</td>
                <td>
                  <UserIdComponent userId={userId} followLink={false} />
                </td>
              </tr>
              <tr>
                <td>
                  <span
                    style={{
                      color: user.name ? "black" : "red",
                    }}
                  >
                    Name {user.name ? "" : "(required for uploading)"}
                  </span>
                </td>
                <td>
                  <EditNameComponent
                    name={user.name || ""}
                    setName={(x) => {
                      setUserInfo({ name: x });
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <span style={{ color: user.email ? "black" : "red" }}>
                    Email address {user.email ? "" : "(required for uploading)"}
                  </span>
                </td>
                <td>
                  <EditEmailAddressComponent
                    emailAddress={user.email}
                    setEmailAddress={(x) => {
                      setUserInfo({ email: x });
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <span
                    style={{
                      color: user.researchDescription ? "black" : "red",
                    }}
                  >
                    Brief research description{" "}
                    {user.researchDescription ? "" : "(required for uploading)"}
                  </span>
                </td>
                <td>
                  <EditResearchDescriptionComponent
                    researchDescription={user.researchDescription || ""}
                    setResearchDescription={(x) => {
                      setUserInfo({ researchDescription: x });
                    }}
                  />
                </td>
              </tr>
            </table>
          )}
          <p style={{ maxWidth: 500 }}>
            An API key is required to upload files. Keep your API key secret. If
            you generate a new API key, the old key will no longer work. You
            should set the KACHERY_API_KEY environment variable on your system.
          </p>
        </div>
      )}
      {userId && user && !resettingApiKey && (
        <button onClick={handleResetApiKey}>
          Generate API key for{" "}
          <UserIdComponent userId={userId} followLink={false} />
        </button>
      )}
      {userId && !user && (
        <div>
          Please refresh the page to see your user information.
        </div>
      )}
      {resettingApiKey && <p>Generating API key...</p>}
      {generatedApiKey && !resettingApiKey && (
        <div>
          <p>API key generated:</p>
          <pre>{generatedApiKey}</pre>
          {!apiKeyCopied && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedApiKey);
              }}
            >
              Copy API key to clipboard
            </button>
          )}
          {apiKeyCopied && <p>API key copied to clipboard</p>}
        </div>
      )}
    </div>
  );
};

type EmailAddressComponentProps = {
  emailAddress: string;
  setEmailAddress: (emailAddress: string) => void;
};

const EditEmailAddressComponent: FunctionComponent<
  EmailAddressComponentProps
> = ({ emailAddress, setEmailAddress }) => {
  const [editing, setEditing] = useState(false);
  const [newEmailAddress, setNewEmailAddress] = useState(emailAddress);
  const handleSave = useCallback(() => {
    setEmailAddress(newEmailAddress);
    setEditing(false);
  }, [newEmailAddress, setEmailAddress]);
  return (
    <div>
      {editing ? (
        <div>
          <input
            type="text"
            value={newEmailAddress}
            onChange={(e) => setNewEmailAddress(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          {emailAddress}&nbsp;
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

type NameComponentProps = {
  name: string;
  setName: (name: string) => void;
};

const EditNameComponent: FunctionComponent<NameComponentProps> = ({
  name,
  setName,
}) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const handleSave = useCallback(() => {
    setName(newName);
    setEditing(false);
  }, [newName, setName]);
  return (
    <div>
      {editing ? (
        <div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          {name}&nbsp;
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

type ResearchDescriptionComponentProps = {
  researchDescription: string;
  setResearchDescription: (researchDescription: string) => void;
};

const EditResearchDescriptionComponent: FunctionComponent<
  ResearchDescriptionComponentProps
> = ({ researchDescription, setResearchDescription }) => {
  const [editing, setEditing] = useState(false);
  const [newResearchDescription, setNewResearchDescription] =
    useState(researchDescription);
  const handleSave = useCallback(() => {
    setResearchDescription(newResearchDescription);
    setEditing(false);
  }, [newResearchDescription, setResearchDescription]);
  // Use a <textarea> instead of an <input> element

  return (
    <div>
      {editing ? (
        <div>
          <textarea
            value={newResearchDescription}
            onChange={(e) => setNewResearchDescription(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          {researchDescription}&nbsp;
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
