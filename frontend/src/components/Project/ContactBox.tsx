import { useNavigate } from "react-router-dom";
import User from "../../assets/user.svg";

type MemberProps = {
  id: string;
  name: string;
};
// TODO: Add profile picture

export default function ContactBox({ id, name }: MemberProps) {
  const navigate = useNavigate();
  const handleUserProfile = () => {
    navigate(`/client/profile/${id}`);
  };
  return (
    <div className="flex flex-row gap-2">
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={User} className="w-full" />
        </div>
      </div>
      <div
        className="btn btn-link text-black no-underline font-normal text-base text-md"
        onClick={handleUserProfile}
      >
        {name}
      </div>
    </div>
  );
}
