import { useNavigate } from "react-router-dom";
import forward from "../../assets/back.svg";
import { Statistic } from "../../pages/constants";

export interface InsightsCardProps {
  title: string;
  route?: string;
  stats: Statistic[];
}

const InsightsCard = ({ title, route, stats }: InsightsCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(route ?? "/");
  };

  return (
    <div className="card shadow-sm h-full w-full p-8">
      <div className="flex flex-row justify-between">
        <div className="card-title">{title}</div>
        <button
          className="btn circle btn-circle btn-ghost border-0 hover:bg-secondary shadow-none"
          onClick={handleClick}
        >
          <img src={forward} className="scale-x-[-1] w-5" />
        </button>
      </div>
      <div className="card-body p-0 flex justify-center mt-2">
        <div className="stats border border-gray-200">
          {stats.map((s, i) => {
            return (
              <div className="stat" key={i}>
                <div className="stat-title">{s.title}</div>
                <div className="stat-value font-normal">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InsightsCard;
