/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hyperlink, SmallIconButton } from "@fi-sci/misc";
import { Add } from "@mui/icons-material";
import { FunctionComponent, useCallback } from "react";
import { useZones } from "../../hooks";
import useRoute from "../../useRoute";
import ZonesTable from "./ZonesTable";
import { useLogin } from "../../LoginContext/LoginContext";

type ZonesPageProps = {
  // none
};

const ZonesPage: FunctionComponent<ZonesPageProps> = () => {
  const { userId } = useLogin();
  const { zones, addZone } = useZones();
  const { setRoute } = useRoute();

  const handleAddZone = useCallback(async () => {
    if (!userId) return;
    const zoneName = prompt("Enter zone name");
    if (!zoneName) return;
    await addZone(zoneName);
  }, [userId, addZone]);

  if (!userId)
    return (
      <div style={{ padding: 20 }}>
        <h3>Not logged in</h3>
      </div>
    );
  if (!zones)
    return (
      <div style={{ padding: 20 }}>
        <h3>Loading...</h3>
      </div>
    );
  return (
    <div style={{ padding: 20 }}>
      <div>
        <Hyperlink
          onClick={() => {
            setRoute({ page: "home" });
          }}
        >
          Back home
        </Hyperlink>
      </div>
      <hr />
      <div>
        <SmallIconButton
          onClick={handleAddZone}
          icon={<Add />}
          label="Add zone"
        />
      </div>
      <ZonesTable zones={zones} />
    </div>
  );
};

export default ZonesPage;
