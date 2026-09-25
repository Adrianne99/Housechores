import { useContext } from "react";
import { BadgeCheck, Hash, Mail, Store } from "lucide-react";
import Header from "../../components/header";
import { Panel } from "../../components/panel";
import { ApprovalPinCard } from "../../components/approval_pin_card";
import { AppContext } from "../../context/app_context";
import { ROLE_LABELS, date_of, initials, staff_code } from "../../utils/format";

const DesktopProfile = () => {
  const { userData } = useContext(AppContext);
  const branch = typeof userData?.branch === "object" ? userData.branch?.name : null;

  const rows = [
    { icon: Hash, label: "Staff ID", value: staff_code(userData) },
    { icon: Mail, label: "Email", value: userData?.email },
    { icon: Store, label: "Branch", value: branch ?? (userData?.role === "admin" ? "All branches" : "Not assigned") },
    { icon: BadgeCheck, label: "Member since", value: date_of(userData?.createdAt, { month: "long", day: "numeric", year: "numeric" }) },
  ];

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Profile" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-20 bg-linear-to-br from-primary via-second-gradient to-third-gradient" />
          <div className="px-5 pb-6 -mt-10 flex flex-col items-center text-center">
            <div className="size-20 rounded-2xl border-4 border-white bg-linear-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {initials(userData?.name)}
            </div>
            <p className="mt-3 text-lg font-bold text-gray-900">{userData?.name}</p>
            <p className="text-sm font-medium text-indigo-600">{ROLE_LABELS[userData?.role]}</p>
            <p className="text-xs text-gray-400 mt-1">{userData?.email}</p>
          </div>
        </section>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="Account details">
            <dl className="divide-y divide-gray-100">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2.5 text-sm">
                  <Icon size={16} className="text-gray-400 shrink-0" />
                  <dt className="text-gray-500 w-36 shrink-0">{label}</dt>
                  <dd className="text-gray-900 font-medium truncate">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <ApprovalPinCard />
        </div>
      </div>
    </div>
  );
};

export default DesktopProfile;
