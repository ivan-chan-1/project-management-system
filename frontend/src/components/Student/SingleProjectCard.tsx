import { useNavigate } from "react-router-dom";
import RightArrow from "../../assets/right.svg";

type projectCardProps = {
  id: string;
  name: string;
  desc: string;
  color: string;
};

export default function SingleProjectCard(props: projectCardProps) {
  const { id, name, desc, color } = props;
  const navigate = useNavigate();
  const handleSelectProject = () => {
    navigate(`/project/${id}/view`);
  };
  return (
    <div className="card card-sm p-0 bg-base-100 w-70 shadow-lg">
      <div
        className="h-5 w-full rounded-t-lg"
        style={{ backgroundColor: color }}
      ></div>
      <div className="card-body">
        <h2 className="card-title text-left font-sans h-12">{name}</h2>
        <p className="text-left line-clamp-4 font-sans">{desc}</p>
        <div className="card-actions justify-end pt-2">
          <div
            className="btn btn-circle btn-ghost border-0 p-2 hover:bg-secondary"
            onClick={handleSelectProject}
          >
            <img src={RightArrow} />
          </div>
        </div>
      </div>
    </div>
  );
}
