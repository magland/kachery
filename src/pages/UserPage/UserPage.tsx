import { FunctionComponent } from "react";
import useRoute from "../../useRoute";
import UserIdComponent from "../../components/UserIdComponent";
import { Hyperlink } from "@fi-sci/misc";
import { useUserStats } from "../../hooks";

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
  const { userStats } = useUserStats(userId);
  if (!userStats) {
    return <div>Loading...</div>;
  }
  return <div></div>;
};

export default UserPage;
