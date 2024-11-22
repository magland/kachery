import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent } from "react";
import useRoute from "../useRoute";

type ZoneNameComponentProps = {
  zoneName: string;
};

const ZoneNameComponent: FunctionComponent<ZoneNameComponentProps> = ({
  zoneName,
}) => {
  const { setRoute } = useRoute();
  const zoneNameDisplay = zoneName;
  return (
    <Hyperlink
      onClick={() => {
        setRoute({ page: "zone", zoneName: zoneName });
      }}
      color="#633"
    >
      {zoneNameDisplay}
    </Hyperlink>
  );
};

export default ZoneNameComponent;
