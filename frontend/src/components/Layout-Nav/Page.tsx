import { ReactElement, PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

type PageProps = {
  title: string;
  back: boolean;
  extraContent?: ReactElement | null;
  backRoute?: string;
  beforeBack?: () => void;
};

export default function Page(props: PropsWithChildren<PageProps>) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (props.beforeBack) {
      props.beforeBack();
    }
    if (props.backRoute) {
      navigate(props.backRoute);
    } else {
      navigate(-1);
    }
  };

  return (
    <div data-theme="mytheme" className="w-screen h-auto m-0 p-0">
      <div className="w-screen h-auto px-25 mb-25">
        <div className="flex flex-row mt-15">
          {props.back && (
            <div
              className="btn btn-circle btn-ghost mr-4 hover:bg-secondary border-0"
              onClick={handleBack}
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </div>
          )}
          <div className="text-4xl">{props.title}</div>
          {props.extraContent && (
            <div className="ml-auto">{props.extraContent}</div>
          )}
        </div>
        {props.children}
      </div>
    </div>
  );
}
