import { FunctionComponent } from "react";
import useRoute from "../../useRoute";
import UserIdComponent from "../../components/UserIdComponent";
import { Hyperlink } from "@fi-sci/misc";
import { useUserStats, useUsage } from "../../hooks";

type UserPageProps = {
  // none
};

const UserPage: FunctionComponent<UserPageProps> = () => {
  const { route, setRoute } = useRoute();
  if (route.page !== "user") {
    throw new Error("Invalid route");
  }
  return (
    <div style={{ padding: 20 }}>
      <div>
        <Hyperlink
          onClick={() => {
            setRoute({ page: "home" });
          }}
        >
          Kachery home
        </Hyperlink>
      </div>
      <hr />
      <h3>
        User: <UserIdComponent userId={route.userId} />
      </h3>
      <UserStatsView userId={route.userId} />
    </div>
  );
};

type UserStatsViewProps = {
  userId: string;
};

const UserStatsView: FunctionComponent<UserStatsViewProps> = ({ userId }) => {
  const { userZoneDayUsages } = useUsage({ userId });
  if (!userZoneDayUsages) {
    return <div>Loading...</div>;
  }
  
  // Sort by date descending
  const sortedUsages = [...userZoneDayUsages].sort((a, b) => {
    return b.day.localeCompare(a.day);
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <table className="scientific-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Zone</th>
            <th>Downloads</th>
            <th>Data Downloaded</th>
            <th>Uploads</th>
            <th>Data Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsages.map((usage) => (
            <tr key={`${usage.day}-${usage.zoneName}`}>
              <td>{usage.day}</td>
              <td>{usage.zoneName}</td>
              <td>{usage.numDownloads}</td>
              <td>{formatBytes(usage.numBytesDownloaded)}</td>
              <td>{usage.numUploads}</td>
              <td>{formatBytes(usage.numBytesUploaded)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserPage;
