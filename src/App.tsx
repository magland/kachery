import { useWindowDimensions } from "@fi-sci/misc";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { SetupLogin } from "./LoginContext/SetupLogin";
import LogInPage from "./LogInPage";
import HomePage from "./pages/HomePage/HomePage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import UserPage from "./pages/UserPage/UserPage";
import ZonePage from "./pages/ZonePage/ZonePage";
import ZonesPage from "./pages/ZonesPage/ZonesPage";
import useRoute from "./useRoute";
import UsagePage from "./pages/UsagePage/UsagePage";
// import useRoute from './useRoute'

function App() {
  return (
    <SetupLogin>
      <BrowserRouter>
        <MainWindow />
      </BrowserRouter>
    </SetupLogin>
  );
}

function MainWindow() {
  const { route } = useRoute();
  const { width, height } = useWindowDimensions();
  if (route.page === "home") {
    return <HomePage />;
  } else if (route.page === "zones") {
    return <ZonesPage />;
  } else if (route.page === "zone") {
    return <ZonePage width={width} height={height} />;
  } else if (route.page === "logIn") {
    return <LogInPage />;
  } else if (route.page === "set_access_token") {
    return <SetAccessTokenComponent />;
  } else if (route.page === "settings") {
    return <SettingsPage />;
  } else if (route.page === "user") {
    return <UserPage />;
  } else if (route.page === "usage") {
    return <UsagePage width={width} height={height} />;
  } else {
    return <div>Invalid route</div>;
  }
}

const SetAccessTokenComponent = () => {
  const { route, setRoute } = useRoute();
  if (route.page !== "set_access_token") {
    throw new Error("Invalid route");
  }
  useEffect(() => {
    localStorage.setItem(
      "kachery_github_access_token",
      JSON.stringify({ accessToken: route.accessToken }),
    );
    setRoute({
      page: "home",
    });
  }, [route.accessToken, setRoute]);
  return <div>Logging in...</div>;
};

export default App;
