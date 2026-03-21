import { useNavigate } from "react-router-dom";
import RightArrow from "../../assets/right.svg";
import { ProjectInfo } from "../../pages/constants";

export default function ProjectsCard({
  projects,
}: {
  projects: ProjectInfo[];
}) {
  const navigate = useNavigate();
  const handlePage = (id: string) => {
    navigate(`/project/${id}/view`);
  };

  return (
    <div className="px-10 py-8 bg-white h-1/2 inset-shadow-2xs shadow-md rounded-lg overflow-y-auto">
      <h2 className="text-2xl text-left mb-4">Projects</h2>
      <ul className="space-y-4">
        {projects ? (
          projects.map((p: ProjectInfo) => {
            return (
              <div key={p.id}>
                <li className="flex justify-between items-center">
                  <p className="truncate">{p.name}</p>
                  <div
                    className=" p-2 w-10 h-auto btn btn-ghost btn-circle hover:bg-secondary border-0"
                    onClick={() => handlePage(p.id || "")}
                  >
                    <img src={RightArrow} alt="back" className="w-full" />
                  </div>
                </li>
                <div className="divider"></div>
              </div>
            );
          })
        ) : (
          <p className="italic">There are no current projects.</p>
        )}
      </ul>
    </div>
  );
}
