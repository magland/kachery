import { FunctionComponent, useMemo } from "react";
import { useUsage } from "../../hooks";
import { UserZoneDayUsage } from "../../types";

type UsagePageProps = {
  width: number;
  height: number;
};

const UsagePage: FunctionComponent<UsagePageProps> = ({ width, height }) => {
  const { userZoneDayUsages } = useUsage({});
  const allDays = useMemo(() => {
    if (!userZoneDayUsages) return undefined;
    const days = new Set<string>();
    for (const u of userZoneDayUsages) {
      days.add(u.day);
    }
    return Array.from(days)
      .sort()
      .map((day) => {
        const x = userZoneDayUsages.filter((u) => u.day === day);
        return {
          day,
          userZoneDayUsages: x,
        };
      });
  }, [userZoneDayUsages]);
  if (!allDays) return <div>Loading usage...</div>;
  return (
    <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
      {allDays.map((day) => (
        <UsageDay
          key={day.day}
          day={day.day}
          userZoneDayUsages={day.userZoneDayUsages}
        />
      ))}
    </div>
  );
};

type UsageDayProps = {
  day: string;
  userZoneDayUsages: UserZoneDayUsage[];
};

const UsageDay: FunctionComponent<UsageDayProps> = ({
  day,
  userZoneDayUsages,
}) => {
  const sortedUserZoneDayUsages = useMemo(() => {
    // sort by x.zoneName and then x.userId
    const x = userZoneDayUsages.slice();
    x.sort((a, b) => {
      if (a.zoneName < b.zoneName) return -1;
      if (a.zoneName > b.zoneName) return 1;
      if (a.userId < b.userId) return -1;
      if (a.userId > b.userId) return 1;
      return 0;
    });
    return x;
  }, [userZoneDayUsages]);
  return (
    <div>
      <h3>{day}</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Zone</th>
            <th>User</th>
            <th>Num. downloads</th>
            <th>Downloaded GB</th>
            <th>Num. uploads</th>
            <th>Uploaded GB</th>
          </tr>
        </thead>
        <tbody>
          {sortedUserZoneDayUsages.map((u) => (
            <tr key={u.zoneName + "_" + u.userId}>
              <td>{u.zoneName}</td>
              <td>{u.userId}</td>
              <td>{u.numDownloads}</td>
              <td>{u.numBytesDownloaded / 1e9}</td>
              <td>{u.numUploads}</td>
              <td>{u.numBytesUploaded / 1e9}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsagePage;
