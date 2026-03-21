const WishlistList = ({
  id,
  name,
  rank,
  proj_no,
  area,
  notes,
}: {
  id: string;
  name: string;
  rank?: number;
  proj_no: number | null;
  area: string;
  notes?: string;
}) => {
  const style =
    notes === undefined || notes === ""
      ? "flex justify-between tems-center"
      : "flex justify-between tems-center mb-4";
  return (
    <li className="list-row" key={id}>
      <div className="text-lg tabular-nums content-center mr-5">{rank}</div>
      <div>
        <div className={style}>
          <div className="text-lg text-left">
            {proj_no && " : "}
            {name}
          </div>
          <div className="badge badge-soft badge-neutral">{area}</div>
        </div>
        {notes && (
          <>
            <div className="text-left opacity-60 mb-2">Notes</div>
            <div className="text-left">{notes}</div>
          </>
        )}
      </div>
    </li>
  );
};

export default WishlistList;
