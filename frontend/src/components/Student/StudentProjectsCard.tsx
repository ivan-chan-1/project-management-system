import { ProjectTags } from "../../pages/constants";

export default function StudentProjectsCard({
  projPrefs,
}: {
  projPrefs: ProjectTags[];
}) {
  return (
    <div className="px-10 py-8 bg-white flex-2 inset-shadow-2xs rounded-lg shadow-lg h-auto">
      <h2 className="text-2xl text-left mb-4">Project Preferences</h2>
      <ol className="space-y-4 list-decimal list-inside">
        {projPrefs &&
          projPrefs.map((projPref: ProjectTags, index: number) => (
            <div key={index}>
              <li className="flex justify-between items-center transition duration-300 ease-in-out hover:translate-x-2 pb-2 border-b border-gray-300">
                <span className="text-left">{projPref.name}</span>
                <div className="flex gap-2">
                  {projPref.tags.map((tag: string, index: number) => (
                    <div
                      key={index}
                      className="pl-4 pr-4 bg-gray-300 border border-base-300 rounded-full cursor-pointer"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </li>
            </div>
          ))}
      </ol>
    </div>
  );
}
