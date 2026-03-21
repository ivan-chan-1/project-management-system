import { PropsWithChildren, useState, useEffect } from "react";

type Details = {
  name: string;
  courseCode: string;
  term: number;
  handleUpdate: (type: keyof Course, value: string | number | boolean) => void;
  isReleased: boolean;
};

type Course = {
  name: string;
  code: string;
  term: number;
  preference_release: boolean;
};

export const CourseDetailsCard = (props: PropsWithChildren<Details>) => {
  const [course, setCourse] = useState<Course>({
    name: "",
    code: "",
    term: 0,
    preference_release: false,
  });
  const terms = [
    { value: 0, name: "Summer Term" },
    { value: 1, name: "Term 1" },
    { value: 2, name: "Term 2" },
    { value: 3, name: "Term 3" },
  ];
  useEffect(() => {
    setCourse({
      name: props.name,
      code: props.courseCode,
      term: props.term,
      preference_release: props.isReleased,
    });
  }, [props]);

  const handleChange = (type: keyof Course, value: string | boolean) => {
    const parsedValue = value;
    setCourse((prev) => {
      const newState = { ...prev, [type]: parsedValue };
      return newState;
    });

    props.handleUpdate(type, parsedValue);
  };

  return (
    <div className="card bg-transparent rounded-sm">
      <div className="card-body p-0">
        <div className="text-left">
          <div className="form-control mb-2 space-y-4">
            <div className="flex space-x-10">
              <label className="label w-50 text-black">
                <span className="label-text">Course Name</span>
              </label>
              <input
                type="text"
                name="course-name"
                value={course.name || ""}
                placeholder="Type here"
                onChange={(e) => handleChange("name", e.target.value)}
                className="input w-[30%]"
              />
            </div>
            <div className="flex space-x-10">
              <label className="label text-black w-50">Course Code</label>
              <input
                type="text"
                value={course.code || ""}
                placeholder="ABCD1234"
                onChange={(e) => handleChange("code", e.target.value)}
                className="input w-[30%]"
                disabled
              />
            </div>
            <div className="flex space-x-10">
              <label className="label text-black w-50">
                <span className="label-text">Term</span>
              </label>
              <select
                className="select mt-3 mb-2 w-[30%]"
                value={course.term}
                onChange={(e) => handleChange("term", e.target.value)}
                disabled
              >
                <option disabled value="">
                  Select Field
                </option>
                {terms.map((item, idx) => (
                  <option key={idx} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-10">
              <label className="label text-black w-50">
                <span className="label-text">
                  Release Project Preference Form
                </span>
              </label>
              <input
                type="checkbox"
                className="toggle"
                checked={props.isReleased}
                onChange={(e) =>
                  handleChange("preference_release", e.target.checked)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
