import React from "react";
import Group from "../assets/groups.svg";
import Delete from "../assets/delete.svg";
import SearchBar from "./SearchBar";
import { FilterType, Heading } from "../pages/constants";
import { useNavigate } from "react-router-dom";
import Filter from "../assets/filter.svg";
interface TableProps<T> {
  headings: Heading[];
  data: T[];
  title: string;
  onJoinClick?: (row: T) => void; // Optional join handler
  onDeleteClick?: (row: T) => void; // Optional delete handler
  filterInfo?: FilterType[];
}

// Changed any to string in Record<string, any> to pass linting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Table<T extends Record<string, any>>({
  headings,
  data,
  title,
  onJoinClick,
  onDeleteClick,
  filterInfo,
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [shownData, setShownData] = React.useState<T[]>(data);
  const [filterBy, setFilterBy] = React.useState<string[]>([]);
  const user = localStorage.getItem("user");
  const navigate = useNavigate();

  React.useEffect(() => {
    const searchInData = (query: string, headers: string[]) => {
      if (!query.trim() && filterBy.length === 0) return data; // Return all data if query is empty and there is no filter
      let filteredData = data;
      for (const filter of filterBy) {
        const info = filterInfo?.find((f) => f.type === filter);
        if (info && info?.type === info?.title) {
          const result = info.filterFn(filteredData, info.title);
          filteredData = result !== undefined ? result : filteredData;
        } else {
          filteredData = info?.filterFn(filteredData) || filteredData;
        }
      }
      return filteredData.filter((item) =>
        headers.some((header) => {
          const value = item[header];
          if (Array.isArray(value)) {
            return value.some((element) => {
              if (typeof element === "string") {
                return element.toLowerCase().includes(query.toLowerCase());
              } else if (typeof element === "object" && element !== null) {
                return Object.values(element).some((val) =>
                  val?.toString().toLowerCase().includes(query.toLowerCase()),
                );
              }
              return false;
            });
          } else {
            return value
              ?.toString()
              .toLowerCase()
              .includes(query.toLowerCase());
          }
        }),
      );
    };
    const searchBy = headings.map((h) => h.data);
    const filtered = searchInData(searchQuery, searchBy);
    setShownData(filtered);
  }, [data, headings, searchQuery, filterBy, filterInfo]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const capitalise = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-row">
          <h2 className="text-3xl ml-1 my-auto">{title}</h2>
        </div>
        <div className="w-[35%] ml-auto">
          <SearchBar
            handleSearch={() => handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          ></SearchBar>
        </div>
        {filterInfo && (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              className="btn btn-circle bg-white shadow-md border-secondary ml-2 p-4 h-auto w-13"
            >
              <img src={Filter} className="w-full" />
            </div>
            <div
              tabIndex={0}
              className="dropdown-content card bg-white rounded-box z-1 w-max p-3 shadow-md mt-2 mr-0.5 inset-shadow-2xs"
            >
              <form className="filter flex flex-row gap-1">
                <input
                  className="btn btn-sm btn-square border-secondary rounded-full bg-white"
                  type="reset"
                  value="×"
                  onClick={() => {
                    setFilterBy([]);
                  }}
                />
                {filterInfo.map((f) => {
                  return (
                    <input
                      key={f.title}
                      className="btn btn-sm border-0 rounded-full bg-secondary"
                      type="radio"
                      name="frameworks"
                      aria-label={f.title}
                      onClick={() => {
                        setFilterBy((prev) => [...prev, f.type]);
                      }}
                    />
                  );
                })}
              </form>
            </div>
          </div>
        )}
      </div>
      <table className="table w-full border-collapse rounded-lg overflow-hidden shadow-md">
        {/* Headers */}
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            {headings.map((heading, index) => {
              if (heading.data === "id" || heading.data === "groupId") {
                return null;
              }

              return (
                <th key={index} className="py-6 px-10 text-left font-bold">
                  {heading.title}
                </th>
              );
            })}
            {onJoinClick && (
              <th className="py-6 px-10 text-right font-bold"></th>
            )}
            {onDeleteClick && (
              <th className="py-6 px-10 text-right font-bold"></th>
            )}
          </tr>
        </thead>

        {/* Contents */}
        <tbody>
          {shownData?.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="bg-white hover:bg-gray-200 transition-all shadow-sm hover:shadow-md"
            >
              {headings.map((heading, colIndex) => {
                if (heading.data === "id" || heading.data === "groupId") return;
                return (
                  <td key={colIndex} className="py-5 px-10">
                    {heading.data === "count" ? (
                      <span
                        className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${
                          row.count === "6/6" ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {row[heading.data]}
                      </span>
                    ) : heading.data === "members" ? (
                      <div className="flex gap-2 flex-wrap">
                        {Array.isArray(row.members) ? (
                          row.members.map((member, index) => (
                            <div
                              key={index}
                              className="btn btn-link text-black font-normal !p-0"
                              onClick={() =>
                                navigate(`/student/profile/${member.id}`)
                              }
                            >
                              {member.name},
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500">No members</span>
                        )}
                      </div>
                    ) : heading.data === "is_verified" ? (
                      <div>
                        {row[heading.data] === true ? "Verified" : "Unverified"}
                      </div>
                    ) : heading.data === "projects" ? (
                      row[heading.data].map(
                        (d: Record<string, string>, index: number) => {
                          return (
                            <div
                              key={index}
                              className="btn btn-link text-black font-normal !p-0 truncate"
                              onClick={() => navigate(`/project/${d.id}/view`)}
                            >
                              {d.name}
                              {index % 2 === 0 && ","}
                            </div>
                          );
                        },
                      )
                    ) : heading.title === "Client Name" ? (
                      <div
                        className="btn btn-link text-black font-normal !p-0"
                        onClick={() => navigate(`/client/profile/${row["id"]}`)}
                      >
                        {row[heading.data]}
                      </div>
                    ) : heading.title === "Project Name" ? (
                      <div
                        className="btn btn-link text-black font-normal !p-0"
                        onClick={() => navigate(`/project/${row["id"]}/view`)}
                      >
                        {row[heading.data]}
                      </div>
                    ) : heading.data === "groups" ? (
                      <>
                        {row[heading.data].length !== 0
                          ? row[heading.data]?.map(
                              (
                                group: Record<string, string>,
                                index: number,
                              ) => (
                                <div
                                  key={index}
                                  className="btn btn-link text-black font-normal !p-0"
                                  onClick={() =>
                                    navigate(`/group/profile/${group.id}`)
                                  }
                                >
                                  {group.name}
                                  {index % 2 === 0 && ","}
                                </div>
                              ),
                            )
                          : "None"}
                      </>
                    ) : heading.title === "Member Name" ? (
                      row["role"] === "student" ? (
                        <div
                          className="btn btn-link text-black font-normal !p-0"
                          onClick={() =>
                            navigate(`/student/profile/${row["id"]}`)
                          }
                        >
                          {row[heading.data]}
                        </div>
                      ) : (
                        row[heading.data]
                      )
                    ) : heading.title === "Group Name" ? (
                      <div
                        className="btn btn-link text-black font-normal !p-0"
                        onClick={() => {
                          navigate(`/group/profile/${row["groupId"]}`);
                        }}
                      >
                        {row[heading.data]}
                      </div>
                    ) : heading.data === "clients" ? (
                      <>
                        {row[heading.data].length !== 0
                          ? row[heading.data]?.map(
                              (
                                client: Record<string, string>,
                                index: number,
                              ) => (
                                <div
                                  key={index}
                                  className="btn btn-link text-black font-normal !p-0"
                                  onClick={() =>
                                    navigate(`/client/profile/${client.id}`)
                                  }
                                >
                                  {client.name}
                                  {index % 2 === 0 && ","}
                                </div>
                              ),
                            )
                          : "None"}
                      </>
                    ) : heading.data === "role" ? (
                      capitalise(row[heading.data])
                    ) : heading.data === "tutorials" ? (
                      Array.isArray(row[heading.data]) ? (
                        row[heading.data].map((t: string, index: number) => (
                          <p key={index}>{t}</p>
                        ))
                      ) : (
                        <p>{row[heading.data]}</p>
                      )
                    ) : (
                      row[heading.data]
                    )}
                  </td>
                );
              })}

              {onJoinClick && (
                <td className="py-5 px-10 text-left flex jusify-center">
                  {row.isMine ? (
                    <span className="text-gray-500">Your Group</span>
                  ) : row.count === "6/6" ? (
                    <span className="text-gray-500">Full Group</span>
                  ) : (
                    <button
                      data-cy="join-button"
                      className="flex justify-center items-center gap-1 btn btn-outline btn-xs"
                      onClick={() => onJoinClick?.(row)}
                    >
                      <img src={Group} className="w-5" alt="group" />
                      Join
                    </button>
                  )}
                </td>
              )}

              {onDeleteClick && user === "staff" && (
                <td className="py-5 px-10">
                  {row.role === "student" ? (
                    <div className="flex justify-center items-center w-full">
                      <button
                        className="flex justify-center items-center gap-1 btn btn-outline btn-xs"
                        onClick={() => onDeleteClick?.(row)}
                      >
                        <img src={Delete} className="w-5" alt="delete" />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <></>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
