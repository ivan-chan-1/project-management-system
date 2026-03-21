import { PropsWithChildren, useEffect, useState } from "react";

type Details = {
  groupSize: number;
  handleUpdate: (value: number) => void;
};

export const GroupRulesCard = (props: PropsWithChildren<Details>) => {
  const [groupSize, setGroupSize] = useState(props.groupSize || 0);
  const handleUpdate = (value: number) => {
    setGroupSize(value);
    props.handleUpdate(value);
  };

  useEffect(() => {
    setGroupSize(props.groupSize);
  }, [props]);
  return (
    <div className="card  bg-transparent rounded-sm">
      <div className="card-body p-0">
        <div className=" text-left ">
          <div className="form-control mb-2 space-y-4 t">
            <div className="flex space-x-10 ">
              <label className="label text-black w-50">
                <span className="label-text">Maximum group size</span>
              </label>
              <input
                type="text"
                name="group-size"
                min={1}
                value={groupSize || ""}
                placeholder="Type here"
                onChange={(e) => handleUpdate(parseInt(e.target.value))}
                className="input w-[5%]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
