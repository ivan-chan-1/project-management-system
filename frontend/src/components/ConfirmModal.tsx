interface ConfirmModalProps {
  title: string;
  message: string;
  confirm: boolean;
  confirmText: string; // "Approve" or "reject"
  successMessage: string;
  onConfirm: (accept: boolean) => void;
  onDone: () => void; // this could be a navigate
}

export default function ConfirmModal({
  title,
  message,
  confirm,
  confirmText,
  successMessage,
  onConfirm,
  onDone,
}: ConfirmModalProps) {
  return (
    <>
      <dialog id={`${confirm}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-left">{title}</h3>
          <p className="py-4 text-left">{message}</p>
          <div className="modal-action !mt-0">
            <form method="dialog">
              <button
                className="btn bg-primary border-0 outline-0 text-white mr-2"
                onClick={() => {
                  onConfirm(confirm);
                  const modal = document.getElementById(
                    `${confirm}_success_modal`,
                  ) as HTMLDialogElement | null;
                  modal?.showModal();
                }}
              >
                {confirmText}
              </button>
              <button className="btn bg-secondary border-0 outline-0">
                Cancel
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id={`${confirm}_success_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-left">Success</h3>
          <p className="py-4 text-left">{successMessage}</p>
          <div className="modal-action !mt-0">
            <form method="dialog">
              <button
                className="btn bg-secondary border-0 outline-0"
                onClick={onDone}
              >
                Close
              </button>
            </form>
            {/* </form> */}
          </div>
        </div>
      </dialog>
    </>
  );
}
