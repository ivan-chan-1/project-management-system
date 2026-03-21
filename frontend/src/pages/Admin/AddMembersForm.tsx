interface AddStudentsFormProps {
  handleNext: () => void;
  handleBack: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  members: string;
  setMembers: (students: string) => void;
  mode: string;
}

/**
 * This page allows course administrators to add students and tutors
 * to a subcourse.
 */
function AddMembersForm({
  handleNext,
  handleBack,
  file,
  setFile,
  members,
  setMembers,
  mode,
}: AddStudentsFormProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  return (
    <>
      <form
        className="w-full flex flex-col items-center mb-20"
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <h3 className="text-xl mb-10 text-left">
          Add {mode === "student" ? "Students" : "Tutors"}
        </h3>
        <p className="mb-15 text-[15px]">
          Please enter {mode === "student" ? "students" : "tutors"} manually, or
          upload a CSV file to add them to the course
        </p>

        <div className="flex flex-col gap-14 w-[70%] mb-12">
          <div className="flex flex-col">
            <label htmlFor="members" className="mb-1 text-left text-[14px]">
              Enter {mode === "student" ? "students" : "tutors"}
            </label>
            <textarea
              id="members"
              name="members"
              value={members}
              placeholder="please enter name, email, zid, tutorial separated by a comma, i.e. John Smith, z1234567@ad.unsw.edu.au, z1234567"
              className="border p-3 rounded border-secondary text-wrap"
              onChange={(e) => setMembers(e.target.value)}
            />
          </div>

          <div>OR</div>

          <div className="flex flex-col">
            <label htmlFor="csvUpload" className="mb-1 text-left text-[14px]">
              Upload a CSV file
            </label>
            <input
              key={file ? file.name : "file-input"}
              type="file"
              className="file-input"
              id="csvUpload"
              accept=".csv"
              onChange={handleFileUpload}
            />
            {file && <p className="mt-2 text-sm">Selected file: {file.name}</p>}

            <p className="mt-5 text-[14px] text-left">
              Please ensure that the file is in the correct format. <br />
              <span className="text-info">
                The first row should contain the headers: name, email, zid,
                tutorial. Each subsequent row should contain the corresponding
                data for each {mode === "students" ? "student" : "tutor"}{" "}
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-6 w-[70%]">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="button"
            onClick={handleBack}
          >
            BACK
          </button>

          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="submit"
          >
            {mode === "student" ? "NEXT" : "SUBMIT"}
          </button>
        </div>
      </form>
    </>
  );
}

export default AddMembersForm;
