import { useNavigate } from "react-router-dom";
import Info from "../../assets/info.svg";
import InfoFill from "../../assets/infofill.svg";

/**
 * A component that directs user to a new page for more information
 *
 * @param route - the page to navigate to
 */
const InfoIconButton = ({ route }: { route: string }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(route);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer relative w-5 h-5 group"
    >
      <img
        src={Info}
        width={20}
        className="absolute top-0 left-0 group-hover:hidden"
      />
      <img
        src={InfoFill}
        width={20}
        className="absolute top-0 left-0 hidden group-hover:block"
      />
    </div>
  );
};

export default InfoIconButton;
