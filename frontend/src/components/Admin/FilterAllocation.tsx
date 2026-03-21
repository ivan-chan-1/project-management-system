import FilterIcon from "../../assets/filter.svg?react";

const filterOptions = [
  { label: "Full", value: "full" },
  { label: "Partially Filled", value: "partial" },
  { label: "Empty", value: "empty" },
];

const FilterAllocation = ({
  tutorials,
  filterHandler,
}: {
  tutorials: string[];
  filterHandler: React.Dispatch<
    React.SetStateAction<Record<string, string | boolean>>
  >;
}) => {
  const handleFilterChange = (filter: string) => {
    filterHandler((prev) => {
      if (["full", "partial", "empty"].includes(filter)) {
        return { ...prev, [filter]: !prev[filter] };
      } else {
        return { ...prev, tutorial: filter };
      }
    });
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        className="btn btn-circle bg-white shadow-md border-1 border-gray-100 w-10 icon-hover focus:text-[#1794FA]"
      >
        <FilterIcon className="w-5" />
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-white border-1 border-gray-100 rounded-box z-1 w-max p-4 shadow-md mt-2"
      >
        <div className="text-left text-lg mb-2">Filter By</div>
        <div className="flex flex-row gap-8">
          <div>
            <div className="text-left text-sm mb-2">Allocation</div>
            {filterOptions.map((f) => {
              return (
                <fieldset key={f.value} className="fieldset">
                  <label className="label text-black">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      onChange={() => handleFilterChange(f.value)}
                    />
                    {f.label}
                  </label>
                </fieldset>
              );
            })}
          </div>
          {tutorials.length !== 0 && (
            <div>
              <div className="text-left text-sm mb-2">My Tutorials</div>
              <select
                className="select select-sm"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value={""}>Pick a tutorial</option>
                {tutorials.map((t) => {
                  return (
                    <option value={t} key={t}>
                      {t}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterAllocation;
