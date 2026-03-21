import { ChangeEvent, useEffect, useState } from "react";
import ProfileDetails from "../ProfileDetails";
import ProfileImage from "../ProfileImage";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../ConfirmModal";

interface ProfileProps {
  editMode: boolean;
  name: string;
  setName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  abn: string;
  setAbn: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  image: string | null;
  file: React.RefObject<HTMLInputElement | null>;
  handleFile: (event: ChangeEvent<HTMLInputElement>) => void;
  phone: string;
  setPhone: (value: string) => void;
  isVerified: boolean;
  changeIsVerified: (value: boolean) => void;
}
export default function ProfileCard(props: ProfileProps) {
  const {
    editMode,
    name,
    setName,
    companyName,
    // setCompanyName,
    abn,
    setAbn,
    email,
    setEmail,
    address,
    setAddress,
    image,
    file,
    handleFile,
    phone,
    setPhone,
    isVerified,
    changeIsVerified,
  } = props;
  const [user, setUser] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const user = localStorage.getItem("user") || "";
    setUser(user);
  }, [isVerified]);

  return (
    <div className="w-1/3 h-auto bg-white p-10 rounded-lg shadow-lg inset-shadow-2xs">
      <div className="flex flex-col gap-5 text-left">
        <ProfileImage
          editMode={editMode}
          image={image}
          file={file}
          handleFile={handleFile}
          initial={companyName}
        />
        <h2 className="text-2xl mb-4">{companyName}</h2>
        <ProfileDetails
          editMode={editMode}
          name="Name"
          value={name}
          updateValue={setName}
        />
        <ProfileDetails
          editMode={editMode}
          name="ABN"
          value={abn}
          updateValue={setAbn}
        />
        <ProfileDetails
          editMode={editMode}
          name="Email"
          value={email}
          updateValue={setEmail}
        />
        <ProfileDetails
          editMode={editMode}
          name="Phone"
          value={phone}
          updateValue={setPhone}
        />
        <ProfileDetails
          editMode={editMode}
          name="Address"
          value={address}
          updateValue={setAddress}
        />
        {user === "staff" && !isVerified && (
          <div className="flex flex-row justify-between w-full gap-4">
            <button
              className="btn btn-md btn-base-200 border-0 flex-1/2 !font-bold text-primary h-12"
              onClick={() => {
                const modal = document.getElementById(
                  "false_modal",
                ) as HTMLDialogElement | null;
                modal?.showModal();
              }}
            >
              REJECT
            </button>
            <ConfirmModal
              title="Reject Client"
              message=" Would you like to reject this client? This will remove the client from all courses."
              confirm={false}
              confirmText="Reject"
              successMessage="Client removed successfully. The client will be notified of this change."
              onConfirm={changeIsVerified}
              onDone={() => navigate("/admin/client/verify")}
            />
            <button
              className="btn btn-md btn-success border-0 flex-1/2 !font-bold h-12"
              onClick={() => {
                const modal = document.getElementById(
                  "true_modal",
                ) as HTMLDialogElement | null;
                modal?.showModal();
              }}
            >
              VERIFY
            </button>
            <ConfirmModal
              title="Verify Client"
              message="Would you like to verify this client? This will verify the client for all courses."
              confirm={true}
              confirmText="Verify"
              successMessage="Client verified successfully. The client will be notified of this change."
              onConfirm={changeIsVerified}
              onDone={() => navigate("/admin/client/verify")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
