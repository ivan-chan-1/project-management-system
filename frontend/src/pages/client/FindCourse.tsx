import { useState, useEffect } from "react";
import CourseCard from "../../components/CourseCard";
import { useNavigate } from "react-router-dom";
import { getAllCourses, searchCourse } from "../../apiUtil";
import { CourseInfo } from "../constants";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

/**
 * A search page for clients to find courses they want to apply to.
 */
export default function FindCourse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allCourses, setAllCourses] = useState<CourseInfo[]>();
  const [courses, setCourses] = useState<CourseInfo[]>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const fetchCourses = async () => {
      const token = localStorage.getItem("token") || "";
      const res = await getAllCourses(token);
      setAllCourses(res.data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Searches for courses based on the search query
  const handleSearch = async () => {
    setLoading(true);
    if (searchQuery === "") {
      setCourses(allCourses);
      setLoading(false);
    } else {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const { data } = await searchCourse(token, searchQuery);
        setCourses(data);
      } catch (err) {
        if (isAxiosError(err)) {
          toast.error(err.response?.data["Error"]);
        }
      }
      setLoading(false);
    }
  };

  const handleClick = (id: string) => {
    navigate(`/course/${id}/view`);
  };

  return (
    <div data-theme="mytheme" className="w-screen h-auto m-0 p-0">
      <div className="w-screen h-auto px-25 mb-25">
        <div className="flex flex-row justify-center mt-10">
          <div
            className="btn btn-circle btn-ghost border-0 hover:bg-secondary mr-4"
            onClick={() => navigate("/dash")}
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
          <h2 className="text-4xl">
            Find your course, and apply to be a client
          </h2>
        </div>
        <div className="flex flex-row justify-center mt-14 mb-16">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="w-4/9"
          >
            <div className="search-container flex relative items-center rounded-3xl shadow-md outline-1 outline-secondary px-6 py-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full outline-0"
                maxLength={30}
              />

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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
          </form>
        </div>
        {loading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : (
          <>
            <div className="w-full h-auto grid gap-14 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses
                ? courses.map((c) => {
                    return (
                      <CourseCard
                        key={c.id}
                        handleClick={() => handleClick(c.id)}
                        props={{
                          name: c.name,
                          code: c.code,
                          desc: c.description,
                          color: c.color,
                        }}
                      />
                    );
                  })
                : allCourses?.map((c) => {
                    return (
                      <CourseCard
                        key={c.id}
                        handleClick={() => handleClick(c.id)}
                        props={{
                          name: c.name,
                          code: c.code,
                          desc: c.description,
                          color: c.color,
                        }}
                      />
                    );
                  })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
