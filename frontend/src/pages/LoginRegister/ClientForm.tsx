import { FormData } from "./Register";
interface ClientFormProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNext: () => void;
  handleBack: () => void;
  formInputs: FormData;
}

/**
 * Client registration component, which is used to collect company details
 */
function ClientForm({
  handleChange,
  handleNext,
  handleBack,
  formInputs,
}: ClientFormProps) {
  const abnRegex = /^[0-9]{11}$/;
  const contactHrRegex =
    /^(1[0-2]|0?[1-9]):[0-5][0-9](am|pm)-(1[0-2]|0?[1-9]):[0-5][0-9](am|pm)$/i;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formInputs.companyName = formInputs.companyName.trim().replace(/\s+/g, " ");
    formInputs.industry = formInputs.industry.trim().replace(/\s+/g, " ");
    if (
      !formInputs.companyABN.match(abnRegex) ||
      !formInputs.contactHours.match(contactHrRegex)
    ) {
      return;
    }
    handleNext();
  };
  return (
    <>
      <form
        className="w-full flex flex-col  text-left items-center"
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl mb-14 w-[70%]">Company Details</h3>
        <div className="grid grid-cols-2 gap-14 w-[70%] mb-12">
          <div className="flex flex-col">
            <label htmlFor="companyName" className="mb-1 text-left text-[14px]">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formInputs.companyName ? formInputs.companyName : ""}
              placeholder="Company Name"
              className="input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col text-left">
            <label htmlFor="companyABN" className="mb-1 text-[14px]">
              Company ABN/ACN
            </label>
            <input
              type="text"
              id="companyABN"
              name="companyABN"
              value={formInputs.companyABN ? formInputs.companyABN : ""}
              placeholder="Company ABN/ACN"
              className="input w-full"
              onChange={handleChange}
              required
            />
            {formInputs.companyABN.length > 0 &&
              !formInputs.companyABN.match(abnRegex) && (
                <p className="text-red-500 text-sm">
                  Company ABN should have 11 digits.
                </p>
              )}
          </div>

          <div className="flex flex-col text-left">
            <label htmlFor="industry" className="mb-1 text-[14px]">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formInputs.industry ? formInputs.industry : ""}
              placeholder="e.g. Education"
              className="input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col text-left ">
            <label htmlFor="contactHours" className="mb-1 text-[14px]">
              Contact Hours
            </label>
            <input
              type="contactHours"
              id="contactHours"
              name="contactHours"
              value={formInputs.contactHours ? formInputs.contactHours : ""}
              placeholder="9:00AM-5:00PM"
              className="input w-full"
              onChange={handleChange}
              required
            />
            {formInputs.contactHours.length > 0 &&
              !formInputs.contactHours.match(contactHrRegex) && (
                <p className="text-red-500 text-sm">
                  Contact hours must be in the correct format.
                  <br /> E.g 9:00AM-5:00PM
                </p>
              )}
          </div>
        </div>

        <div className="flex justify-between mt-6 w-[70%]">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            onClick={handleBack}
          >
            BACK
          </button>
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="submit"
          >
            SUBMIT
          </button>
        </div>
      </form>
    </>
  );
}

export default ClientForm;
