import { ChangeEvent } from "react";
import ProfileDetails from "../ProfileDetails";
import ProfileImage from "../ProfileImage";
import StudentProfileStatus from "./StudentProfileStatus";

interface StudentProps {
  editMode: boolean;
  profileName: string;
  year: string;
  zid: string;
  setYear: (value: string) => void;
  tutorial: string;
  setTutorial: (value: string) => void;
  status: string;
  image: string | null;
  file: React.RefObject<HTMLInputElement | null>;
  handleFile: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function StudentDetailsCard(props: StudentProps) {
  const {
    editMode,
    profileName,
    setYear,
    zid,
    setTutorial,
    status,
    image,
    file,
    handleFile,
  } = props;
  let { year, tutorial } = props;
  if (editMode === true) {
    year = year === "-" ? "" : year;
    tutorial = tutorial === "-" ? "" : tutorial;
  }

  return (
    <div className="relative w-1/3 h-auto items-stretch bg-white p-10 rounded-lg shadow-lg inset-shadow-2xs">
      <div className="flex flex-col gap-5 text-left">
        <ProfileImage
          editMode={editMode}
          image={image}
          file={file}
          initial={profileName}
          handleFile={handleFile}
        />
        <h2 className="text-2xl mb-4">{profileName}</h2>
        <h2 className="text-md font-semibold ">Student Id </h2>
        <p className="text-left">{zid}</p>
        <ProfileDetails
          editMode={editMode}
          name="Year"
          value={year}
          updateValue={setYear}
        />
        {status !== "N/A" && (
          <>
            <ProfileDetails
              editMode={editMode}
              name="Tutorial"
              value={tutorial}
              updateValue={setTutorial}
            />
            <StudentProfileStatus value={status} />
          </>
        )}
      </div>
    </div>
  );
}
