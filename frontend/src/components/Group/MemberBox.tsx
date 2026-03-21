import { useNavigate } from "react-router-dom";
import User from "../../assets/user.svg";

type MemberProps = {
  id: string;
  name: string;
  lead?: string | null;
};
// TODO: Add profile picture

export default function MemberBox({ id, name, lead }: MemberProps) {
  const navigate = useNavigate();
  const handleUserProfile = () => {
    navigate(`/student/profile/${id}`);
  };
  return (
    <div className="flex flex-row gap-2">
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={User} className="w-full" />
        </div>
      </div>
      <div className="flex flex-row item-center gap-4">
        <div
          className="btn btn-link text-black no-underline font-normal text-base text-md"
          onClick={handleUserProfile}
        >
          {name}
        </div>
        <div className="text-gray-400 text-sm content-center">
          {lead && lead === id && "Group Lead"}
        </div>
      </div>
    </div>
  );
}
