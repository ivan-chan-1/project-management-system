import Search from "../assets/search.svg";

interface SearchBarProps {
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SearchBar({
  handleSearch,
  searchQuery,
  setSearchQuery,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch(e);
      }}
      className="w-full"
    >
      <div className="search-container flex relative items-center rounded-3xl shadow-md outline-1 outline-secondary px-6 py-3 max-h-30 mr-1">
        <input
          type="text"
          name="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full outline-0"
          maxLength={30}
        />

        <button id="search-button" type="submit" className="w-7 !p-0">
          <img
            src={Search}
            alt="search"
            className="h-full w-auto fill-primary"
          />
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
