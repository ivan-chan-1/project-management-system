import toast from "react-hot-toast";
import { autoAllocateProjects } from "../../apiUtil";

/**
 * A component that allows users to select and run an allocation algorithm
 *
 * @param {React.Dispatch<React.SetStateAction<Record<string, { id: string; name: string }[]>>} handler
 */
const AutoAllocator = ({
  handler,
}: {
  handler: React.Dispatch<
    React.SetStateAction<Record<string, { id: string; name: string }[]>>
  >;
}) => {
  // Fetch results from allocation algorithm and display state
  const handleClick = async () => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse = localStorage.getItem("subcourse") ?? "";
    try {
      toast.promise(
        async () => {
          const res = await autoAllocateProjects(token, subcourse);
          handler(res.data);
        },
        {
          loading: "Computing possible allocations",
        },
      );
    } catch (err) {
      toast.error("Error while auto-allocating projects" + err);
    }
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 items-center">
        {/* Auto-allocation selection */}
        <select defaultValue="Select Algorithm" className="select w-52">
          <option disabled={true}>Select Algorithm</option>
          <option>Semantic Allocation</option>
        </select>

        {/* Triggers running of auto-allocation algorithm */}
        <button className="drk-btn drk-btn-hover w-52" onClick={handleClick}>
          AUTO-ALLOCATE
        </button>
      </div>

      <div className="divider">OR</div>
    </div>
  );
};

export default AutoAllocator;
