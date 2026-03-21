import forward from "../../assets/back.svg";

export interface AlertProps {
  title: string;
  desc?: string;
  colour?: string;
  handler?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Alert = ({ title, desc, colour, handler }: AlertProps) => {
  const style =
    colour === "error"
      ? "alert alert-error alert-soft alert-horizontal mb-5 w-full"
      : "alert alert-warning alert-soft alert-horizontal mb-5 w-full";

  return (
    <div role="alert" className={style}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div>
        <h3 className="font-bold">{title}</h3>
        <div className="text-xs">{desc}</div>
      </div>
      {colour === "error" ? (
        <button
          className="btn circle btn-circle btn-ghost hover:bg-error border-0"
          onClick={handler && (() => handler(false))}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      ) : (
        <button className="btn circle btn-circle btn-ghost hover:bg-warning border-0">
          <img src={forward} className="scale-x-[-1] w-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
