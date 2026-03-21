import ProjectFormContainer from "./ProjectFormContainer";

/**
 * New project page, uses the form container that is reused for edit.
 */
export default function NewProject() {
  const courseId = localStorage.getItem("subcourse") ?? "";
  const token = localStorage.getItem("token") ?? "";

  return (
    <ProjectFormContainer mode="create" courseId={courseId} token={token} />
  );
}
