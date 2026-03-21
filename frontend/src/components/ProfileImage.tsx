import { ChangeEvent } from "react";
interface ImageProps {
  editMode: boolean;
  image: string | null;
  file: React.RefObject<HTMLInputElement | null>;
  handleFile: (event: ChangeEvent<HTMLInputElement>) => void;
  initial: string;
}
export default function ProfileImage({
  editMode,
  image,
  file,
  handleFile,
  initial,
}: ImageProps) {
  const setInitials = (initial: string = "") => {
    const nameParts = initial.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  };
  return (
    <>
      <div className="avatar justify-center mb-4 mt-4">
        <label className="cursor-pointer">
          {editMode && (
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={file}
              onChange={handleFile}
            />
          )}
          {image ? (
            <div
              className="avatar mb-4"
              data-hs-file-upload-previews=""
              data-hs-file-upload-pseudo-trigger=""
            >
              <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={image} className="w-32" alt="Uploaded Photo" />
              </div>
            </div>
          ) : (
            <div
              className="avatar justify-center mb-4"
              data-hs-file-upload-previews=""
              data-hs-file-upload-pseudo-trigger=""
            >
              <span className="group-has-[div]:hidden flex justify-center items-center size-30 border-6 text-4xl border-gray-300 text-white-500 bg-gray-300 rounded-full">
                {setInitials(initial)}
              </span>
            </div>
          )}
        </label>
      </div>
    </>
  );
}
