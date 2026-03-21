import { useEffect, useState } from "react";
import Page from "../../components/Layout-Nav/Page";
import {
  MemberWishlistInfo,
  ProjectPreferenceInfo,
  StudentInfo,
} from "../constants";
import {
  getGroupMembers,
  getStudentPreferences,
  getStudentWishlist,
} from "../../apiUtil";
import WishlistList from "../../components/Group/WishlistList";
import { useParams } from "react-router-dom";

/**
 * This page displays the wishlist of all members in a group.
 */
const GroupWishlistPage = () => {
  const [member, setMember] = useState<{ id: string; name: string }>({
    id: "",
    name: "",
  });
  const [members, setMembers] = useState<StudentInfo[]>([]);
  const [preferences, setPreferences] = useState<ProjectPreferenceInfo[]>([]);
  const [wishlists, setWishlists] = useState<MemberWishlistInfo[]>([]);
  const params = useParams();
  const groupId = params.groupId ?? "";

  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token") ?? "";
      const res = await getGroupMembers(token, groupId);
      setMembers(res.data);
    };

    fetchMembers();
  }, [groupId]);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const subcourse = localStorage.getItem("subcourse") ?? "";
    const fetchPreferences = async () => {
      const res = await getStudentPreferences(token, subcourse, member.id);
      setPreferences(res.data);
    };

    const fetchWishlists = async () => {
      const res = await getStudentWishlist(token, subcourse, member.id);
      setWishlists(res.data);
    };

    fetchWishlists();
    fetchPreferences();
  }, [member]);

  const handleClick = (id: string, name: string) => {
    setMember({ id, name });
  };

  return (
    <Page
      title="Member Wishlists"
      back={true}
      backRoute={`/student/dashboard/${localStorage.getItem("subcourse")}`}
    >
      <div className="flex flex-col w-full px-30 py-8 gap-4">
        {members.map((s: StudentInfo) => {
          return (
            <div
              className="collapse bg-base-100 border border-base-300"
              onClick={() => handleClick(s.id, s.name)}
            >
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title text-xl text-left">{s.name}</div>
              <div className="collapse-content">
                <ul className="list bg-base-100 mt-2">
                  {preferences.map((p) => {
                    const area =
                      p.project.areas.length === 0 ? "" : p.project.areas[0];
                    return (
                      <WishlistList
                        id={p.project.id}
                        name={p.project.name}
                        rank={p.rank}
                        proj_no={p.project.proj_no}
                        area={area}
                        notes={p.notes}
                      />
                    );
                  })}
                  {wishlists.length !== 0 &&
                    wishlists[0].wishlist.map((w) => {
                      const area = w.areas.length === 0 ? "" : w.areas[0];
                      return (
                        <WishlistList
                          id={w.id}
                          name={w.name}
                          proj_no={w.proj_no}
                          area={area}
                        />
                      );
                    })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

export default GroupWishlistPage;
