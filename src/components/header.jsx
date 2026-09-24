import { useContext } from "react";
import { Link } from "react-router";
import { AppContext } from "../context/app_context";
import { H3, H5, Paragraph } from "./texts";
import { NotificationBell } from "./notification_bell";
import { ROLE_LABELS, initials } from "../utils/format";

const Header = ({ title, subtitle }) => {
  const { userData } = useContext(AppContext);

  return (
    <div className="w-full flex flex-wrap justify-between items-center gap-3">
      <div className="min-w-0">
        <H3 className="leading-tight truncate">{title}</H3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 ml-auto">
        <NotificationBell />
        <Link to="/profile" className="flex items-center gap-2" aria-label="My profile">
          <div className="size-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
            {initials(userData?.name)}
          </div>
          <div className="hidden sm:flex text-black px-1 flex-col items-start">
            <H5>{userData?.name ?? "Loading..."}</H5>
            <Paragraph variant="muted" className="text-start text-primary font-medium">
              {ROLE_LABELS[userData?.role] ?? "Loading..."}
            </Paragraph>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Header;
