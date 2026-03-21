import React from "react";
import { MemberWishlistInfo } from "../../pages/constants";

const AutoProjectPreferencer = ({
  wishlists,
  wishlistHandler,
  autoHandler,
}: {
  wishlists: MemberWishlistInfo[];
  wishlistHandler: React.Dispatch<React.SetStateAction<string>>;
  autoHandler: () => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    wishlistHandler(e.target.value);
  };

  return (
    <div>
      <p className="text-left mb-5">
        Auto-rank projects based on individual preferences
      </p>
      <button className="drk-btn drk-btn-hover w-52" onClick={autoHandler}>
        AUTO-RANK
      </button>
      <div className="divider">OR</div>
      <p className="text-left mb-5">
        Manually rank projects from member wishlists
      </p>

      <select
        defaultValue="Select a wishlist"
        className="select w-52"
        onChange={handleChange}
      >
        <option disabled={true}>Select a wishlist</option>
        {wishlists.map((w: MemberWishlistInfo) => {
          return (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default AutoProjectPreferencer;
