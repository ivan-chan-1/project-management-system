interface StepperProps {
  current: number;
  steps: string[];
}

function Stepper({ current, steps }: StepperProps) {
  return (
    <>
      <div className="flex justify-center mb-20">
        <ul className="steps w-[80%]">
          {steps.map((step: string, index: number) => (
            <li
              key={index}
              className={`step text-[11px] ${current > index ? "step-primary" : ""}`}
            >
              <p className="text-[12px]">{step}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Stepper;
