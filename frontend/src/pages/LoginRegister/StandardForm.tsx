import { FormData } from "./Register";

interface StandardFormProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNext: () => void;
  formInputs: FormData;
  user: string;
}

/**
 * Standard form for all users, where they input normal user details
 */
function StandardForm({
  handleChange,
  handleNext,
  formInputs,
  user,
}: StandardFormProps) {
  const emailRegex = /^z[0-9]{7}@ad.unsw.edu.au$/;

  const zidRegex = /^z[0-9]{7}$/;
  const phRegex =
    /^(\+?\(61\)|\(\+?61\)|\+?61|\(0[1-9]\)|0[1-9])?( ?-?[0-9]){7,9}$/;
  const spaceRegex = /\s+/;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formInputs.firstName = formInputs.firstName.trim().replace(/\s+/g, " ");
    formInputs.lastName = formInputs.lastName.trim().replace(/\s+/g, " ");
    formInputs.phone = formInputs.phone.trim();
    formInputs.email = formInputs.email.trim();

    // NOTE: FOR TESTING PURPOSES commented out code is to make sure that
    // we are able to test the mailersend as UNSW has a blocker that prevents
    // emails to be sent to the domain
    // if (user !== "client") {
    //   if (
    //     !formInputs.email.match(emailRegex) ||
    //     !formInputs.zid.match(zidRegex)
    //   ) {
    //     return;
    //   }
    //   if (formInputs.zid !== formInputs.email.slice(0, 8)) {
    //     return;
    //   }
    // }
    if (
      formInputs.password.length < 8 ||
      formInputs.password !== formInputs.confirmPassword
    ) {
      return;
    }
    if (
      formInputs.password.match(spaceRegex) ||
      formInputs.confirmPassword.match(spaceRegex)
    ) {
      return;
    }
    handleNext();
  };

  const CheckEmail = () => {
    const { email, zid } = formInputs;
    if (
      user !== "client" &&
      email.length > 0 &&
      email.match(emailRegex) &&
      zid.length > 1 &&
      zid.length === 8 &&
      zid.match(zidRegex) &&
      zid !== email.slice(0, 8)
    ) {
      return <p className="text-red-500 text-sm">zID must match with email</p>;
    }
    return <></>;
  };

  return (
    <>
      <form
        className="w-full flex flex-col items-center"
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl mb-14 text-left w-[70%]">Your Details</h3>
        <div className="grid grid-cols-2 gap-14 w-[70%] mb-12">
          <div className="flex flex-col">
            <label htmlFor="firstName" className="mb-1 text-left text-[14px]">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formInputs.firstName ? formInputs.firstName : ""}
              placeholder="First Name"
              className="input w-full"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="lastName" className="mb-1 text-left text-[14px]">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formInputs.lastName ? formInputs.lastName : ""}
              placeholder="Last Name"
              className="input w-full"
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col text-left ">
            <label htmlFor="email" className="mb-1 text-[14px]">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formInputs.email ? formInputs.email : ""}
              placeholder="Email"
              className="input w-full"
              onChange={handleChange}
              required
            />

            {/* {user !== "client" &&
              formInputs.email.length > 0 &&
              !formInputs.email.match(emailRegex) && (
                <p className="text-red-500 text-sm">Email must be unsw email</p>
              )} */}
          </div>

          {user === "client" ? (
            <div className="flex flex-col text-left">
              <label htmlFor="phone" className="mb-1 text-[14px]">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formInputs.phone ? formInputs.phone : ""}
                placeholder="Phone Number"
                className="input w-full"
                onChange={handleChange}
                required
              />
              {formInputs.phone.length > 0 &&
                !formInputs.phone.match(phRegex) && (
                  <p className="text-red-500 text-sm">
                    Phone number is invalid
                  </p>
                )}
            </div>
          ) : (
            <div className="flex flex-col text-left ">
              <label htmlFor="zid" className="mb-1 text-[14px]">
                zID
              </label>
              <input
                type="text"
                id="zid"
                name="zid"
                value={formInputs.zid ? formInputs.zid : ""}
                placeholder="z1234567"
                className="input w-full"
                onChange={handleChange}
                required
              />
              {user !== "client" &&
                formInputs.zid.length > 1 &&
                formInputs.zid.length !== 8 &&
                !formInputs.zid.match(zidRegex) && (
                  <p className="text-red-500 text-sm">
                    zId is in invalid format.
                  </p>
                )}
              <CheckEmail />
            </div>
          )}

          <div className="flex flex-col text-left">
            <label htmlFor="password" className="  mb-1 text-[14px]">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formInputs.password ? formInputs.password : ""}
              placeholder="Password"
              className="validator input w-full"
              onChange={handleChange}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              required
            />
            <p className="validator-hint hidden text-xs">
              Must be more than 8 characters, including
              <br />
              At least one number
              <br />
              At least one lowercase letter
              <br />
              At least one uppercase letter
            </p>
            {formInputs.password.match(spaceRegex) && (
              <p className="text-[#e74c3c] text-xs">
                Passwords cannot have spaces
              </p>
            )}
          </div>

          <div className="flex flex-col text-left">
            <label htmlFor="confirmPassword" className="mb-1 text-[14px]">
              Re-enter Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter Password"
              value={
                formInputs.confirmPassword ? formInputs.confirmPassword : ""
              }
              className="input w-full"
              onChange={handleChange}
              required
            />
            {formInputs.confirmPassword &&
              formInputs.password !== formInputs.confirmPassword && (
                <p className="text-red-500 text-xs">Passwords do not match</p>
              )}
            {formInputs.confirmPassword.match(spaceRegex) && (
              <p className="text-red-500 text-xs">
                Passwords cannot have spaces
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-6 w-[70%]">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg"
            type="submit"
          >
            {user === "client" ? "NEXT" : "SUBMIT"}
          </button>
        </div>
      </form>
    </>
  );
}

export default StandardForm;
