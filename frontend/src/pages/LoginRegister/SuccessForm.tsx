import { useNavigate } from "react-router-dom";

interface FormProps {
  error?: boolean;
  text: string;
  message: string;
  location: string;
}

/**
 * This component displays a success or error message after a form submission.
 * @param {boolean} error - Indicates if there was an error.
 * @param {string} text - The text for the button.
 * @param {string} message - The message to display.
 * @param {string} location - The location to navigate to when the button is clicked.
 */
function SuccessForm({ error, text, message, location }: FormProps) {
  const navigate = useNavigate();
  return (
    <div className="card w-full rounded p-30 min-h-[150px] flex flex-col items-center">
      {!error && <h1 className="text-2xl font-bold">Success</h1>}
      {error && <div className="text-2xl font-bold text-red-400">Error</div>}
      <p className="text-gray-600 mt-2">{message}</p>

      <button
        className="mt-6 drk-btn drk-btn-hover w-48"
        onClick={() => navigate(`${location}`)}
      >
        {text}
      </button>
    </div>
  );
}

export default SuccessForm;
