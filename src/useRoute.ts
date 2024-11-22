import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type Route =
  | {
      page: "home";
    }
  | {
      page: "zones";
    }
  | {
      page: "zone";
      zoneName: string;
    }
  | {
      page: "set_access_token";
      accessToken: string;
    }
  | {
      page: "logIn";
    }
  | {
      page: "settings";
    }
  | {
      page: "user";
      userId: string;
    };

const useRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const p = location.pathname;
  const search = location.search;
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const route: Route = useMemo(() => {
    if (p === "/zones") {
      return {
        page: "zones",
      };
    } else if (p.startsWith("/zone/")) {
      const zoneName = p.slice("/zone/".length);
      return {
        page: "zone",
        zoneName,
      };
    } else if (p === "/set_access_token") {
      const accessToken = searchParams.get("access_token");
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      return {
        page: "set_access_token",
        accessToken,
      };
    } else if (p === "/logIn") {
      return {
        page: "logIn",
      };
    } else if (p === "/settings") {
      return {
        page: "settings",
      };
    } else if (p.startsWith("/user/")) {
      const parts = p.slice("/user/".length).split("/");
      if (parts[0] === "github") {
        return {
          page: "user",
          userId: `github|${parts[1]}`,
        };
      } else {
        return {
          page: "user",
          userId: parts[0],
        };
      }
    } else {
      return {
        page: "home",
      };
    }
  }, [p, searchParams]);

  const setRoute = useCallback(
    (r: Route) => {
      if (r.page === "home") {
        navigate("/");
      } else if (r.page === "zones") {
        navigate("/zones");
      } else if (r.page === "zone") {
        navigate(`/zone/${r.zoneName}`);
      } else if (r.page === "set_access_token") {
        navigate(`/set_access_token?access_token=${r.accessToken}`);
      } else if (r.page === "logIn") {
        navigate("/logIn");
      } else if (r.page === "settings") {
        navigate("/settings");
      } else if (r.page === "user") {
        if (r.userId.startsWith("github|")) {
          navigate(`/user/github/${r.userId.slice("github|".length)}`);
        } else {
          navigate(`/user/${r.userId}`);
        }
      } else {
        navigate("/");
      }
    },
    [navigate],
  );

  return {
    route,
    setRoute,
  };
};

export default useRoute;
