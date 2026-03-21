export interface GroupBioProps {
  bio: string;
  goals: string;
}

export default function GroupBioCard({
  comments,
}: {
  comments: GroupBioProps;
}) {
  return (
    <div className="flex flex-row gap-5">
      <div className="w-1/2 p-5 rounded-lg inset-shadow-2xs shadow-md">
        <h2 className="text-2xl mb-4">Bio</h2>
        <p>{comments.bio}</p>
      </div>
      <div className="w-1/2 p-5 rounded-lg inset-shadow-2xs shadow-md">
        <h2 className="text-2xl mb-4">Goals</h2>
        <p>{comments.goals}</p>
      </div>
    </div>
  );
}
