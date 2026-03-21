import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import BackArrow from "../../assets/back.svg";
import { verifiedResetPassword, verifyPin } from "../../apiUtil";

/**
 * This page allows the user to verify their PIN and reset their password.
 */
function VerifyPin() {
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { user, encodedEmail } = useParams();
  const email = decodeURIComponent(encodedEmail ?? "");
  const userType = user ?? "";

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
  };

  const handlePinSubmit = async () => {
    if (!pin) {
      toast.error("Please enter the PIN");
      return;
    }

    try {
      await verifyPin(pin, email, userType);
      setPinVerified(true);
    } catch (err) {
      toast.error("Error verifying PIN. Please try again.");
      console.error(err);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      await verifiedResetPassword(password, email, userType);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Error updating password");
    }
  };

  return (
    <div
      data-theme="mytheme"
      className="flex flex-col justify-center items-center min-h-screen w-screen bg-[#D5EEFF]"
    >
      <div className="bg-white p-8 rounded-sm shadow-md w-[80%] h-[80%] flex flex-col">
        <div
          className="float-left p-2 w-10 h-auto btn btn-ghost btn-circle"
          onClick={() => navigate("/login")}
        >
          <img src={BackArrow} alt="back" className="w-full" />
        </div>
        <div className="flex justify-center">
          <div className="w-[50%] py-30">
            <h1 className="text-left mb-8">
              {pinVerified ? "Reset Your Password" : "Enter Access Code"}
            </h1>

            {!pinVerified ? (
              <>
                <p className="mb-4 text-left">
                  A code has been sent to <strong>{email}</strong>
                </p>
                <div className="flex flex-col">
                  <label htmlFor="pin" className="mb-1 text-left text-[14px]">
                    Enter the code sent to your email (Note this may take a
                    minute):
                  </label>
                  <input
                    type="text"
                    id="pin"
                    name="pin"
                    value={pin}
                    placeholder="Enter PIN"
                    className="border p-3 rounded mb-10 border-secondary"
                    onChange={handlePinChange}
                    required
                  />
                </div>
                <button
                  className="drk-btn drk-btn-hover float-end"
                  onClick={handlePinSubmit}
                >
                  VERIFY
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <label
                    htmlFor="password"
                    className="mb-1 text-left text-[14px]"
                  >
                    Enter your new password:
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    placeholder="New password"
                    className="border p-3 rounded mb-10 border-secondary"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="drk-btn drk-btn-hover float-end"
                  onClick={handlePasswordSubmit}
                >
                  RESET PASSWORD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPin;
