import { useNavigate } from "react-router-dom";

interface ModalProp {
  open: boolean;
  setOpen: (value: boolean) => void;
  location: string;
}

export default function SuccessModal({ open, setOpen, location }: ModalProp) {
  const navigate = useNavigate();
  const handleUpdate = () => {
    setOpen(false);
    navigate(location);
  };
  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Success!</h3>
        <p className="py-4">Your data has been saved successfully.</p>
        <div className="modal-action">
          <button
            className="drk-btn drk-btn-hover text-4xl px-4 py-2"
            onClick={handleUpdate}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
