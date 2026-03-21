import { useState } from "react";

interface MultiSelectDropdownProps {
  id: string;
  name: string;
  selectedOptions: string[];
  options: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  selectedOptions,
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter((item) => item !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  return (
    <div
      className="w-full relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Dropdown Button */}
      <div className="border border-secondary rounded-sm p-2 cursor-pointer bg-white w-full flex flex-wrap">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span
              key={option}
              className="bg-secondary-content text-white px-2 py-1 rounded mr-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOptionSelect(option);
              }}
            >
              {option} ✕
            </span>
          ))
        ) : (
          <p className="px-2 py-1 text-gray-500">Select Options...</p>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute border border-secondary rounded-sm bg-white w-full z-10">
          {options.map((option) => (
            <div
              key={option}
              className={`p-2 cursor-pointer ${
                selectedOptions.includes(option)
                  ? "bg-gray-300"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
