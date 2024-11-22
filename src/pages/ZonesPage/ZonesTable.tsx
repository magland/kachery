import { FunctionComponent } from "react";
import ZoneNameComponent from "../../components/ZoneNameComponent";
import UserIdComponent from "../../components/UserIdComponent";
import { KacheryZone } from "../../types";

type ZonesTableProps = {
  zones: KacheryZone[];
};

const ZonesTable: FunctionComponent<ZonesTableProps> = ({ zones }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Zone</th>
          <th>Owner</th>
          <th>Users</th>
        </tr>
      </thead>
      <tbody>
        {zones.map((zone) => (
          <tr key={zone.zoneName}>
            <td>
              <ZoneNameComponent zoneName={zone.zoneName} />
            </td>
            <td>
              <UserIdComponent userId={zone.userId} />
            </td>
            <td>
              {zone.users.length === 0 ? (
                <span>none</span>
              ) : (
                zone.users.map((u) => (
                  <span>
                    <UserIdComponent userId={u.userId} />
                    &nbsp;
                  </span>
                ))
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ZonesTable;
