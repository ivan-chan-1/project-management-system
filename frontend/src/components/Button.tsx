import React from "react";

type ButtonProps = {
  text: string;
  onClick?: React.MouseEventHandler;
};

function Button({ text, onClick }: ButtonProps) {
  return (
    <button className="drk-btn px-4 py-2" onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;
