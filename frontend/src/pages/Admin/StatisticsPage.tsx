import { PropsWithChildren } from "react";
import Page from "../../components/Layout-Nav/Page";
import { FilterType, Heading, Manage, Statistic } from "../constants";
import StatBox from "./StatBox";
import Table from "../../components/Table";
import { useNavigate } from "react-router-dom";

type StatisticsPageProps<T> = {
  title: string;
  stats: Statistic[];
  data: T[];
  columns: Heading[];
  manage: Manage[];
  filterInfo?: FilterType[];
  onDelete?: (userData: T) => void;
};

/**
 * This is a shared component for course admin summary pages
 *
 */
export default function StatisticsPage<T extends Record<string, unknown>>(
  props: PropsWithChildren<StatisticsPageProps<T>>,
) {
  const navigate = useNavigate();
  const manageButton = () => {
    if (props.manage.length === 0) {
      return null;
    }

    return (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn drk-btn m-1 rounded-lg">
          Manage
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-1 w-60 p-2 shadow-sm"
        >
          {props.manage.map((m) => {
            return (
              <li key={m.title}>
                <a
                  className="!text-black p-2"
                  onClick={() => navigate(m.route)}
                >
                  {m.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  return (
    <Page
      title={props.title}
      back={true}
      backRoute={`/admin/dashboard/${localStorage.getItem("subcourse") || ""}`}
      extraContent={manageButton()}
    >
      <div className="flex flex-col gap-15 pt-10">
        <div className="flex flex-row gap-10">
          {props.stats.map((s) => {
            return <StatBox key={s.title} title={s.title} value={s.value} />;
          })}
        </div>
        <div className="flex flex-col">
          <Table
            headings={props.columns}
            data={props.data}
            title={`All ${props.title}`}
            filterInfo={props.filterInfo}
            onDeleteClick={props.onDelete}
          />
        </div>
      </div>
    </Page>
  );
}
