import RightArrow from "../assets/next.svg";

interface courseCardProps {
  name: string;
  code: string;
  desc: string;
  color: string;
}

export default function CourseCard({
  props,
  handleClick,
}: {
  props: courseCardProps;
  handleClick: () => void;
}) {
  const { name, code, desc, color } = props;
  return (
    <div className="card card-sm bg-base-100 shadow-lg">
      <figure
        className="h-5 w-full rounded-t-lg"
        style={{ backgroundColor: color }}
      ></figure>
      <div className="card-body !pb-1">
        <h2 className="card-title font-sans text-left line-clamp-2 min-h-6 max-h-12">
          {code}: {name}
        </h2>
        <div className="card-content h-20 overflow-hidden">
          <p className="text-left font-sans line-clamp-4">{desc}</p>
        </div>
      </div>
      <div className="card-body !pt-0 !justify-end !ml-auto">
        <div
          id="view"
          className="btn btn-circle btn-ghost border-0 p-2 hover:bg-secondary"
          onClick={handleClick}
        >
          <img src={RightArrow} />
        </div>
      </div>
    </div>
  );
}
